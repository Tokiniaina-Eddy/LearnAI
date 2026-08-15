from datetime import datetime
from pydantic import BaseModel


class ProgressOut(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    statut: str
    score: float | None
    tentatives: int
    temps_passe: int
    date_debut: datetime
    date_completion: datetime | None

    model_config = {"from_attributes": True}


class ProgressSummary(BaseModel):
    progression_globale: float
    lessons_completees: int
    lessons_total: int
    quizzes_passes: int
    score_moyen: float
    temps_total_minutes: int
    streak_actuel: int
    streak_max: int
    historique_scores: list[dict]
    activite_hebdo: list[dict]
    modules: list[dict]
