import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, delete
from app.core.deps import DBSession, CurrentUser
from app.models.course import Lesson, Module
from app.models.quiz import Quiz, Question
from app.models.progress import Progress
from app.schemas.quiz import QuizOut, QuizSubmit, QuizResult
from app.services import ai_service

router = APIRouter(tags=["quizzes"])


def _extract_lesson_text(contenu_data, titre: str = "") -> str:
    """Format stored lesson blocks into clear readable text for the AI prompt."""
    if not contenu_data:
        return ""
    if isinstance(contenu_data, str):
        try:
            blocks = json.loads(contenu_data)
        except Exception:
            return str(contenu_data)
    elif isinstance(contenu_data, list):
        blocks = contenu_data
    elif isinstance(contenu_data, dict):
        blocks = contenu_data.get("blocks", [])
    else:
        return str(contenu_data)

    parts = [f"=== LEÇON : {titre} ==="]
    for b in (blocks if isinstance(blocks, list) else []):
        b_type = b.get("type", "")
        if b_type == "intro":
            parts.append(f"Explications et concepts :\n{b.get('texte', '')}")
        elif b_type == "code":
            parts.append(
                f"Exemple de code ({b.get('langage', '')}) - {b.get('titre', '')}:\n"
                f"```\n{b.get('code', '')}\n```\n"
                f"Explication détaillée :\n{b.get('explication', '')}"
            )
        elif b_type == "info":
            parts.append(f"Remarque / Bonne pratique ({b.get('titre', '')}):\n{b.get('texte', '')}")
        elif b_type == "resume":
            points = "\n- ".join(b.get("points", []))
            parts.append(f"Points clés enseignés :\n- {points}")
    return "\n\n".join(parts)


