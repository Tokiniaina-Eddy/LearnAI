import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.learning_goal import LearningGoal
from app.models.skill import Skill, UserSkill
from app.schemas.evaluation import EvaluationOut, EvalQuestionOut, EvalSubmit, EvaluationResult, CompetenceScore
from app.services import ai_service

router = APIRouter(tags=["evaluation"])

# In-memory store for evaluation questions (keyed by goal_id)
# In production this would be stored in Redis or DB
_eval_cache: dict[int, list] = {}


@router.post("/goals/{goal_id}/evaluation/generate", response_model=EvaluationOut)
def generate_evaluation(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    profile = current_user.profile
    niveau = profile.niveau.value if profile else "debutant"

    eval_data = ai_service.generate_evaluation(
        objectif=goal.objectif,
        domaine=goal.domaine,
        technologie=goal.technologie,
        niveau=niveau,
    )

    # Cache full questions (with answers) server-side
    _eval_cache[goal_id] = [q.model_dump() for q in eval_data.questions]

    # Return questions WITHOUT the answer field
    questions_out = [
        EvalQuestionOut(
            id=q.id,
            type=q.type,
            question=q.question,
            options=q.options,
            placeholder=q.placeholder,
        )
        for q in eval_data.questions
    ]
    return EvaluationOut(goal_id=goal_id, questions=questions_out)


@router.post("/goals/{goal_id}/evaluation/submit", response_model=EvaluationResult)
def submit_evaluation(goal_id: int, payload: EvalSubmit, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    # Retrieve cached questions
    cached = _eval_cache.get(goal_id)
    if not cached:
        raise HTTPException(status_code=400, detail="Évaluation non trouvée ou expirée. Régénère-la.")

    from app.schemas.evaluation import EvalQuestionAI
    questions = [EvalQuestionAI(**q) for q in cached]

    result = ai_service.analyze_evaluation(
        objectif=goal.objectif,
        technologie=goal.technologie,
        questions=questions,
        answers=payload.answers,
    )

    # Persist/update UserSkills
    for comp in result.get("competences", []):
        skill = db.scalar(
            select(Skill).where(Skill.learning_goal_id == goal_id, Skill.nom == comp["nom"])
        )
        if not skill:
            skill = Skill(
                learning_goal_id=goal_id,
                nom=comp["nom"],
                description=comp.get("description"),
            )
            db.add(skill)
            db.flush()

        user_skill = db.scalar(
            select(UserSkill).where(UserSkill.user_id == current_user.id, UserSkill.skill_id == skill.id)
        )
        if user_skill:
            old_score = user_skill.score
            user_skill.score = comp["score"]
            user_skill.tendance = "up" if comp["score"] > old_score else ("down" if comp["score"] < old_score else "stable")
        else:
            user_skill = UserSkill(user_id=current_user.id, skill_id=skill.id, score=comp["score"])
            db.add(user_skill)

    db.commit()

    competences = [CompetenceScore(nom=c["nom"], score=c["score"]) for c in result.get("competences", [])]
    return EvaluationResult(
        score=result["score"],
        niveau_estime=result["niveau_estime"],
        feedback=result["feedback"],
        competences=competences,
    )
