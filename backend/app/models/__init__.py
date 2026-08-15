# Import all models so Alembic autogenerate picks them up
from app.models.user import User
from app.models.learning_profile import LearningProfile
from app.models.learning_goal import LearningGoal
from app.models.course import Course, Module, Lesson
from app.models.quiz import Quiz, Question
from app.models.exercise import Exercise
from app.models.progress import Progress
from app.models.skill import Skill, UserSkill
from app.models.ai_conversation import AIConversation
