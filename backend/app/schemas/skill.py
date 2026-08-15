from pydantic import BaseModel


class SkillOut(BaseModel):
    id: int
    nom: str
    description: str | None
    score: float
    tendance: str

    model_config = {"from_attributes": True}


class SkillMapOut(BaseModel):
    goal_id: int
    skills: list[SkillOut]
    score_global: float


# Structured AI output for skill extraction
class SkillAI(BaseModel):
    nom: str
    description: str
