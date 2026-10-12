from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole, AuthProvider


# ── Schémas d'inscription / connexion ─────────────────────────────────────────

class UserCreate(BaseModel):
    nom: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None


# ── Schéma de sortie utilisateur ──────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    nom: str
    email: str
    role: UserRole
    date_creation: datetime
    is_email_verified: bool
    auth_provider: AuthProvider
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Token de sortie ───────────────────────────────────────────────────────────

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── OTP — Vérification email ──────────────────────────────────────────────────

class VerifyEmailRequest(BaseModel):
    """Saisie du code OTP de confirmation d'adresse email."""
    email: EmailStr
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Le code OTP doit être exactement 6 chiffres")
        return v


class ResendOTPRequest(BaseModel):
    """Demande de renvoi du code OTP de confirmation email."""
    email: EmailStr


# ── OTP — Réinitialisation mot de passe ──────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    """Demande de réinitialisation : envoi de l'OTP à l'email."""
    email: EmailStr


class VerifyResetOTPRequest(BaseModel):
    """Vérification du code OTP de réinitialisation (étape intermédiaire)."""
    email: EmailStr
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Le code OTP doit être exactement 6 chiffres")
        return v


class ResetPasswordRequest(BaseModel):
    """Soumission du nouveau mot de passe avec le code OTP."""
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("otp")
    @classmethod
    def otp_format(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Le code OTP doit être exactement 6 chiffres")
        return v

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le nouveau mot de passe doit contenir au moins 8 caractères")
        return v


# ── Réponses génériques ───────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class RegisterPendingResponse(BaseModel):
    """Réponse après inscription : indique que l'email est en attente de vérification."""
    message: str
    email: str
    requires_verification: bool = True
