from __future__ import annotations

import re

from pydantic import BaseModel, field_validator

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


class LoginRequest(BaseModel):
    """Credenciales de inicio de sesión."""

    email: str
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, v: object) -> str:
        value = str(v).strip() if v is not None else ""
        if not value:
            raise ValueError("El correo electrónico es obligatorio.")
        if not _EMAIL_RE.match(value):
            raise ValueError("El formato del correo electrónico no es válido.")
        return value.lower()

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, v: object) -> str:
        value = str(v) if v is not None else ""
        if not value:
            raise ValueError("La contraseña es obligatoria.")
        if len(value) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        if len(value) > 128:
            raise ValueError("La contraseña no puede superar los 128 caracteres.")
        return value


class ForgotPasswordRequest(BaseModel):
    """Solicitud de recuperación de contraseña."""

    email: str

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, v: object) -> str:
        value = str(v).strip() if v is not None else ""
        if not value:
            raise ValueError("El correo electrónico es obligatorio.")
        if not _EMAIL_RE.match(value):
            raise ValueError("El formato del correo electrónico no es válido.")
        return value.lower()


class ForgotPasswordResponse(BaseModel):
    """Respuesta para solicitud de recuperación."""

    detail: str


class ResetPasswordRequest(BaseModel):
    """Datos para restablecer contraseña con token."""

    token: str
    new_password: str

    @field_validator("token", mode="before")
    @classmethod
    def validate_token(cls, v: object) -> str:
        value = str(v).strip() if v is not None else ""
        if not value:
            raise ValueError("El token de recuperación es obligatorio.")
        return value

    @field_validator("new_password", mode="before")
    @classmethod
    def validate_new_password(cls, v: object) -> str:
        value = str(v) if v is not None else ""
        if not value:
            raise ValueError("La nueva contraseña es obligatoria.")
        if len(value) < 8:
            raise ValueError("La nueva contraseña debe tener al menos 8 caracteres.")
        if len(value) > 128:
            raise ValueError("La nueva contraseña no puede superar los 128 caracteres.")
        return value


class ExchangeResetTokenRequest(BaseModel):
    """Datos para canjear token de enlace por token de sesión."""

    token: str

    @field_validator("token", mode="before")
    @classmethod
    def validate_token(cls, v: object) -> str:
        value = str(v).strip() if v is not None else ""
        if not value:
            raise ValueError("El token de recuperación es obligatorio.")
        return value


class ExchangeResetTokenResponse(BaseModel):
    """Respuesta con token de sesión para restablecer contraseña."""

    session_token: str


class MessageResponse(BaseModel):
    """Respuesta genérica con detalle."""

    detail: str


class TokenResponse(BaseModel):
    """Respuesta con token de acceso."""

    access_token: str
    token_type: str = "bearer"
