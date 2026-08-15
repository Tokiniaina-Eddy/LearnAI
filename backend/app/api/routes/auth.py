import secrets
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenOut, ForgotPasswordRequest, ResetPasswordRequest, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: DBSession):
    # Check email uniqueness
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte existe déjà avec cet email",
        )
    user = User(
        nom=payload.nom,
        email=payload.email,
        mot_de_passe=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: DBSession):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: CurrentUser, db: DBSession):
    if payload.nom is not None:
        current_user.nom = payload.nom
    if payload.email is not None:
        # Check new email is not taken
        existing = db.scalar(select(User).where(User.email == payload.email, User.id != current_user.id))
        if existing:
            raise HTTPException(status_code=409, detail="Email déjà utilisé")
        current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, db: DBSession):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        db.commit()
        # TODO: send email with reset link containing reset_token
        # For now we just confirm silently (don't leak if user exists)
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: DBSession):
    user = db.scalar(select(User).where(User.reset_token == payload.token))
    if not user:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="Mot de passe trop court (8 caractères min)")
    user.mot_de_passe = hash_password(payload.new_password)
    user.reset_token = None
    db.commit()
    return {"message": "Mot de passe réinitialisé avec succès"}
