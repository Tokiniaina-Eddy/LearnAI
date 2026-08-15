from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
import enum


class CourseStatut(str, enum.Enum):
    en_generation = "en_generation"
    actif = "actif"
    complete = "complete"
    archive = "archive"


class NiveauEnum(str, enum.Enum):
    debutant = "debutant"
    intermediaire = "intermediaire"
    avance = "avance"


class ModuleStatut(str, enum.Enum):
    verrouille = "verrouille"
    disponible = "disponible"
    en_cours = "en_cours"
    complete = "complete"


class LessonStatut(str, enum.Enum):
    verrouille = "verrouille"
    disponible = "disponible"
    en_cours = "en_cours"
    complete = "complete"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    learning_goal_id: Mapped[int] = mapped_column(ForeignKey("learning_goals.id"), unique=True)
    titre: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    niveau: Mapped[NiveauEnum] = mapped_column(SAEnum(NiveauEnum), default=NiveauEnum.debutant)
    statut: Mapped[CourseStatut] = mapped_column(SAEnum(CourseStatut), default=CourseStatut.actif)
    date_creation: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    goal: Mapped["LearningGoal"] = relationship(back_populates="course")
    modules: Mapped[list["Module"]] = relationship(back_populates="course", order_by="Module.ordre")


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    titre: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=1)
    statut: Mapped[ModuleStatut] = mapped_column(SAEnum(ModuleStatut), default=ModuleStatut.verrouille)

    course: Mapped["Course"] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="module", order_by="Lesson.ordre")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="module")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"))
    titre: Mapped[str] = mapped_column(String(255))
    contenu: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of content blocks
    ordre: Mapped[int] = mapped_column(Integer, default=1)
    duree: Mapped[int] = mapped_column(Integer, default=15)  # minutes
    statut: Mapped[LessonStatut] = mapped_column(SAEnum(LessonStatut), default=LessonStatut.verrouille)

    module: Mapped["Module"] = relationship(back_populates="lessons")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="lesson")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="lesson")
    progress: Mapped[list["Progress"]] = relationship(back_populates="lesson")
