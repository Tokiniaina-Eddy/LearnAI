from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    apprenant = "apprenant"
    admin = "admin"


class AuthProvider(str, enum.Enum):
    email = "email"
    google = "google"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # Nullable pour les utilisateurs Google (pas de mot de passe local)
    mot_de_passe: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.apprenant)
    date_creation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # ── Email verification ────────────────────────────────────────────────────
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── OAuth ─────────────────────────────────────────────────────────────────
    auth_provider: Mapped[AuthProvider] = mapped_column(
        SAEnum(AuthProvider), default=AuthProvider.email
    )
    google_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # ── Legacy reset_token (conservé pour compatibilité, remplacé par OTPCode) ─
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    profile: Mapped["LearningProfile | None"] = relationship(back_populates="user", uselist=False)
    goals: Mapped[list["LearningGoal"]] = relationship(back_populates="user")
    progress: Mapped[list["Progress"]] = relationship(back_populates="user")
    user_skills: Mapped[list["UserSkill"]] = relationship(back_populates="user")
    conversations: Mapped[list["AIConversation"]] = relationship(back_populates="user")
    otp_codes: Mapped[list["OTPCode"]] = relationship(back_populates="user", cascade="all, delete-orphan")
