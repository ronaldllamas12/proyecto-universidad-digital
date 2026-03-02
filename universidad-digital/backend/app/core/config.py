import os
import json
from typing import Annotated, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings import NoDecode
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Configuración centralizada."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_",
        extra="ignore",
        enable_decoding=False,
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

    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    auto_create_tables: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if value is None:
            return []

        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        if isinstance(value, str):
            raw_value = value.strip()
            if not raw_value:
                return []

            if raw_value.startswith("["):
                parsed = json.loads(raw_value)
                if not isinstance(parsed, list):
                    raise ValueError("APP_CORS_ORIGINS debe ser una lista JSON o texto separado por comas.")
                return [str(item).strip() for item in parsed if str(item).strip()]

            return [origin.strip() for origin in raw_value.split(",") if origin.strip()]

        raise ValueError("APP_CORS_ORIGINS tiene un formato inválido.")

    @property
    def db_url(self) -> str:
        # Render/Vercel pueden definir estas variables automáticamente
        db = (
            os.getenv("DATABASE_URL")
            or self.database_url
        )

        if self.is_production and not (
            os.getenv("DATABASE_URL") ):
            raise RuntimeError(
                "DATABASE_URL (o APP_DATABASE_URL) es obligatorio en producción."
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