def _get_or_generate_quiz(
    lesson_id: int | None,
    module_id: int | None,
    db,
    current_user,
    regenerate: bool = False,
) -> Quiz:
    """Get existing quiz or generate one via AI strictly based on actual lesson content."""
    query = select(Quiz)
    if lesson_id:
        query = query.where(Quiz.lesson_id == lesson_id)
    elif module_id:
        query = query.where(Quiz.module_id == module_id)

    quiz = db.scalar(query)
    if quiz and not regenerate:
        return quiz

    profile = current_user.profile
    niveau = profile.niveau.value if profile else "debutant"

    # Generate quiz via AI based on real lesson content
    if lesson_id:
        lesson = db.get(Lesson, lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Leçon non trouvée")
        module = lesson.module
        course = module.course
        goal = course.goal
        titre_sujet = lesson.titre
        titre_module = module.titre

        # Ensure lesson has content
        if not lesson.contenu:
            blocks = ai_service.generate_lesson_content(
                lesson_titre=lesson.titre,
                module_titre=module.titre,
                cours_titre=course.titre,
                niveau=niveau,
                technologie=goal.technologie or goal.domaine,
            )
            lesson.contenu = json.dumps(blocks, ensure_ascii=False)
            db.commit()
            db.refresh(lesson)

        contenu_lecon = _extract_lesson_text(lesson.contenu, lesson.titre)
    else:
        module = db.get(Module, module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module non trouvé")
        course = module.course
        goal = course.goal
        titre_sujet = module.titre
        titre_module = module.titre

        # Gather actual content across module lessons
        lessons_parts = []
        for l in sorted(module.lessons, key=lambda x: x.ordre):
            if not l.contenu:
                try:
                    blocks = ai_service.generate_lesson_content(
                        lesson_titre=l.titre,
                        module_titre=module.titre,
                        cours_titre=course.titre,
                        niveau=niveau,
                        technologie=goal.technologie or goal.domaine,
                    )
                    l.contenu = json.dumps(blocks, ensure_ascii=False)
                    db.commit()
                    db.refresh(l)
                except Exception:
                    pass
            content_str = _extract_lesson_text(l.contenu, l.titre)
            if content_str:
                lessons_parts.append(content_str)
            else:
                lessons_parts.append(f"Leçon : {l.titre}")
        contenu_lecon = "\n\n".join(lessons_parts)

    quiz_ai = ai_service.generate_quiz(
        lesson_titre=titre_sujet,
        module_titre=titre_module,
        technologie=goal.technologie or goal.domaine,
        niveau=niveau,
        nb_questions=5,
        contenu_lecon=contenu_lecon,
    )

    if quiz:
        # Clear old questions for regeneration
        db.execute(delete(Question).where(Question.quiz_id == quiz.id))
        quiz.titre = quiz_ai.titre
    else:
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


def _format_quiz_out(quiz: Quiz, db: DBSession) -> QuizOut:
    out = QuizOut.model_validate(quiz)
    goal_id = None
    course_id = None
    if quiz.module_id:
        module = db.get(Module, quiz.module_id)
        if module and module.course:
            course_id = module.course_id
            goal_id = module.course.learning_goal_id
    elif quiz.lesson_id:
        lesson = db.get(Lesson, quiz.lesson_id)
        if lesson and lesson.module and lesson.module.course:
            course_id = lesson.module.course_id
            goal_id = lesson.module.course.learning_goal_id
    out.goal_id = goal_id
    out.course_id = course_id
    return out


@router.get("/lessons/{lesson_id}/quiz", response_model=QuizOut)
def get_lesson_quiz(lesson_id: int, current_user: CurrentUser, db: DBSession, regenerate: bool = False):
    quiz = _get_or_generate_quiz(lesson_id=lesson_id, module_id=None, db=db, current_user=current_user, regenerate=regenerate)
    return _format_quiz_out(quiz, db)


@router.get("/quizzes/module/{module_id}", response_model=QuizOut)
def get_module_quiz(module_id: int, current_user: CurrentUser, db: DBSession, regenerate: bool = False):
    quiz = _get_or_generate_quiz(lesson_id=None, module_id=module_id, db=db, current_user=current_user, regenerate=regenerate)
    return _format_quiz_out(quiz, db)


@router.post("/quizzes/{quiz_id}/regenerate", response_model=QuizOut)
def regenerate_quiz(quiz_id: int, current_user: CurrentUser, db: DBSession):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    new_quiz = _get_or_generate_quiz(
        lesson_id=quiz.lesson_id,
        module_id=quiz.module_id,
        db=db,
        current_user=current_user,
        regenerate=True,
    )
    return _format_quiz_out(new_quiz, db)


@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, current_user: CurrentUser, db: DBSession):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    return _format_quiz_out(quiz, db)


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
    # Minimum 50% required to pass and unlock the next module!
    passed = score >= 50
    now = datetime.now(timezone.utc)
    module_debloque = False

    # Save quiz score and time on Progress records
    target_module = None
    if quiz.lesson_id:
        lesson = db.get(Lesson, quiz.lesson_id)
        goal_id = lesson.module.course.learning_goal_id if lesson else None
        target_module = lesson.module if lesson else None
        prog = db.scalar(
            select(Progress).where(Progress.user_id == current_user.id, Progress.lesson_id == quiz.lesson_id)
        )
        if prog:
            prog.score = score
            prog.temps_passe = (prog.temps_passe or 0) + 300
        else:
            prog = Progress(
                user_id=current_user.id,
                lesson_id=quiz.lesson_id,
                score=score,
                temps_passe=300,
                statut="complete",
                date_completion=now,
            )
            db.add(prog)
    elif quiz.module_id:
        module = db.get(Module, quiz.module_id)
        target_module = module
        goal_id = module.course.learning_goal_id if module else None
        if module and module.lessons:
            for l in module.lessons:
                prog = db.scalar(
                    select(Progress).where(Progress.user_id == current_user.id, Progress.lesson_id == l.id)
                )
                if prog:
                    prog.score = score
                    prog.temps_passe = (prog.temps_passe or 0) + 120
                else:
                    prog = Progress(
                        user_id=current_user.id,
                        lesson_id=l.id,
                        score=score,
                        temps_passe=(l.duree or 15) * 60 + 120,
                        statut="complete",
                        date_completion=now,
                    )
                    db.add(prog)
    else:
        goal_id = None

    # Module completion and unlocking the next module ONLY if score >= 50!
    if target_module:
        from app.models.course import ModuleStatut, LessonStatut
        if passed:
            target_module.statut = ModuleStatut.complete
            course_modules = sorted(target_module.course.modules, key=lambda m: m.ordre)
            current_idx = next((i for i, m in enumerate(course_modules) if m.id == target_module.id), None)
            if current_idx is not None and current_idx + 1 < len(course_modules):
                next_module = course_modules[current_idx + 1]
                if next_module.statut == ModuleStatut.verrouille:
                    next_module.statut = ModuleStatut.en_cours
                    if next_module.lessons:
                        next_module.lessons[0].statut = LessonStatut.disponible
                    module_debloque = True

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
        module_debloque=module_debloque,
        details=details,
    )
