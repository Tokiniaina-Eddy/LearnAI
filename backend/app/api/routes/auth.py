"""
Routes d'authentification LearnAI.

Endpoints :
  POST /auth/register              — Inscription email+password (envoie OTP)
  POST /auth/verify-email          — Vérification OTP confirmation email
  POST /auth/resend-verification   — Renvoi OTP confirmation email
  POST /auth/login                 — Connexion email+password
  GET  /auth/me                    — Profil utilisateur courant
  PUT  /auth/me                    — Mise à jour profil
  POST /auth/forgot-password       — Demande réinitialisation (envoie OTP)
  POST /auth/verify-reset-otp      — Vérification OTP reset (sans changer le mdp)
  POST /auth/reset-password        — Réinitialisation mot de passe avec OTP
  GET  /auth/google                — Redirect vers Google OAuth
  GET  /auth/google/callback       — Callback Google OAuth
"""
import secrets
import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, and_

from app.core.config import settings
from app.core.deps import DBSession, CurrentUser
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, AuthProvider
from app.models.otp_code import OTPCode, OTPType
from app.schemas.user import (
    UserCreate, UserLogin, UserOut, TokenOut, UserUpdate,
    VerifyEmailRequest, ResendOTPRequest,
    ForgotPasswordRequest, VerifyResetOTPRequest, ResetPasswordRequest,
    MessageResponse, RegisterPendingResponse,
)
from app.services.email_service import send_verification_email, send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Helpers OTP ───────────────────────────────────────────────────────────────

def _generate_otp() -> str:
    """Génère un code OTP à 6 chiffres cryptographiquement sûr."""
    return f"{secrets.randbelow(1000000):06d}"


def _hash_otp(otp: str) -> str:
    """Hache le code OTP avec bcrypt avant stockage."""
    return hash_password(otp)


def _verify_otp_hash(plain: str, hashed: str) -> bool:
    """Vérifie un code OTP contre son hash bcrypt."""
    return verify_password(plain, hashed)


def _create_otp_record(
    db: DBSession,
    user: User,
    otp_type: OTPType,
    otp_plain: str,
) -> OTPCode:
    """
    Invalide tous les anciens OTP du même type pour cet utilisateur,
    puis crée et persiste un nouveau record OTPCode.
    """
    # Invalider les anciens OTP du même type (évite la réutilisation d'anciens codes)
    old_codes = db.scalars(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.type == otp_type,
                OTPCode.is_used == False,  # noqa: E712
            )
        )
    ).all()
    for old in old_codes:
        old.is_used = True  # Invalide sans supprimer (auditabilité)

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp_record = OTPCode(
        user_id=user.id,
        type=otp_type,
        code_hash=_hash_otp(otp_plain),
        expires_at=expires_at,
        attempts=0,
        is_used=False,
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)
    return otp_record


def _get_active_otp(db: DBSession, user: User, otp_type: OTPType) -> OTPCode | None:
    """Retourne le dernier OTP actif (non utilisé, non expiré) pour un utilisateur."""
    return db.scalar(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.type == otp_type,
                OTPCode.is_used == False,  # noqa: E712
                OTPCode.expires_at > datetime.now(timezone.utc),
            )
        ).order_by(OTPCode.created_at.desc())
    )


def _check_resend_cooldown(db: DBSession, user: User, otp_type: OTPType) -> None:
    """
    Vérifie le cooldown et la limite horaire de renvoi d'OTP.
    Lève HTTPException 429 si la limite est dépassée.
    """
    now = datetime.now(timezone.utc)
    cooldown_threshold = now - timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
    hourly_threshold = now - timedelta(hours=1)

    # Vérifier le cooldown (délai minimum entre deux envois)
    recent = db.scalar(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.type == otp_type,
                OTPCode.created_at > cooldown_threshold,
            )
        ).order_by(OTPCode.created_at.desc())
    )
    if recent:
        elapsed = (now - recent.created_at.replace(tzinfo=timezone.utc)).seconds
        remaining = settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Veuillez patienter {remaining} secondes avant de demander un nouveau code.",
        )

    # Vérifier la limite horaire
    hourly_count = db.scalar(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.type == otp_type,
                OTPCode.created_at > hourly_threshold,
            )
        )
    )
    # Compter manuellement (scalar retourne le premier record ou None)
    hourly_count_val = len(
        db.scalars(
            select(OTPCode).where(
                and_(
                    OTPCode.user_id == user.id,
                    OTPCode.type == otp_type,
                    OTPCode.created_at > hourly_threshold,
                )
            )
        ).all()
    )
    if hourly_count_val >= settings.OTP_MAX_RESEND_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de demandes de code. Veuillez réessayer dans une heure.",
        )


