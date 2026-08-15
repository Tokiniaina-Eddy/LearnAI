from pydantic import BaseModel
from app.models.exercise import DifficulteEnum


class ExerciseOut(BaseModel):
    id: int
    lesson_id: int
    titre: str
    enonce: str
    difficulte: DifficulteEnum
    type: str

    model_config = {"from_attributes": True}


class ExerciseSubmit(BaseModel):
    code: str | None = None
    reponse: str | None = None


class ExerciseFeedback(BaseModel):
    correct: bool
    score: float
    feedback: str
    suggestion: str | None = None
