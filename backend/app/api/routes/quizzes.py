from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.course import Lesson, Module
from app.models.quiz import Quiz, Question
from app.schemas.quiz import QuizOut, QuizSubmit, QuizResult
from app.services import ai_service

router = APIRouter(tags=["quizzes"])


def _get_or_generate_quiz(lesson_id: int | None, module_id: int | None, db, current_user) -> Quiz:
    """Get existing quiz or generate one via AI."""
    query = select(Quiz)
    if lesson_id:
        query = query.where(Quiz.lesson_id == lesson_id)
    elif module_id:
        query = query.where(Quiz.module_id == module_id)

    quiz = db.scalar(query)
    if quiz:
        return quiz

    # Generate quiz via AI
    if lesson_id:
        lesson = db.get(Lesson, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Leçon non trouvée")
        module = lesson.module
        course = module.course
        goal = course.goal
        titre_sujet = lesson.titre
        titre_module = module.titre
    else:
        module = db.get(Module, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module non trouvé")
        course = module.course
        goal = course.goal
        titre_sujet = module.titre
        titre_module = module.titre

    profile = current_user.profile
    niveau = profile.niveau.value if profile else "debutant"

    quiz_ai = ai_service.generate_quiz(
        lesson_titre=titre_sujet,
        module_titre=titre_module,
        technologie=goal.technologie or goal.domaine,
        niveau=niveau,
        nb_questions=5,
    )

    quiz = Quiz(
        lesson_id=lesson_id,
        module_id=module_id,
        titre=quiz_ai.titre,
    )
    db.add(quiz)
    db.flush()

    for q_ai in quiz_ai.questions:
        question = Question(
            quiz_id=quiz.id,
            question=q_ai.question,
            type=q_ai.type,
            options=q_ai.options,
            reponse=q_ai.reponse,
            explication=q_ai.explication,
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/lessons/{lesson_id}/quiz", response_model=QuizOut)
def get_lesson_quiz(lesson_id: int, current_user: CurrentUser, db: DBSession):
    quiz = _get_or_generate_quiz(lesson_id=lesson_id, module_id=None, db=db, current_user=current_user)
    return quiz


@router.get("/quizzes/module/{module_id}", response_model=QuizOut)
def get_module_quiz(module_id: int, current_user: CurrentUser, db: DBSession):
    quiz = _get_or_generate_quiz(lesson_id=None, module_id=module_id, db=db, current_user=current_user)
    return quiz


@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, current_user: CurrentUser, db: DBSession):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    return quiz


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResult)
def submit_quiz(quiz_id: int, payload: QuizSubmit, current_user: CurrentUser, db: DBSession):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")

    mcq_questions = [q for q in quiz.questions if q.type == "mcq"]
    total = len(mcq_questions)
    correct_count = 0
    details = []

    for q in mcq_questions:
        answer = payload.answers.get(q.id)
        is_correct = answer is not None and int(answer) == q.reponse
        if is_correct:
            correct_count += 1
        details.append({
            "question_id": q.id,
            "question": q.question,
            "correct": is_correct,
            "given_answer": answer,
            "correct_answer": q.reponse,
            "explication": q.explication,
        })

    score = round((correct_count / total * 100)) if total else 0
    passed = score >= 70

    # Update skill scores based on quiz result
    if quiz.lesson_id:
        lesson = db.get(Lesson, quiz.lesson_id)
        goal_id = lesson.module.course.learning_goal_id if lesson else None
    elif quiz.module_id:
        module = db.get(Module, quiz.module_id)
        goal_id = module.course.learning_goal_id if module else None
    else:
        goal_id = None

    if goal_id:
        from app.models.skill import Skill, UserSkill
        user_skills = db.scalars(
            select(UserSkill)
            .join(Skill)
            .where(Skill.learning_goal_id == goal_id, UserSkill.user_id == current_user.id)
        ).all()
        for us in user_skills:
            old = us.score
            # Nudge skill score toward quiz score
            us.score = round(min(100, max(0, old * 0.7 + score * 0.3)), 1)
            us.tendance = "up" if us.score > old else ("down" if us.score < old else "stable")
        db.commit()

    return QuizResult(
        quiz_id=quiz_id,
        score=score,
        correct=correct_count,
        total=total,
        passed=passed,
        details=details,
    )
