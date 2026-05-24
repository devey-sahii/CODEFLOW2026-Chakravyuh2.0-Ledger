from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    # ─── App ─────────────────────────────────────────────────────────────────
    APP_NAME: str = "Smart Expense Auditor"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── Security ────────────────────────────────────────────────────────────
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ENCRYPTION_KEY: str = "dev-encryption-key-32bytepadding!"

    # ─── Database ────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://sea_user:sea_pass@localhost:5432/smart_expense_auditor"
    SYNC_DATABASE_URL: str = "postgresql://sea_user:sea_pass@localhost:5432/smart_expense_auditor"

    # ─── Redis ───────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ─── Gemini AI ───────────────────────────────────────────────────────────                     

    # ─── AWS S3 ──────────────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = "mock-key"
    AWS_SECRET_ACCESS_KEY: str = "mock-secret"
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: str = "smart-expense-auditor-receipts"
    USE_MOCK_S3: bool = True

    # ─── Email ───────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "Smart Expense Auditor <noreply@smartexpenseauditor.ai>"

    # ─── CORS ────────────────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
