from pydantic import BaseModel


class DashboardOut(BaseModel):
    objectif_actuel: dict | None
    progression_globale: float
    module_actuel: dict | None
    prochaine_activite: dict | None
    score_moyen: float
    temps_total_minutes: int
    streak_jours: int
    xp: int
    niveau_xp: str
    modules_completes: int
    modules_total: int
    competences_radar: list[dict]
    points_faibles: list[str]
    historique_recent: list[dict]
