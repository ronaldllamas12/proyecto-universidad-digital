"""Configuración centralizada para la aplicación."""

import json
import os
from typing import Any, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración centralizada."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_",
        extra="ignore",
        enable_decoding=False,
    )

    env: str = Field(default="development", description="Environment name")

    # fallback si no existe variable
    database_url: str = Field(
        default="postgresql+psycopg://postgres:admin@localhost:5433/universidad"
    )

    api_title: str = "Universidad Digital API"
    api_version: str = "1.0.0"

    jwt_secret: str | None = None
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    password_reset_token_expiration_minutes: int = 15

    mailtrap_api_token: str | None = None
    mailtrap_api_url: str = "https://send.api.mailtrap.io/api/send"
    mail_http_timeout_seconds: int = 15
    mail_from_email: str | None = None
    mail_from_name: str | None = None
    frontend_url: str | None = None
    frontend_reset_password_url: str = (
        "https://proyecto-universidad-digital-zj37.vercel.app"
    )
    cookie_name: str = "access_token"
    cookie_secure: bool = True if env == "production" else False
    cookie_samesite: Literal["lax", "strict", "none"] = (
        "none" if env == "production" else "lax"
    )

    cors_origins: list[str] = Field(default_factory=list)
    auto_create_tables: bool = True

    seed_admin_email: str = "admin@universidad.edu"
    seed_admin_password: str = "Admin1234567!"
    seed_admin_name: str = "Administrador"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        """Permite configurar CORS_ORIGINS como una lista JSON,
        texto separado por comas o una lista real."""
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
                    raise ValueError(
                        "APP_CORS_ORIGINS debe ser una lista JSON o texto separado por comas."
                    )
                return [str(item).strip() for item in parsed if str(item).strip()]

            return [origin.strip() for origin in raw_value.split(",") if origin.strip()]

        raise ValueError("APP_CORS_ORIGINS tiene un formato inválido.")

    @field_validator("cookie_samesite", mode="before")
    @classmethod
    def validate_cookie_samesite(cls, value: Any) -> Literal["lax", "strict", "none"]:
        """Valida que APP_COOKIE_SAMESITE sea lax, strict o none, sin importar mayúsculas o espacios."""
        normalized = str(value).strip().lower()
        allowed = {"lax", "strict", "none"}
        if normalized not in allowed:
            raise ValueError("APP_COOKIE_SAMESITE debe ser: lax, strict o none.")
        return normalized  # type: ignore[return-value]

    @field_validator("frontend_reset_password_url", mode="before")
    @classmethod
    def normalize_frontend_reset_password_url(cls, value: Any) -> str:
        raw = str(value).strip() if value is not None else ""
        if not raw:
            raise ValueError("APP_FRONTEND_RESET_PASSWORD_URL es obligatorio.")
        return raw

    @field_validator("frontend_url", mode="before")
    @classmethod
    def normalize_frontend_url(cls, value: Any) -> str | None:
        raw = str(value).strip() if value is not None else ""
        return raw or None

    @property
    def db_url(self) -> str:
        # Render/Vercel pueden definir estas variables automáticamente
        db = (
            os.getenv("DATABASE_URL")
            or os.getenv("APP_DATABASE_URL")
            or self.database_url
        )

        if self.is_production and not (os.getenv("DATABASE_URL")):
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
        return str(self.env).lower() == "production"


settings = Settings()
