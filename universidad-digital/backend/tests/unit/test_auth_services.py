from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from fastapi import Request

from app.auth import services as auth_services
from app.core.errors import ForbiddenError, UnauthorizedError
from app.users.models import User


pytestmark = [pytest.mark.unit]


def _request(headers: dict | None = None, cookies: dict | None = None) -> Request:
    raw_headers = []
    for key, value in (headers or {}).items():
        raw_headers.append((key.lower().encode(), value.encode()))

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": raw_headers,
    }
    request = Request(scope)
    request._cookies = cookies or {}
    return request


@pytest.mark.parametrize(
    "header,expected",
    [
        ("Bearer token-123", "token-123"),
        ("bearer token-abc", "token-abc"),
        ("Basic abc", None),
        ("", None),
    ],
)
def test_get_token_from_request_prefers_authorization_header(header: str, expected: str | None):
    request = _request(headers={"authorization": header})

    token = auth_services.get_token_from_request(request)

    assert token == expected


def test_get_token_from_request_uses_cookie_fallback_when_no_header(monkeypatch):
    monkeypatch.setattr(auth_services.settings, "cookie_name", "access_token")
    request = _request(cookies={"access_token": "cookie-token"})

    token = auth_services.get_token_from_request(request)

    assert token == "cookie-token"


def test_authenticate_user_rejects_inactive_user(monkeypatch):
    inactive_user = User(
        email="inactive@uni.com",
        full_name="Inactive",
        hashed_password="hashed",
        is_active=False,
    )

    db = Mock()
    db.scalar.return_value = inactive_user

    monkeypatch.setattr(auth_services, "verify_password", lambda *_: True)

    with pytest.raises(ForbiddenError, match="Usuario inactivo"):
        auth_services.authenticate_user(db, "inactive@uni.com", "password123")


def test_get_current_user_raises_when_token_is_revoked(monkeypatch):
    db = Mock()
    request = _request(headers={"authorization": "Bearer abc"})

    monkeypatch.setattr(auth_services, "get_token_from_request", lambda _: "abc")
    monkeypatch.setattr(
        auth_services,
        "decode_access_token",
        lambda _: {
            "jti": "revoked-jti",
            "sub": "1",
            "exp": int(datetime.now(timezone.utc).timestamp()) + 3600,
        },
    )
    monkeypatch.setattr(auth_services, "is_token_revoked", lambda *_: True)

    with pytest.raises(UnauthorizedError, match="Token revocado"):
        auth_services.get_current_user(db, request)


def test_extract_token_data_raises_for_missing_claims(monkeypatch):
    monkeypatch.setattr(auth_services, "decode_access_token", lambda _: {"sub": "1"})

    with pytest.raises(UnauthorizedError, match="Token inválido"):
        auth_services.extract_token_data("any-token")


def test_require_roles_rejects_user_without_permissions():
    role = Mock()
    role.name = "Estudiante"

    user = Mock()
    user.roles = [role]

    with pytest.raises(ForbiddenError, match="Permisos insuficientes"):
        auth_services.require_roles(user, {"Administrador", "Docente"})
