from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class NiveauEnum(str, enum.Enum):
    debutant = "debutant"
    intermediaire = "intermediaire"
    avance = "avance"


class PreferenceEnum(str, enum.Enum):
    visual = "visual"
    pratique = "pratique"
    theorique = "theorique"
    mixte = "mixte"


class LearningProfile(Base):
    __tablename__ = "learning_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    niveau: Mapped[NiveauEnum] = mapped_column(SAEnum(NiveauEnum), default=NiveauEnum.debutant)
    temps_disponible: Mapped[int] = mapped_column(Integer, default=30)  # minutes/day
    preferences: Mapped[PreferenceEnum] = mapped_column(SAEnum(PreferenceEnum), default=PreferenceEnum.mixte)
    duree_souhaitee: Mapped[int] = mapped_column(Integer, default=4)  # weeks
    date_mise_a_jour: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="profile")
