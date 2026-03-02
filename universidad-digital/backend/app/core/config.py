import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuración centralizada."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_",
        extra="ignore"
    )

    env: str = Field(default="development")

    # fallback si no existe variable
    database_url: str = Field(
        default="postgresql+psycopg://postgres:admin@localhost:5433/universidad"
    )

    api_title: str = "Universidad Digital API"
    api_version: str = "1.0.0"

    jwt_secret: str | None = None
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    cookie_name: str = "access_token"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    cors_origins: list[str] = Field(default_factory=list)
    auto_create_tables: bool = True

    @property
    def db_url(self) -> str:
        # Render/Vercel pueden definir estas variables automáticamente
        db = (
            os.getenv("DATABASE_URL")
            or self.database_url
        )

        # SQLAlchemy necesita el driver psycopg
        if db.startswith("postgresql://"):
            db = db.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return db

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"


settings = Settings()