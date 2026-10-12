from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.learning_goal import LearningGoal
from app.models.course import Lesson, Module
from app.models.progress import Progress
from app.models.skill import Skill, UserSkill
from app.schemas.dashboard import DashboardOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

XP_PER_LESSON = 50
XP_PER_QUIZ_PASS = 100
LEVEL_THRESHOLDS = [
    (0, "Débutant"),
    (200, "Apprenti"),
    (500, "Pratiquant"),
    (1000, "Confirmé"),
    (2000, "Expert"),
    (5000, "Maître"),
]


def _get_level(xp: int) -> str:
    label = LEVEL_THRESHOLDS[0][1]
    for threshold, lvl in LEVEL_THRESHOLDS:
        if xp >= threshold:
            label = lvl
    return label


def _streak(completed_dates: list) -> int:
    if not completed_dates:
        return 0
    today = datetime.now(timezone.utc).date()
    streak = 0
    for i, d in enumerate(sorted(set(completed_dates), reverse=True)):
        if d == today - timedelta(days=i):
            streak += 1
        else:
            break
    return streak


@router.get("", response_model=DashboardOut)
def get_dashboard(current_user: CurrentUser, db: DBSession):
    uid = current_user.id

    # Active goal
    active_goal = db.scalar(
        select(LearningGoal).where(LearningGoal.user_id == uid, LearningGoal.statut == "actif")
    )

    objectif_actuel = None
    progression_globale = 0.0
    module_actuel = None
    prochaine_activite = None
    modules_completes = 0
    modules_total = 0
    competences_radar = []
    points_faibles = []

    if active_goal and active_goal.course:
        course = active_goal.course
        objectif_actuel = {
            "id": active_goal.id,
            "domaine": active_goal.domaine,
            "objectif": active_goal.objectif,
            "technologie": active_goal.technologie,
        }

        all_lessons = db.scalars(
            select(Lesson).join(Module).where(Module.course_id == course.id)
        ).all()
        lessons_total = len(all_lessons)

        all_progress = db.scalars(
            select(Progress).where(Progress.user_id == uid)
        ).all()
        completed_ids = {p.lesson_id for p in all_progress if p.statut == "complete"}
        lessons_completees = len(completed_ids)

        progression_globale = round(lessons_completees / lessons_total * 100) if lessons_total else 0

        # Current module (first non-complete)
        for module in sorted(course.modules, key=lambda m: m.ordre):
            if module.statut.value in ("en_cours", "disponible"):
                module_actuel = {"id": module.id, "titre": module.titre, "ordre": module.ordre}
                # Next activity
                for lesson in sorted(module.lessons, key=lambda l: l.ordre):
                    if lesson.id not in completed_ids:
                        prochaine_activite = {
                            "type": "lesson",
                            "titre": lesson.titre,
                            "module": module.titre,
                        }
                        break
                break

        modules_completes = sum(1 for m in course.modules if m.statut.value == "complete")
        modules_total = len(course.modules)

        # Skills radar
        skills = db.scalars(select(Skill).where(Skill.learning_goal_id == active_goal.id)).all()
        for skill in skills:
            us = db.scalar(
                select(UserSkill).where(UserSkill.user_id == uid, UserSkill.skill_id == skill.id)
            )
            score = us.score if us else 0
            competences_radar.append({"sujet": skill.nom, "score": score})
            if score < 50:
                points_faibles.append(skill.nom)

    # XP & streak from all progress
    all_progress_global = db.scalars(select(Progress).where(Progress.user_id == uid)).all()
    completed_all = [p for p in all_progress_global if p.statut == "complete"]

    xp = len(completed_all) * XP_PER_LESSON
    niveau_xp = _get_level(xp)

    # Calculate total time and auto-populate completed lessons missing duration
    total_seconds = 0
    progress_updated = False
    for p in all_progress_global:
        if p.temps_passe and p.temps_passe > 0:
            total_seconds += p.temps_passe
        elif p.statut == "complete":
            lesson = db.get(Lesson, p.lesson_id)
            duree_sec = (lesson.duree or 15) * 60 if lesson else 900
            p.temps_passe = duree_sec
            total_seconds += duree_sec
            progress_updated = True

    scores = [p.score for p in all_progress_global if p.score is not None]
    if scores:
        score_moyen = round(sum(scores) / len(scores))
    else:
        # Fallback to UserSkill scores (from initial evaluation & quizzes)
        user_skills_scores = [
            us.score for us in db.scalars(
                select(UserSkill).where(UserSkill.user_id == uid, UserSkill.score > 0)
            ).all()
        ]
        if user_skills_scores:
            score_moyen = round(sum(user_skills_scores) / len(user_skills_scores))
            for p in completed_all:
                if p.score is None:
                    p.score = score_moyen
                    progress_updated = True
        else:
            score_moyen = 0

    if progress_updated:
        db.commit()

    temps_total = total_seconds // 60

    streak_dates = [p.date_completion.date() for p in completed_all if p.date_completion]
    streak = _streak(streak_dates)

    # Recent activity (last 5)
    recent_progress = sorted(
        [p for p in completed_all if p.date_completion],
        key=lambda p: p.date_completion,
        reverse=True
    )[:5]

    historique_recent = []
    for p in recent_progress:
        lesson = db.get(Lesson, p.lesson_id)
        if lesson:
            historique_recent.append({
                "date": p.date_completion.strftime("%Y-%m-%d"),
                "activite": f"Leçon : {lesson.titre}",
                "score": round(p.score) if p.score else None,
                "type": "lesson",
            })

    return DashboardOut(
        objectif_actuel=objectif_actuel,
        progression_globale=progression_globale,
        module_actuel=module_actuel,
        prochaine_activite=prochaine_activite,
        score_moyen=score_moyen,
        temps_total_minutes=temps_total,
        streak_jours=streak,
        xp=xp,
        niveau_xp=niveau_xp,
        modules_completes=modules_completes,
        modules_total=modules_total,
        competences_radar=competences_radar,
        points_faibles=points_faibles[:3],
        historique_recent=historique_recent,
    )
