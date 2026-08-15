from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Progress(Base):
    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    statut: Mapped[str] = mapped_column(String(20), default="en_cours")  # en_cours | complete
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    tentatives: Mapped[int] = mapped_column(Integer, default=1)
    temps_passe: Mapped[int] = mapped_column(Integer, default=0)  # seconds
    date_completion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    date_debut: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="progress")
    lesson: Mapped["Lesson"] = relationship(back_populates="progress")
