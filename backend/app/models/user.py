from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    apprenant = "apprenant"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    mot_de_passe: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.apprenant)
    date_creation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    profile: Mapped["LearningProfile | None"] = relationship(back_populates="user", uselist=False)
    goals: Mapped[list["LearningGoal"]] = relationship(back_populates="user")
    progress: Mapped[list["Progress"]] = relationship(back_populates="user")
    user_skills: Mapped[list["UserSkill"]] = relationship(back_populates="user")
    conversations: Mapped[list["AIConversation"]] = relationship(back_populates="user")
