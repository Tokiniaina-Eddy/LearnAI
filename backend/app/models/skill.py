from sqlalchemy import String, Integer, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    learning_goal_id: Mapped[int] = mapped_column(ForeignKey("learning_goals.id"))
    nom: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0)

    goal: Mapped["LearningGoal"] = relationship(back_populates="skills")
    user_skills: Mapped[list["UserSkill"]] = relationship(back_populates="skill")


class UserSkill(Base):
    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    score: Mapped[float] = mapped_column(Float, default=0.0)
    tendance: Mapped[str] = mapped_column(String(10), default="stable")  # up | down | stable

    user: Mapped["User"] = relationship(back_populates="user_skills")
    skill: Mapped["Skill"] = relationship(back_populates="user_skills")
