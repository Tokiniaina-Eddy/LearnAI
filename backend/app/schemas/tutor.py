from pydantic import BaseModel


class TutorMessage(BaseModel):
    role: str  # user | assistant
    content: str


class TutorRequest(BaseModel):
    message: str
    context: dict | None = None   # {lesson_id, lesson_titre}
    history: list[TutorMessage] = []


class TutorResponse(BaseModel):
    response: str
    tokens_used: int = 0
