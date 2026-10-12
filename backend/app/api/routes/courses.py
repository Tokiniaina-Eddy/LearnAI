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

    from app.models.progress import Progress
    from app.models.quiz import Quiz

    sorted_modules = sorted(course.modules, key=lambda m: m.ordre)
    # Regular learning modules (project is not counted in mandatory tracking)
    regular_modules = [m for m in sorted_modules if not ("projet" in m.titre.lower() or m.ordre == len(sorted_modules))]
    regular_modules = regular_modules if regular_modules else sorted_modules

    regular_lesson_ids = [l.id for m in regular_modules for l in m.lessons]
    completed_ids = set()
    if regular_lesson_ids:
        completed_ids = set(
            db.scalars(
                select(Progress.lesson_id).where(
                    Progress.user_id == current_user.id,
                    Progress.statut == "complete",
                    Progress.lesson_id.in_(regular_lesson_ids),
                )
            ).all()
        )

    progression = round(len(completed_ids) / len(regular_lesson_ids) * 100) if regular_lesson_ids else 0
    modules_completes = sum(1 for m in regular_modules if m.statut.value == "complete")

    # Build response dict with computed fields + quiz info per module
    modules_out = []
    for module in sorted_modules:
        quiz = db.scalar(select(Quiz).where(Quiz.module_id == module.id))
        has_quiz = True
        is_proj = (module.ordre == len(sorted_modules) or "projet" in module.titre.lower())

        # Quiz is available once all lessons of the module are completed
        all_module_lessons_done = all(
            l.statut.value == "complete" for l in module.lessons
        ) if module.lessons else False

        quiz_statut = "verrouille"
        if module.statut.value == "complete":
            quiz_statut = "complete"
        elif all_module_lessons_done:
            quiz_statut = "disponible"

        # Check existing quiz score
        mod_lesson_ids = [l.id for l in module.lessons]
        quiz_score = None
        if mod_lesson_ids:
            score_row = db.scalar(
                select(Progress.score).where(
                    Progress.user_id == current_user.id,
                    Progress.lesson_id.in_(mod_lesson_ids),
                    Progress.score.is_not(None),
                )
            )
            quiz_score = score_row

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
            "is_projet": is_proj,
            "mini_projet": {
                "titre": f"Mini-projet : {module.titre}",
                "description": f"Mets en pratique ce que tu as appris dans le module « {module.titre} » avec un cas concret (facultatif, non compté dans le suivi).",
            },
        })

    result = CourseOut.model_validate(course)
    result.progression = progression
    result.modules_completes = modules_completes
    result.modules_total = len(regular_modules)
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
def get_lesson(lesson_id: int, current_user: CurrentUser, db: DBSession, regenerate: bool = False):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon non trouvée")

    parsed_blocks = []
    if lesson.contenu:
        try:
            parsed_blocks = json.loads(lesson.contenu) if isinstance(lesson.contenu, str) else (lesson.contenu or [])
        except Exception:
            parsed_blocks = []

    # Generate content if not yet generated, explicitly requested, or if previous generation was too short (< 4 blocks)
    if not lesson.contenu or len(parsed_blocks) < 4 or regenerate:
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
        parsed_blocks = blocks

    # Build adjacent lessons for prev/next nav
    siblings = sorted(lesson.module.lessons, key=lambda l: l.ordre)
    idx = next((i for i, l in enumerate(siblings) if l.id == lesson_id), None)
    prev_lesson = siblings[idx - 1] if idx and idx > 0 else None
    next_lesson = siblings[idx + 1] if idx is not None and idx < len(siblings) - 1 else None

    detail = LessonDetail(
        id=lesson.id,
        module_id=lesson.module_id,
        titre=lesson.titre,
        contenu=parsed_blocks,
        contenu_blocks=parsed_blocks,
        ordre=lesson.ordre,
        duree=lesson.duree,
        statut=lesson.statut,
    )

    # Attach navigation
    result = detail.model_dump()
    result["contenu"] = parsed_blocks
    result["contenu_blocks"] = parsed_blocks
    result["module"] = {"id": lesson.module_id, "titre": lesson.module.titre, "cours_id": lesson.module.course_id}
    result["lesson_precedente"] = {"id": prev_lesson.id, "titre": prev_lesson.titre} if prev_lesson else None
    result["lesson_suivante"] = {"id": next_lesson.id, "titre": next_lesson.titre} if next_lesson else None
    result["quiz_id"] = lesson.quizzes[0].id if lesson.quizzes else None
    return result
