import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.learning_goal import LearningGoal
from app.models.course import Course, Module, Lesson, CourseStatut, ModuleStatut, LessonStatut, NiveauEnum
from app.models.skill import Skill, UserSkill
from app.schemas.course import CourseOut, LessonDetail
from app.services import ai_service

router = APIRouter(tags=["courses"])


def _unlock_first_module(course: Course):
    """Unlock the first module and its first lesson after course generation."""
    if course.modules:
        first_mod = course.modules[0]
        first_mod.statut = ModuleStatut.en_cours
        if first_mod.lessons:
            first_mod.lessons[0].statut = LessonStatut.en_cours


@router.post("/goals/{goal_id}/course/generate", response_model=CourseOut)
def generate_course(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    # Delete existing course if regenerating
    existing = goal.course
    if existing:
        db.delete(existing)
        db.flush()

    profile = current_user.profile
    niveau = profile.niveau.value if profile else "debutant"
    temps = profile.temps_disponible if profile else 30
    duree = profile.duree_souhaitee if profile else 4

    # Get weak skills for personalisation
    user_skills = db.scalars(
        select(UserSkill)
        .join(Skill)
        .where(Skill.learning_goal_id == goal_id, UserSkill.user_id == current_user.id, UserSkill.score < 50)
    ).all()
    weak_skills = [us.skill.nom for us in user_skills]

    course_ai = ai_service.generate_course(
        objectif=goal.objectif,
        domaine=goal.domaine,
        technologie=goal.technologie,
        niveau=niveau,
        temps_disponible=temps,
        duree_souhaitee=duree,
        competences_faibles=weak_skills if weak_skills else None,
    )

    # Persist to DB
    course = Course(
        learning_goal_id=goal_id,
        titre=course_ai.titre,
        description=course_ai.description,
        niveau=NiveauEnum(course_ai.niveau) if course_ai.niveau in NiveauEnum._value2member_map_ else NiveauEnum.debutant,
        statut=CourseStatut.actif,
    )
    db.add(course)
    db.flush()

    for mod_ai in course_ai.modules:
        module = Module(
            course_id=course.id,
            titre=mod_ai.titre,
            description=mod_ai.description,
            ordre=mod_ai.ordre,
            statut=ModuleStatut.verrouille,
        )
        db.add(module)
        db.flush()

        for lesson_ai in mod_ai.lessons:
            lesson = Lesson(
                module_id=module.id,
                titre=lesson_ai.titre,
                ordre=lesson_ai.ordre,
                duree=lesson_ai.duree,
                statut=LessonStatut.verrouille,
            )
            db.add(lesson)

    db.flush()
    # Reload relationships
    db.refresh(course)

    # Generate skills if not already present
    existing_skills = db.scalars(select(Skill).where(Skill.learning_goal_id == goal_id)).all()
    if not existing_skills:
        module_titres = [m.titre for m in course.modules]
        skills_data = ai_service.extract_skills(
            objectif=goal.objectif,
            technologie=goal.technologie or goal.domaine,
            modules=module_titres,
        )
        for i, s in enumerate(skills_data):
            skill = Skill(
                learning_goal_id=goal_id,
                nom=s["nom"],
                description=s.get("description"),
                ordre=i,
            )
            db.add(skill)
            db.flush()
            user_skill = UserSkill(user_id=current_user.id, skill_id=skill.id, score=0.0)
            db.add(user_skill)

    _unlock_first_module(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/goals/{goal_id}/course", response_model=CourseOut)
def get_course(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    course = goal.course
    if not course:
        raise HTTPException(status_code=404, detail="Parcours non généré. Lance /generate d'abord.")

    # Compute progression
    total_lessons = sum(len(m.lessons) for m in course.modules)
    from app.models.progress import Progress
    completed_progress = db.scalars(
        select(Progress)
        .join(Lesson)
        .join(Module)
        .where(Module.course_id == course.id, Progress.user_id == current_user.id, Progress.statut == "complete")
    ).all()
    completed_ids = {p.lesson_id for p in completed_progress}
    progression = round(len(completed_ids) / total_lessons * 100) if total_lessons else 0
    modules_completes = sum(1 for m in course.modules if m.statut.value == "complete")

    # Build response dict with computed fields + quiz info per module
    from app.models.quiz import Quiz
    modules_out = []
    for module in sorted(course.modules, key=lambda m: m.ordre):
        quiz = db.scalar(select(Quiz).where(Quiz.module_id == module.id))
        has_quiz = quiz is not None
        quiz_statut = None
        quiz_score = None
        if has_quiz:
            # Check if user has submitted this quiz (simplistic — look at skill scores proxy)
            quiz_statut = "complete" if module.statut.value == "complete" else (
                "disponible" if module.statut.value in ("en_cours", "complete") else "verrouille"
            )

        modules_out.append({
            "id": module.id,
            "course_id": module.course_id,
            "titre": module.titre,
            "description": module.description,
            "ordre": module.ordre,
            "statut": module.statut,
            "lessons": module.lessons,
            "has_quiz": has_quiz,
            "quiz_statut": quiz_statut,
            "quiz_score": quiz_score,
        })

    result = CourseOut.model_validate(course)
    result.progression = progression
    result.modules_completes = modules_completes
    result.modules_total = len(course.modules)
    # Override modules with enriched data
    from app.schemas.course import ModuleOut
    result.modules = [ModuleOut.model_validate(m) for m in modules_out]
    return result


@router.get("/modules/{module_id}")
def get_module(module_id: int, current_user: CurrentUser, db: DBSession):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module non trouvé")
    return module


@router.get("/lessons/{lesson_id}", response_model=LessonDetail)
def get_lesson(lesson_id: int, current_user: CurrentUser, db: DBSession):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon non trouvée")

    # Generate content if not yet generated
    if not lesson.contenu:
        module = lesson.module
        course = module.course
        goal = course.goal
        profile = current_user.profile
        niveau = profile.niveau.value if profile else "debutant"

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

    # Build adjacent lessons for prev/next nav
    siblings = sorted(lesson.module.lessons, key=lambda l: l.ordre)
    idx = next((i for i, l in enumerate(siblings) if l.id == lesson_id), None)
    prev_lesson = siblings[idx - 1] if idx and idx > 0 else None
    next_lesson = siblings[idx + 1] if idx is not None and idx < len(siblings) - 1 else None

    parsed_blocks = json.loads(lesson.contenu) if lesson.contenu else []

    detail = LessonDetail.model_validate(lesson)
    detail.contenu_blocks = parsed_blocks

    # Attach navigation (not in schema strictly, use dict trick via model)
    result = detail.model_dump()
    result["module"] = {"id": lesson.module_id, "titre": lesson.module.titre, "cours_id": lesson.module.course_id}
    result["lesson_precedente"] = {"id": prev_lesson.id, "titre": prev_lesson.titre} if prev_lesson else None
    result["lesson_suivante"] = {"id": next_lesson.id, "titre": next_lesson.titre} if next_lesson else None
    result["quiz_id"] = lesson.quizzes[0].id if lesson.quizzes else None
    return result
