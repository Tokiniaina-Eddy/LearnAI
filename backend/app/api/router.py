from fastapi import APIRouter
from app.api.routes import auth, profile, goals, evaluation, courses, quizzes, exercises, progress, skills, tutor, dashboard

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(goals.router)
api_router.include_router(evaluation.router)
api_router.include_router(courses.router)
api_router.include_router(quizzes.router)
api_router.include_router(exercises.router)
api_router.include_router(progress.router)
api_router.include_router(skills.router)
api_router.include_router(tutor.router)
api_router.include_router(dashboard.router)
