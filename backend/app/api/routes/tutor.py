from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.ai_conversation import AIConversation
from app.schemas.tutor import TutorRequest, TutorResponse
from app.services import ai_service

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/chat", response_model=TutorResponse)
def chat(payload: TutorRequest, current_user: CurrentUser, db: DBSession):
    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="Le message ne peut pas être vide")

    profile = current_user.profile
    niveau = profile.niveau.value if profile else "debutant"

    # Get active goal's technology for context
    from app.models.learning_goal import LearningGoal
    active_goal = db.scalar(
        select(LearningGoal).where(
            LearningGoal.user_id == current_user.id,
            LearningGoal.statut == "actif"
        )
    )
    technologie = active_goal.technologie or active_goal.domaine if active_goal else ""

    response_text, tokens_used = ai_service.tutor_chat(
        message=payload.message,
        history=[m.model_dump() for m in payload.history],
        context=payload.context,
        niveau=niveau,
        technologie=technologie,
    )

    # Persist conversation
    lesson_id = payload.context.get("lesson_id") if payload.context else None
    conv = AIConversation(
        user_id=current_user.id,
        lesson_id=int(lesson_id) if lesson_id else None,
        contexte=payload.context,
        message=payload.message,
        reponse=response_text,
        tokens_utilises=tokens_used,
    )
    db.add(conv)
    db.commit()

    return TutorResponse(response=response_text, tokens_used=tokens_used)


@router.get("/history/{lesson_id}")
def get_history(lesson_id: int, current_user: CurrentUser, db: DBSession):
    conversations = db.scalars(
        select(AIConversation)
        .where(AIConversation.user_id == current_user.id, AIConversation.lesson_id == lesson_id)
        .order_by(AIConversation.date)
        .limit(50)
    ).all()
    result = []
    for c in conversations:
        result.append({"role": "user", "content": c.message, "date": c.date.isoformat()})
        result.append({"role": "assistant", "content": c.reponse, "date": c.date.isoformat()})
    return result
