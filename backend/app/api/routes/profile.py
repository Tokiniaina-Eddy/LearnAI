from fastapi import APIRouter, HTTPException, status
from app.core.deps import DBSession, CurrentUser
from app.models.learning_profile import LearningProfile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(current_user: CurrentUser, db: DBSession):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    return profile


@router.post("", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreate, current_user: CurrentUser, db: DBSession):
    if current_user.profile:
        # Update existing
        for key, val in payload.model_dump().items():
            setattr(current_user.profile, key, val)
        db.commit()
        db.refresh(current_user.profile)
        return current_user.profile
    profile = LearningProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, current_user: CurrentUser, db: DBSession):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé, crée-le d'abord")
    for key, val in payload.model_dump().items():
        setattr(profile, key, val)
    db.commit()
    db.refresh(profile)
    return profile
