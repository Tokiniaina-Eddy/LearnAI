from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class GoalStatut(str, enum.Enum):
    actif = "actif"
    complete = "complete"
    pause = "pause"
    archive = "archive"


class LearningGoal(Base):
    __tablename__ = "learning_goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    domaine: Mapped[str] = mapped_column(String(100))
    technologie: Mapped[str | None] = mapped_column(String(100), nullable=True)
    objectif: Mapped[str] = mapped_column(Text)
    duree: Mapped[int | None] = mapped_column(Integer, nullable=True)  # weeks
    statut: Mapped[GoalStatut] = mapped_column(SAEnum(GoalStatut), default=GoalStatut.actif)
    date_creation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="goals")
    course: Mapped["Course | None"] = relationship(back_populates="goal", uselist=False)
    skills: Mapped[list["Skill"]] = relationship(back_populates="goal")