def _verify_otp_code(
    db: DBSession,
    user: User,
    otp_type: OTPType,
    otp_plain: str,
) -> OTPCode:
    """
    Vérifie un code OTP soumis par l'utilisateur.
    Gère les tentatives, l'expiration et le blocage.
    Retourne l'OTPCode si valide, lève HTTPException sinon.
    """
    # Chercher le dernier OTP actif (non utilisé, non expiré)
    otp_record = db.scalar(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.type == otp_type,
                OTPCode.is_used == False,  # noqa: E712
            )
        ).order_by(OTPCode.created_at.desc())
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun code actif trouvé. Veuillez demander un nouveau code.",
        )

    # Vérifier si le code est expiré
    now = datetime.now(timezone.utc)
    expires = otp_record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now > expires:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le code a expiré. Veuillez demander un nouveau code.",
        )

    # Vérifier le nombre de tentatives
    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de tentatives incorrectes. Veuillez demander un nouveau code.",
        )

    # Incrémenter le compteur de tentatives avant vérification
    otp_record.attempts += 1
    db.commit()

    # Vérifier le code
    if not _verify_otp_hash(otp_plain, otp_record.code_hash):
        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempts
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Trop de tentatives incorrectes. Veuillez demander un nouveau code.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code incorrect. Il vous reste {remaining} tentative(s).",
        )

    # Code valide : marquer comme utilisé
    otp_record.is_used = True
    otp_record.verified_at = datetime.now(timezone.utc)
    db.commit()
    return otp_record


