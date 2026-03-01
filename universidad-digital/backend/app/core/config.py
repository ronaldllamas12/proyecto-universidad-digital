from __future__ import annotations

import os

from dotenv import load_dotenv
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    """Configuración centralizada de la aplicación."""

    @property
    def db_url(self) -> str:
        vercel_db = os.getenv("POSTGRES_URL")
        if vercel_db:
            if vercel_db.startswith("postgresql://"):
                return vercel_db.replace("postgresql://", "postgresql+psycopg://", 1)
            return vercel_db
        return self.database_url

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")

    env: str = Field(default="development")

    database_url: str = Field(
        default="postgresql+psycopg://postgres:admin@localhost:5433/universidad")
    api_title: str = "Universidad Digital API"
    api_version: str = "1.0.0"


    jwt_secret: str | None = Field(default=None)
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = Field(default=60)
    cookie_name: str = "access_token"
    cookie_secure: bool = Field(default=False)
    cookie_samesite: str = Field(default="lax")

    cors_origins: list[str] = Field(default_factory=list)

    auto_create_tables: bool = True

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"

settings = Settings()
