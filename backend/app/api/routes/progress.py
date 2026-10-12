from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func
from app.core.deps import DBSession, CurrentUser
from app.models.progress import Progress
from app.models.course import Lesson, Module, Course
from app.models.learning_goal import LearningGoal
from app.schemas.progress import ProgressOut, ProgressSummary

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=ProgressSummary)
@router.get("/{goal_id}", response_model=ProgressSummary)
def get_progress_summary(current_user: CurrentUser, db: DBSession, goal_id: int | None = None):
    uid = current_user.id

    # Get active or specified goal
    if goal_id:
        active_goal = db.scalar(
            select(LearningGoal).where(LearningGoal.id == goal_id, LearningGoal.user_id == uid)
        )
    else:
        active_goal = db.scalar(
            select(LearningGoal).where(LearningGoal.user_id == uid, LearningGoal.statut == "actif")
        )
        if not active_goal:
            active_goal = db.scalar(
                select(LearningGoal).where(LearningGoal.user_id == uid).order_by(LearningGoal.id.desc())
            )
    if not active_goal or not active_goal.course:
        return ProgressSummary(
            progression_globale=0, lessons_completees=0, lessons_total=0,
            quizzes_passes=0, score_moyen=0, temps_total_minutes=0,
            streak_actuel=0, streak_max=0, historique_scores=[], activite_hebdo=[], modules=[],
        )

    course = active_goal.course
    all_lessons = db.scalars(
        select(Lesson).join(Module).where(Module.course_id == course.id)
    ).all()
    lessons_total = len(all_lessons)

    all_progress = db.scalars(
        select(Progress).where(Progress.user_id == uid)
    ).all()

    completed = [p for p in all_progress if p.statut == "complete"]
    lessons_completees = len(completed)
    progression_globale = round(lessons_completees / lessons_total * 100) if lessons_total else 0

    # Calculate total time and auto-populate completed lessons missing duration
    total_seconds = 0
    updated_progress = False
    for p in all_progress:
        if p.temps_passe and p.temps_passe > 0:
            total_seconds += p.temps_passe
        elif p.statut == "complete":
            lesson = db.get(Lesson, p.lesson_id)
            duree_sec = (lesson.duree or 15) * 60 if lesson else 900
            p.temps_passe = duree_sec
            total_seconds += duree_sec
            updated_progress = True

    scores = [p.score for p in all_progress if p.score is not None]
    if scores:
        score_moyen = round(sum(scores) / len(scores))
    else:
        from app.models.skill import UserSkill
        user_skills_scores = [
            us.score for us in db.scalars(
                select(UserSkill).where(UserSkill.user_id == uid, UserSkill.score > 0)
            ).all()
        ]
        if user_skills_scores:
            score_moyen = round(sum(user_skills_scores) / len(user_skills_scores))
            for p in completed:
                if p.score is None:
                    p.score = score_moyen
                    updated_progress = True
        else:
            score_moyen = 0

    if updated_progress:
        db.commit()

    temps_total_minutes = total_seconds // 60
    quizzes_passes = sum(1 for p in all_progress if p.score is not None and p.score >= 70)

    # Streak calculation
    completed_dates = sorted(set(
        p.date_completion.date()
        for p in completed if p.date_completion
    ), reverse=True)

    streak_actuel = 0
    streak_max = 0
    current_streak = 0
    today = datetime.now(timezone.utc).date()

    for i, d in enumerate(completed_dates):
        expected = today - timedelta(days=i)
        if d == expected:
            current_streak += 1
            streak_actuel = current_streak
        else:
            break

    # Compute overall max streak
    if completed_dates:
        s = 1
        max_s = 1
        for i in range(1, len(completed_dates)):
            if (completed_dates[i - 1] - completed_dates[i]).days == 1:
                s += 1
                max_s = max(max_s, s)
            else:
                s = 1
        streak_max = max_s

    # Score history (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = [p for p in all_progress if p.score is not None and p.date_debut >= seven_days_ago]
    historique_scores = []
    for p in sorted(recent, key=lambda x: x.date_debut):
        historique_scores.append({
            "date": p.date_debut.strftime("%m/%d"),
            "score": round(p.score),
        })

    # Weekly activity (minutes per day for last 7 days)
    day_names = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    activite_hebdo = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_progs = [p for p in all_progress if p.date_debut.date() == day]
        minutes = sum(p.temps_passe for p in day_progs) // 60
        activite_hebdo.append({"jour": day_names[day.weekday()], "minutes": minutes})

    # Module breakdown
    modules_data = []
    for module in sorted(course.modules, key=lambda m: m.ordre):
        mod_lessons = module.lessons
        mod_completed = sum(
            1 for l in mod_lessons
            if any(p.lesson_id == l.id and p.statut == "complete" for p in all_progress)
        )
        mod_prog = round(mod_completed / len(mod_lessons) * 100) if mod_lessons else 0
        modules_data.append({
            "titre": module.titre,
            "progression": mod_prog,
            "statut": module.statut.value,
        })

    return ProgressSummary(
        progression_globale=progression_globale,
        lessons_completees=lessons_completees,
        lessons_total=lessons_total,
        quizzes_passes=quizzes_passes,
        score_moyen=score_moyen,
        temps_total_minutes=temps_total_minutes,
        streak_actuel=streak_actuel,
        streak_max=streak_max,
        historique_scores=historique_scores,
        activite_hebdo=activite_hebdo,
        modules=modules_data,
    )


@router.post("/lessons/{lesson_id}/complete", response_model=ProgressOut)
def complete_lesson(lesson_id: int, current_user: CurrentUser, db: DBSession):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon non trouvée")

    # Get or create progress record
    prog = db.scalar(
        select(Progress).where(Progress.user_id == current_user.id, Progress.lesson_id == lesson_id)
    )
    now = datetime.now(timezone.utc)
    duree_sec = (lesson.duree or 15) * 60

    if prog:
        prog.statut = "complete"
        prog.date_completion = now
        prog.tentatives += 1
        if not prog.temps_passe or prog.temps_passe == 0:
            prog.temps_passe = duree_sec
        else:
            prog.temps_passe += duree_sec
    else:
        prog = Progress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            statut="complete",
            date_completion=now,
            temps_passe=duree_sec,
        )
        db.add(prog)

    # Update lesson status
    from app.models.course import LessonStatut
    lesson.statut = LessonStatut.complete

    # Unlock next lesson within the current module
    module = lesson.module
    all_module_lessons = sorted(module.lessons, key=lambda l: l.ordre)
    current_lesson_idx = next((i for i, l in enumerate(all_module_lessons) if l.id == lesson_id), None)
    if current_lesson_idx is not None and current_lesson_idx + 1 < len(all_module_lessons):
        next_lesson = all_module_lessons[current_lesson_idx + 1]
        if next_lesson.statut == LessonStatut.verrouille:
            next_lesson.statut = LessonStatut.disponible
    # NOTE: The next module remains locked until the user passes the module quiz with a score >= 50!

    db.commit()
    db.refresh(prog)
    return prog
