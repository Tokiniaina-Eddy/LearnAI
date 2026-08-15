from sqlalchemy import String, Integer, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class DifficulteEnum(str, enum.Enum):
    facile = "facile"
    moyen = "moyen"
    difficile = "difficile"


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    titre: Mapped[str] = mapped_column(String(255))
    enonce: Mapped[str] = mapped_column(Text)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulte: Mapped[DifficulteEnum] = mapped_column(SAEnum(DifficulteEnum), default=DifficulteEnum.moyen)
    type: Mapped[str] = mapped_column(String(30), default="code")  # code | texte | qcm

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")
