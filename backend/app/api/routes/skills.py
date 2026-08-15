from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.learning_goal import LearningGoal
from app.models.skill import Skill, UserSkill
from app.schemas.skill import SkillOut, SkillMapOut

router = APIRouter(tags=["skills"])


@router.get("/goals/{goal_id}/skills", response_model=SkillMapOut)
def get_skill_map(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    skills = db.scalars(select(Skill).where(Skill.learning_goal_id == goal_id)).all()
    result = []
    for skill in sorted(skills, key=lambda s: s.ordre):
        user_skill = db.scalar(
            select(UserSkill).where(
                UserSkill.user_id == current_user.id,
                UserSkill.skill_id == skill.id,
            )
        )
        result.append(SkillOut(
            id=skill.id,
            nom=skill.nom,
            description=skill.description,
            score=user_skill.score if user_skill else 0.0,
            tendance=user_skill.tendance if user_skill else "stable",
        ))

    score_global = round(sum(s.score for s in result) / len(result)) if result else 0
    return SkillMapOut(goal_id=goal_id, skills=result, score_global=score_global)
