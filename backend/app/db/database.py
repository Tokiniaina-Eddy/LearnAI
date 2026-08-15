from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Supabase (et PostgreSQL distant en général) requiert SSL
# On l'active automatiquement si l'URL pointe vers supabase.co
_is_supabase = "supabase.co" in settings.DATABASE_URL

_connect_args = {"sslmode": "require"} if _is_supabase else {}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,         # réduit pour Supabase free tier (limite de connexions)
    max_overflow=10,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
