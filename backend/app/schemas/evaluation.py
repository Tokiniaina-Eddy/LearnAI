from pydantic import BaseModel


# AI generates this structure for initial evaluation
class EvalQuestionAI(BaseModel):
    id: int
    type: str  # mcq | open
    question: str
    options: list[str] | None = None
    answer: int | None = None  # correct index (kept server-side)
    explication: str | None = None
    placeholder: str | None = None


class EvaluationAI(BaseModel):
    questions: list[EvalQuestionAI]


# What we send back to frontend (no answer leak)
class EvalQuestionOut(BaseModel):
    id: int
    type: str
    question: str
    options: list[str] | None = None
    placeholder: str | None = None


class EvaluationOut(BaseModel):
    goal_id: int
    questions: list[EvalQuestionOut]


# Submission
class EvalSubmit(BaseModel):
    answers: dict[int, int | str]   # question_id -> answer


# Results
class CompetenceScore(BaseModel):
    nom: str
    score: float


class EvaluationResult(BaseModel):
    score: float
    niveau_estime: str
    feedback: str
    competences: list[CompetenceScore]
    duree_secondes: int | None = None
