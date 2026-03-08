from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """Datos requeridos para crear un usuario."""

    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    role_ids: list[int] | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name_no_html(cls, value: str) -> str:
        normalized = value.strip()
        if "<" in normalized or ">" in normalized:
            raise ValueError("full_name no puede contener etiquetas HTML.")
        return normalized


class UserUpdate(BaseModel):
    """Datos permitidos para actualizar un usuario."""

    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None
    role_ids: list[int] | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name_no_html(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if "<" in normalized or ">" in normalized:
            raise ValueError("full_name no puede contener etiquetas HTML.")
        return normalized


class UserResponse(BaseModel):
    """Datos expuestos al cliente."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime
    roles: list[str] = []

    @field_validator("roles", mode="before")
    @classmethod
    def _coerce_roles(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            if not value:
                return []
            if isinstance(value[0], str):
                return value
            return [getattr(role, "name", str(role)) for role in value]
        return [str(value)]