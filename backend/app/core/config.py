from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "LearnAI"
    APP_ENV: str = "development"

    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = "insecure_dev_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://learnai:learnai@localhost:5432/learnai"

    # ── OpenAI ────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Rate limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    OPENAI_RATE_LIMIT_PER_HOUR: int = 100

    # ── Email (SMTP) ──────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "LearnAI"
    SMTP_FROM_EMAIL: str = "noreply@learnai.dev"
    # Mettre à False pour désactiver l'envoi en développement (log en console)
    SMTP_ENABLED: bool = False

    # ── OTP ───────────────────────────────────────────────────────────────────
    OTP_EXPIRE_MINUTES: int = 10          # Durée de vie du code OTP
    OTP_MAX_ATTEMPTS: int = 5             # Tentatives max avant blocage
    OTP_RESEND_COOLDOWN_SECONDS: int = 60 # Délai minimum entre deux renvois
    OTP_MAX_RESEND_PER_HOUR: int = 5      # Renvois max par heure

    # ── Google OAuth ──────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    # URL de callback côté backend (doit correspondre à la config Google Console)
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    # URL frontend vers laquelle rediriger après OAuth avec le JWT
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
