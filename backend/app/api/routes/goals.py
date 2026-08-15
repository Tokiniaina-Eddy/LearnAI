from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.core.deps import DBSession, CurrentUser
from app.models.learning_goal import LearningGoal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
def list_goals(current_user: CurrentUser, db: DBSession):
    return db.scalars(select(LearningGoal).where(LearningGoal.user_id == current_user.id)).all()


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, current_user: CurrentUser, db: DBSession):
    goal = LearningGoal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(goal_id: int, current_user: CurrentUser, db: DBSession):
    goal = db.get(LearningGoal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")
    return goal


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
