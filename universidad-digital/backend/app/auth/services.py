from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from uuid import uuid4

from app.auth.models import RevokedToken
from app.core.config import settings
from app.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import (create_access_token, decode_access_token,
                               hash_password, is_jwt_error, verify_password)
from app.users.models import User
from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session


def _password_fingerprint(hashed_password: str) -> str:
    """Genera huella de hash para invalidar tokens tras cambio de contraseña."""
    secret = settings.jwt_secret or ""
    raw = f"{hashed_password}:{secret}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Valida credenciales y estado del usuario."""
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    if not user:
        raise UnauthorizedError("El correo electrónico no está registrado.")
    if not verify_password(password, user.hashed_password):
        raise UnauthorizedError("La contraseña es incorrecta.")
    if not user.is_active:
        raise ForbiddenError("Usuario inactivo.")
    return user


def create_token_for_user(user: User) -> tuple[str, str, datetime]:
    """Genera token JWT y retorna token, jti y expiración."""
    jti = uuid4().hex
    token = create_access_token(subject=str(user.id), jti=jti)
    payload = decode_access_token(token)
    exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return token, jti, exp


def create_password_reset_token_for_email(db: Session, email: str) -> str | None:
    """Genera token temporal de recuperación para un usuario activo."""
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    if not user or not user.is_active:
        return None

    return create_access_token(
        subject=str(user.id),
        expires_minutes=settings.password_reset_token_expiration_minutes,
        extra_claims={
            "typ": "password-reset",
            "pwd_fp": _password_fingerprint(user.hashed_password),
        },
    )


def reset_password_with_token(db: Session, token: str, new_password: str) -> None:
    """Restablece contraseña validando token de recuperación."""
    invalid_token_msg = "Token de recuperación inválido o expirado."

    try:
        payload = decode_access_token(token)
    except Exception as exc:  # noqa: BLE001
        if is_jwt_error(exc):
            raise UnauthorizedError(invalid_token_msg) from exc
        raise

    if payload.get("typ") != "password-reset":
        raise UnauthorizedError(invalid_token_msg)

    sub = payload.get("sub")
    pwd_fp = payload.get("pwd_fp")
    if not sub or not pwd_fp:
        raise UnauthorizedError(invalid_token_msg)

    try:
        user_id = int(sub)
    except (TypeError, ValueError) as exc:
        raise UnauthorizedError(invalid_token_msg) from exc

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise UnauthorizedError(invalid_token_msg)

    if pwd_fp != _password_fingerprint(user.hashed_password):
        raise UnauthorizedError(invalid_token_msg)

    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()


def revoke_token(db: Session, jti: str, expires_at: datetime) -> None:
    """Guarda un token revocado."""
    revoked = RevokedToken(jti=jti, expires_at=expires_at)
    db.add(revoked)
    db.commit()


def is_token_revoked(db: Session, jti: str) -> bool:
    """Verifica si un token fue revocado."""
    return bool(db.scalar(select(RevokedToken).where(RevokedToken.jti == jti)))


def get_token_from_request(request: Request) -> str | None:
    """Obtiene token desde Authorization o cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return request.cookies.get(settings.cookie_name)


def get_current_user(db: Session, request: Request) -> User:
    """Resuelve el usuario autenticado desde la request."""
    token = get_token_from_request(request)
    if not token:
        raise UnauthorizedError("Token no proporcionado.")

    try:
        payload = decode_access_token(token)
    except Exception as exc:  # noqa: BLE001
        if is_jwt_error(exc):
            raise UnauthorizedError("Token inválido.") from exc
        raise

    jti = payload.get("jti")
    sub = payload.get("sub")
    if not jti or not sub:
        raise UnauthorizedError("Token inválido.")
    if is_token_revoked(db, jti):
        raise UnauthorizedError("Token revocado.")

    user = db.get(User, int(sub))
    if not user:
        raise NotFoundError("Usuario no encontrado.")
    if not user.is_active:
        raise ForbiddenError("Usuario inactivo.")
    return user


def require_roles(user: User, allowed_roles: set[str]) -> None:
    """Valida que el usuario tenga roles permitidos."""
    user_roles = {role.name for role in user.roles}
    if not user_roles.intersection(allowed_roles):
        raise ForbiddenError("Permisos insuficientes.")


def extract_token_data(token: str) -> tuple[str, datetime]:
    """Extrae jti y expiración desde el JWT."""
    try:
        payload = decode_access_token(token)
    except Exception as exc:  # noqa: BLE001
        if is_jwt_error(exc):
            raise UnauthorizedError("Token inválido.") from exc
        raise
    jti = payload.get("jti")
    exp = payload.get("exp")
    if not jti or not exp:
        raise UnauthorizedError("Token inválido.")
    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
    return jti, expires_at
