from datetime import datetime
from pydantic import BaseModel
from app.models.learning_goal import GoalStatut


class GoalCreate(BaseModel):
    domaine: str
    technologie: str | None = None
    objectif: str
    duree: int | None = None
    statut: GoalStatut = GoalStatut.actif


class GoalUpdate(BaseModel):
    domaine: str | None = None
    technologie: str | None = None
    objectif: str | None = None
    duree: int | None = None
    statut: GoalStatut | None = None


class GoalOut(BaseModel):
    id: int
    user_id: int
    domaine: str
    technologie: str | None
    objectif: str
    duree: int | None
    statut: GoalStatut
    date_creation: datetime
    # Computed fields for progress gauge
    progression: float = 0.0
    modules_completes: int = 0
    modules_total: int = 0
    prochaine_lecon: dict | None = None

    model_config = {"from_attributes": True}
