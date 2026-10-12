from pydantic import BaseModel


class QuestionOut(BaseModel):
    id: int
    quiz_id: int
    question: str
    type: str
    options: list[str] | None
    reponse: int | None
    explication: str | None

    model_config = {"from_attributes": True}


class QuizOut(BaseModel):
    id: int
    lesson_id: int | None
    module_id: int | None
    goal_id: int | None = None
    course_id: int | None = None
    titre: str
    questions: list[QuestionOut] = []

    model_config = {"from_attributes": True}


class QuizSubmit(BaseModel):
    answers: dict[int, int | str]  # question_id -> answer (index or text)


class QuizResult(BaseModel):
    quiz_id: int
    score: float
    correct: int
    total: int
    passed: bool
    module_debloque: bool = False
    details: list[dict]


# Structured AI output for quiz generation
class QuestionAI(BaseModel):
    question: str
    type: str = "mcq"
    options: list[str] | None = None
    reponse: int | None = None
    explication: str


class QuizAI(BaseModel):
    titre: str
    questions: list[QuestionAI]
