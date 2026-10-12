from datetime import datetime
from pydantic import BaseModel
from typing import Any
from app.models.course import CourseStatut, ModuleStatut, LessonStatut, NiveauEnum


# ── Lesson (within module list) ───────────────────────────────────────────────
class LessonOut(BaseModel):
    id: int
    module_id: int
    titre: str
    contenu: str | None
    ordre: int
    duree: int
    statut: LessonStatut

    model_config = {"from_attributes": True}


class LessonDetail(BaseModel):
    """Full lesson with parsed content blocks + navigation."""
    id: int
    module_id: int
    titre: str
    contenu: Any = None
    contenu_blocks: list[dict[str, Any]] | None = None
    ordre: int
    duree: int
    statut: LessonStatut
    module: dict | None = None
    lesson_precedente: dict | None = None
    lesson_suivante: dict | None = None
    quiz_id: int | None = None

    model_config = {"from_attributes": True}


# ── Module ────────────────────────────────────────────────────────────────────
class ModuleOut(BaseModel):
    id: int
    course_id: int
    titre: str
    description: str | None
    ordre: int
    statut: ModuleStatut
    lessons: list[LessonOut] = []
    # Computed fields (set by the route handler)
    has_quiz: bool = False
    quiz_statut: str | None = None
    quiz_score: float | None = None
    is_projet: bool = False
    mini_projet: dict | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


# ── Course ────────────────────────────────────────────────────────────────────
class CourseOut(BaseModel):
    id: int
    learning_goal_id: int
    titre: str
    description: str | None
    niveau: NiveauEnum
    statut: CourseStatut
    date_creation: datetime
    modules: list[ModuleOut] = []
    # Computed fields added by route handler
    progression: float = 0.0
    modules_completes: int = 0
    modules_total: int = 0

    model_config = {"from_attributes": True, "populate_by_name": True}


# ── AI generation input ───────────────────────────────────────────────────────
class CourseGenerateRequest(BaseModel):
    goal_id: int


# ── Structured output from OpenAI (used internally) ──────────────────────────
class LessonAI(BaseModel):
    titre: str
    description: str
    duree: int  # minutes
    ordre: int


class ModuleAI(BaseModel):
    titre: str
    description: str
    ordre: int
    objectifs: list[str]
    lessons: list[LessonAI]


class CourseAI(BaseModel):
    titre: str
    description: str
    niveau: str
    modules: list[ModuleAI]