# ── 1. Inscription ─────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterPendingResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: DBSession):
    """
    Crée un compte, génère un OTP et l'envoie par email.
    Le compte n'est pas activé tant que l'email n'est pas vérifié.
    """
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        if existing.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte existe déjà avec cet email.",
            )
        # Compte non vérifié existant : renvoyer un OTP plutôt que d'en créer un doublon
        _check_resend_cooldown(db, existing, OTPType.email_verification)
        otp_plain = _generate_otp()
        _create_otp_record(db, existing, OTPType.email_verification, otp_plain)
        try:
            send_verification_email(existing.email, existing.nom, otp_plain)
        except Exception:
            pass  # Ne pas bloquer l'inscription si l'email échoue
        return RegisterPendingResponse(
            message="Un nouveau code de vérification a été envoyé à votre adresse email.",
            email=existing.email,
        )

    user = User(
        nom=payload.nom,
        email=payload.email,
        mot_de_passe=hash_password(payload.password),
        is_email_verified=False,
        auth_provider=AuthProvider.email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    otp_plain = _generate_otp()
    _create_otp_record(db, user, OTPType.email_verification, otp_plain)
    try:
        send_verification_email(user.email, user.nom, otp_plain)
    except Exception as exc:
        logger.error(f"Échec envoi OTP inscription {user.email}: {exc}")

    return RegisterPendingResponse(
        message="Compte créé. Vérifiez votre adresse email pour activer votre compte.",
        email=user.email,
    )


# ── 2. Vérification email ─────────────────────────────────────────────────────

@router.post("/verify-email", response_model=TokenOut)
def verify_email(payload: VerifyEmailRequest, db: DBSession):
    """
    Vérifie le code OTP de confirmation d'email.
    Active le compte et retourne un JWT si le code est valide.
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun compte trouvé avec cet email.",
        )
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est déjà vérifié.",
        )

    _verify_otp_code(db, user, OTPType.email_verification, payload.otp)

    # Activer le compte
    user.is_email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


# ── 3. Renvoi OTP de confirmation email ───────────────────────────────────────

@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(payload: ResendOTPRequest, db: DBSession):
    """
    Renvoie un code OTP de confirmation email.
    Respecte le cooldown et la limite horaire.
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    # Réponse générique pour ne pas révéler si l'email existe
    if not user or user.is_email_verified:
        return MessageResponse(
            message="Si ce compte existe et n'est pas encore vérifié, un nouveau code a été envoyé."
        )

    _check_resend_cooldown(db, user, OTPType.email_verification)

    otp_plain = _generate_otp()
    _create_otp_record(db, user, OTPType.email_verification, otp_plain)
    try:
        send_verification_email(user.email, user.nom, otp_plain)
    except Exception as exc:
        logger.error(f"Échec renvoi OTP vérification {user.email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible d'envoyer le code. Veuillez réessayer.",
        )

    return MessageResponse(message="Un nouveau code de vérification a été envoyé.")


# ── 4. Connexion ──────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: DBSession):
    """
    Connecte un utilisateur email+password.
    Refuse la connexion si l'email n'est pas vérifié.
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not user.mot_de_passe:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    if not verify_password(payload.password, user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Veuillez vérifier votre adresse email avant de vous connecter.",
            headers={"X-Requires-Verification": "true"},
        )

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


# ── 5. Profil courant ─────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: CurrentUser, db: DBSession):
    if payload.nom is not None:
        current_user.nom = payload.nom
    if payload.email is not None:
        existing = db.scalar(
            select(User).where(
                and_(User.email == payload.email, User.id != current_user.id)
            )
        )
        if existing:
            raise HTTPException(status_code=409, detail="Email déjà utilisé.")
        current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return current_user


# ── 6. Mot de passe oublié ────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: DBSession):
    """
    Génère un OTP de réinitialisation et l'envoie par email.
    Répond toujours 200 pour ne pas révéler l'existence du compte.
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    generic_response = MessageResponse(
        message="Si ce compte existe, un code de réinitialisation a été envoyé à votre adresse email."
    )

    if not user:
        return generic_response

    # Les comptes Google sans mot de passe local ne peuvent pas réinitialiser via OTP email
    if user.auth_provider == AuthProvider.google and not user.mot_de_passe:
        return generic_response

    try:
        _check_resend_cooldown(db, user, OTPType.password_reset)
    except HTTPException:
        # Ne pas révéler le cooldown pour éviter l'énumération
        return generic_response

    otp_plain = _generate_otp()
    _create_otp_record(db, user, OTPType.password_reset, otp_plain)
    try:
        send_password_reset_email(user.email, user.nom, otp_plain)
    except Exception as exc:
        logger.error(f"Échec envoi OTP reset {user.email}: {exc}")

    return generic_response


# ── 7. Vérification OTP reset (étape intermédiaire) ───────────────────────────

@router.post("/verify-reset-otp", response_model=MessageResponse)
def verify_reset_otp(payload: VerifyResetOTPRequest, db: DBSession):
    """
    Vérifie le code OTP de réinitialisation SANS changer le mot de passe.
    Permet au frontend d'afficher le formulaire de nouveau mot de passe
    uniquement si l'OTP est valide.

    Note : Le code reste valide pour l'étape suivante (reset-password),
    car on ne le marque pas comme utilisé ici — il sera consommé à l'étape finale.
    On utilise une vérification "peek" : on incrémente les tentatives
    mais on ne marque pas is_used=True.
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun compte trouvé avec cet email.",
        )

    otp_record = db.scalar(
        select(OTPCode).where(
            and_(
                OTPCode.user_id == user.id,
                OTPCode.type == OTPType.password_reset,
                OTPCode.is_used == False,  # noqa: E712
            )
        ).order_by(OTPCode.created_at.desc())
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun code actif trouvé. Veuillez demander un nouveau code.",
        )

    now = datetime.now(timezone.utc)
    expires = otp_record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now > expires:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le code a expiré. Veuillez demander un nouveau code.",
        )

    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de tentatives incorrectes. Veuillez demander un nouveau code.",
        )

    otp_record.attempts += 1
    db.commit()

    if not _verify_otp_hash(payload.otp, otp_record.code_hash):
        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempts
        if remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Trop de tentatives incorrectes. Veuillez demander un nouveau code.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code incorrect. Il vous reste {remaining} tentative(s).",
        )

    # Code valide — NE PAS marquer is_used ici, sera consommé dans reset-password
    # On réinitialise le compteur pour laisser la tentative finale libre
    otp_record.attempts -= 1
    db.commit()

    return MessageResponse(message="Code valide. Vous pouvez maintenant créer un nouveau mot de passe.")


# ── 8. Réinitialisation mot de passe ─────────────────────────────────────────

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: DBSession):
    """
    Vérifie l'OTP et remplace le mot de passe.
    L'OTP est consommé après usage (is_used=True).
    """
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun compte trouvé avec cet email.",
        )

    _verify_otp_code(db, user, OTPType.password_reset, payload.otp)

    user.mot_de_passe = hash_password(payload.new_password)
    # S'assurer que le compte est activé si un reset réussit
    if not user.is_email_verified:
        user.is_email_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
    db.commit()

    return MessageResponse(message="Votre mot de passe a été réinitialisé avec succès.")


# ── 9. Google OAuth ───────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    """
    Redirige vers la page de consentement Google OAuth2.
    Génère un state aléatoire pour la protection CSRF.
    """
    if not settings.google_oauth_enabled:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="L'authentification Google n'est pas configurée.",
        )

    state = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
        "prompt": "select_account",
    }
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
def google_callback(code: str | None = None, error: str | None = None, state: str | None = None, db: DBSession = None):
    """
    Callback Google OAuth2.
    Échange le code contre un access token Google, récupère le profil,
    crée ou connecte le compte, redirige vers le frontend avec le JWT LearnAI.
    """
    frontend_url = settings.FRONTEND_URL

    # Gestion erreur / annulation OAuth
    if error or not code:
        return RedirectResponse(
            url=f"{frontend_url}/login?error=google_cancelled"
        )

    if not settings.google_oauth_enabled:
        return RedirectResponse(
            url=f"{frontend_url}/login?error=google_not_configured"
        )

    # Échange du code contre les tokens Google
    try:
        with httpx.Client(timeout=10) as client:
            token_response = client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()

            # Récupération du profil Google
            user_info_response = client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            user_info_response.raise_for_status()
            google_user = user_info_response.json()

    except Exception as exc:
        logger.error(f"Erreur OAuth Google: {exc}")
        return RedirectResponse(
            url=f"{frontend_url}/login?error=google_failed"
        )

    google_id: str = google_user.get("id", "")
    email: str = google_user.get("email", "")
    nom: str = google_user.get("name", email.split("@")[0])
    avatar_url: str | None = google_user.get("picture")

    if not email:
        return RedirectResponse(url=f"{frontend_url}/login?error=google_no_email")

    # Chercher un compte existant par google_id ou par email
    user = db.scalar(select(User).where(User.google_id == google_id))
    if not user:
        user = db.scalar(select(User).where(User.email == email))

    is_new_user = False

    if user:
        # Compte existant : mettre à jour les infos Google si nécessaire
        if not user.google_id:
            user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        # Marquer email comme vérifié (Google garantit la vérification)
        if not user.is_email_verified:
            user.is_email_verified = True
            user.email_verified_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    else:
        # Nouveau compte via Google
        is_new_user = True
        user = User(
            nom=nom,
            email=email,
            mot_de_passe=None,  # Pas de mot de passe local
            auth_provider=AuthProvider.google,
            google_id=google_id,
            avatar_url=avatar_url,
            is_email_verified=True,  # Google garantit l'email
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Générer le JWT LearnAI et rediriger vers le frontend
    # is_new_user=true → le frontend redirigera vers l'onboarding
    jwt_token = create_access_token(user.id)
    new_param = "&new=true" if is_new_user else ""
    return RedirectResponse(
        url=f"{frontend_url}/auth/google/callback?token={jwt_token}{new_param}"
    )
