from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.exercise import Exercise
from app.models.course import Lesson
from app.schemas.exercise import ExerciseOut, ExerciseSubmit, ExerciseFeedback
from app.services import ai_service

router = APIRouter(tags=["exercises"])


@router.get("/lessons/{lesson_id}/exercises", response_model=list[ExerciseOut])
def get_exercises(lesson_id: int, current_user: CurrentUser, db: DBSession):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon non trouvée")
    return lesson.exercises


@router.post("/exercises/{exercise_id}/submit", response_model=ExerciseFeedback)
def submit_exercise(exercise_id: int, payload: ExerciseSubmit, current_user: CurrentUser, db: DBSession):
    exercise = db.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercice non trouvé")

    lesson = exercise.lesson
    goal = lesson.module.course.goal
    profile = current_user.profile
    niveau = profile.niveau.value if profile else "debutant"

    reponse = payload.code or payload.reponse or ""
    if not reponse.strip():
        raise HTTPException(status_code=422, detail="La réponse ne peut pas être vide")

    result = ai_service.analyze_exercise(
        enonce=exercise.enonce,
        solution_attendue=exercise.solution,
        reponse_utilisateur=reponse,
        technologie=goal.technologie or goal.domaine,
        niveau=niveau,
    )

    return ExerciseFeedback(
        correct=result.get("correct", False),
        score=result.get("score", 0),
        feedback=result.get("feedback", ""),
        suggestion=result.get("suggestion"),
    )
