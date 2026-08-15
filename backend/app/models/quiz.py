from sqlalchemy import String, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id"), nullable=True)
    module_id: Mapped[int | None] = mapped_column(ForeignKey("modules.id"), nullable=True)
    titre: Mapped[str] = mapped_column(String(255))

    lesson: Mapped["Lesson | None"] = relationship(back_populates="quizzes")
    module: Mapped["Module | None"] = relationship(back_populates="quizzes")
    questions: Mapped[list["Question"]] = relationship(back_populates="quiz", order_by="Question.id")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"))
    question: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20), default="mcq")  # mcq | open
    options: Mapped[list | None] = mapped_column(JSON, nullable=True)  # list of strings for MCQ
    reponse: Mapped[int | None] = mapped_column(Integer, nullable=True)  # index for MCQ
    explication: Mapped[str | None] = mapped_column(Text, nullable=True)

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")
