from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.config import settings
from jose import JWTError, jwt
from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Genera un hash seguro para contraseñas."""

    return _pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""

    return _pwd_context.verify(password, hashed_password)


def create_access_token(
    subject: str,
    jti: str | None = None,
    roles: list[str] | None = None,
    expires_minutes: int | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Crea un JWT"""

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.jwt_expiration_minutes
    )

    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    if jti:
        payload["jti"] = jti

    if roles:
        payload["roles"] = roles

    if extra_claims:
        payload.update(extra_claims)

    if not settings.jwt_secret:
        raise RuntimeError("APP_JWT_SECRET no configurado.")

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_token(
    subject: str,
    jti: str | None = None,
    roles: list[str] | None = None,
) -> str:
    """Compatibilidad con el nombre anterior de la función."""

    return create_access_token(subject=subject, jti=jti, roles=roles)

def decode_access_token(token: str) -> dict[str, Any]:
    """Decodifica un JWT y retorna su payload."""

    if not settings.jwt_secret:
        raise RuntimeError("APP_JWT_SECRET no configurado.")
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def is_jwt_error(exc: Exception) -> bool:
    """ Verifica si una excepción es un error de JWT."""
    return isinstance(exc, JWTError)
