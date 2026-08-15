from datetime import datetime
from pydantic import BaseModel
from app.models.learning_profile import NiveauEnum, PreferenceEnum


class ProfileCreate(BaseModel):
    niveau: NiveauEnum = NiveauEnum.debutant
    temps_disponible: int = 30
    preferences: PreferenceEnum = PreferenceEnum.mixte
    duree_souhaitee: int = 4


class ProfileUpdate(ProfileCreate):
    pass


class ProfileOut(BaseModel):
    id: int
    user_id: int
    niveau: NiveauEnum
    temps_disponible: int
    preferences: PreferenceEnum
    duree_souhaitee: int
    date_mise_a_jour: datetime

    model_config = {"from_attributes": True}
