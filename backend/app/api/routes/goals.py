from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.learning_goal import LearningGoal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut

from app.models.progress import Progress
from app.models.course import Lesson, Module

router = APIRouter(prefix="/goals", tags=["goals"])


def _enrich_goal(goal: LearningGoal, db: DBSession, user_id: int) -> GoalOut:
    out = GoalOut.model_validate(goal)
    if goal.course and goal.course.modules:
        modules = sorted(goal.course.modules, key=lambda m: m.ordre)
        # Regular modules for progress tracking (learning lessons)
        regular_modules = [m for m in modules if not ("projet" in m.titre.lower() or m.ordre == len(modules))]
        regular_modules = regular_modules if regular_modules else modules
        
        all_regular_lesson_ids = [l.id for m in regular_modules for l in m.lessons]
        completed_count = 0
        if all_regular_lesson_ids:
            completed_count = len(db.scalars(
                select(Progress).where(
                    Progress.user_id == user_id,
                    Progress.statut == "complete",
                    Progress.lesson_id.in_(all_regular_lesson_ids)
                )
            ).all())

        out.progression = round(completed_count / len(all_regular_lesson_ids) * 100) if all_regular_lesson_ids else 0
        out.modules_completes = sum(1 for m in modules if m.statut.value == "complete")
        out.modules_total = len(modules)
        
        # Find next available lesson
        for m in modules:
            for l in m.lessons:
                if l.statut.value in ("en_cours", "disponible"):
                    out.prochaine_lecon = {"id": l.id, "titre": l.titre}
                    break
            if out.prochaine_lecon:
                break
    return out


@router.get("", response_model=list[GoalOut])
def list_goals(current_user: CurrentUser, db: DBSession):
    goals = db.scalars(select(LearningGoal).where(LearningGoal.user_id == current_user.id)).all()
    return [_enrich_goal(g, db, current_user.id) for g in goals]


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, current_user: CurrentUser, db: DBSession):
    goal = LearningGoal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _enrich_goal(goal, db, current_user.id)


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")
    return _enrich_goal(goal, db, current_user.id)


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, payload: GoalUpdate, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")
    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(goal, key, val)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")
    db.delete(goal)
    db.commit()
