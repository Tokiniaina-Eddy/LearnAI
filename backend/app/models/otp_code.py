"""
Modèle OTPCode — stockage sécurisé des codes OTP à 6 chiffres.

Le code OTP est HASHÉ avant stockage (bcrypt via passlib).
On ne stocke jamais le code en clair en base de données.

Types :
- email_verification : envoyé lors de l'inscription pour confirmer l'email
- password_reset     : envoyé lors de la demande de réinitialisation du mot de passe
"""
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SAEnum, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class OTPType(str, enum.Enum):
    email_verification = "email_verification"
    password_reset = "password_reset"


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[OTPType] = mapped_column(SAEnum(OTPType), nullable=False)

    # Code hashé (jamais en clair en base)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Durée de vie
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Suivi des tentatives
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Marqué True après vérification réussie (pour invalider la réutilisation)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="otp_codes")
