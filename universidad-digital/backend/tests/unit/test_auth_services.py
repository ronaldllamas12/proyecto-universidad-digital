from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from app.auth import services as auth_services
from app.core.errors import ForbiddenError, UnauthorizedError
from app.users.models import User
from fastapi import Request

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
def test_get_token_from_request_prefers_authorization_header(
    header: str, expected: str | None
):
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


def test_require_roles_accepts_role_variants_with_known_prefix():
    role = Mock()
    role.name = "Docente Temporal"

    user = Mock()
    user.roles = [role]

    auth_services.require_roles(user, {"Docente"})


def test_create_password_reset_token_returns_none_when_user_not_found():
    db = Mock()
    db.scalar.return_value = None

    token = auth_services.create_password_reset_token_for_email(db, "missing@uni.com")

    assert token is None


def test_create_password_reset_token_returns_none_for_inactive_user():
    user = User(
        email="inactive@uni.com",
        recovery_email="personal@example.com",
        full_name="Inactive",
        hashed_password="hashed",
        is_active=False,
    )
    db = Mock()
    db.scalar.return_value = user

    token = auth_services.create_password_reset_token_for_email(db, user.email)

    assert token is None


def test_create_password_reset_token_builds_expected_claims(monkeypatch):
    user = User(
        id=77,
        email="active@uni.com",
        recovery_email="personal@example.com",
        full_name="Active",
        hashed_password="hashed",
        is_active=True,
    )
    db = Mock()
    db.scalar.return_value = user

    captured: dict[str, object] = {}

    def _fake_create_access_token(**kwargs):
        captured.update(kwargs)
        return "reset-token"

    sent: dict[str, str] = {}

    def _fake_send_password_reset_email(to_email: str, reset_link: str):
        sent["to_email"] = to_email
        sent["reset_link"] = reset_link

    monkeypatch.setattr(auth_services, "create_access_token", _fake_create_access_token)
    monkeypatch.setattr(
        auth_services, "send_password_reset_email", _fake_send_password_reset_email
    )

    token = auth_services.create_password_reset_token_for_email(db, user.email)

    assert token == "reset-token"
    assert captured["subject"] == str(user.id)
    assert (
        captured["expires_minutes"]
        == auth_services.settings.password_reset_token_expiration_minutes
    )
    assert isinstance(captured["extra_claims"], dict)
    assert captured["extra_claims"]["typ"] == "password-reset"
    assert captured["extra_claims"]["pwd_fp"]
    assert sent["to_email"] == user.recovery_email
    assert "#token=reset-token" in sent["reset_link"]


def test_create_password_reset_token_falls_back_to_institutional_email(monkeypatch):
    user = User(
        id=78,
        email="active@uni.com",
        recovery_email=None,
        full_name="Active",
        hashed_password="hashed",
        is_active=True,
    )
    db = Mock()
    db.scalar.return_value = user

    monkeypatch.setattr(
        auth_services, "create_access_token", lambda **_kwargs: "reset-token"
    )

    sent: dict[str, str] = {}

    def _fake_send_password_reset_email(to_email: str, reset_link: str):
        sent["to_email"] = to_email
        sent["reset_link"] = reset_link

    monkeypatch.setattr(
        auth_services, "send_password_reset_email", _fake_send_password_reset_email
    )

    token = auth_services.create_password_reset_token_for_email(db, user.email)

    assert token == "reset-token"
    assert sent["to_email"] == user.email
    assert "#token=reset-token" in sent["reset_link"]


def test_reset_password_with_token_updates_hash(monkeypatch):
    user = User(
        id=10,
        email="active@uni.com",
        recovery_email="personal@example.com",
        full_name="Active",
        hashed_password="old-hash",
        is_active=True,
    )
    db = Mock()
    db.get.return_value = user

    fp = auth_services._password_fingerprint("old-hash")
    monkeypatch.setattr(
        auth_services,
        "decode_access_token",
        lambda _token: {
            "typ": "password-reset-session",
            "sub": "10",
            "pwd_fp": fp,
            "jti": "session-jti",
            "exp": int(datetime.now(timezone.utc).timestamp()) + 600,
        },
    )
    monkeypatch.setattr(
        auth_services, "hash_password", lambda value: f"hashed::{value}"
    )
    monkeypatch.setattr(auth_services, "is_token_revoked", lambda *_: False)

    auth_services.reset_password_with_token(db, "valid-token", "NewPass123")

    assert user.hashed_password == "hashed::NewPass123"
    assert any(call.args and call.args[0] is user for call in db.add.call_args_list)
    db.commit.assert_called_once()


@pytest.mark.parametrize(
    "payload",
    [
        {"typ": "access", "sub": "10", "pwd_fp": "fp"},
        {
            "typ": "password-reset-session",
            "sub": None,
            "pwd_fp": "fp",
            "jti": "j1",
            "exp": 1,
        },
        {
            "typ": "password-reset-session",
            "sub": "10",
            "pwd_fp": None,
            "jti": "j1",
            "exp": 1,
        },
        {
            "typ": "password-reset-session",
            "sub": "10",
            "pwd_fp": "fp",
            "jti": None,
            "exp": 1,
        },
        {
            "typ": "password-reset-session",
            "sub": "10",
            "pwd_fp": "fp",
            "jti": "j1",
            "exp": None,
        },
        {
            "typ": "password-reset-session",
            "sub": "abc",
            "pwd_fp": "fp",
            "jti": "j1",
            "exp": 1,
        },
    ],
)
def test_reset_password_with_token_rejects_invalid_payload(monkeypatch, payload):
    db = Mock()
    monkeypatch.setattr(auth_services, "decode_access_token", lambda _token: payload)

    with pytest.raises(
        UnauthorizedError, match="Token de recuperación inválido o expirado"
    ):
        auth_services.reset_password_with_token(db, "invalid", "NewPass123")


def test_reset_password_with_token_rejects_fingerprint_mismatch(monkeypatch):
    user = User(
        id=10,
        email="active@uni.com",
        recovery_email="personal@example.com",
        full_name="Active",
        hashed_password="current-hash",
        is_active=True,
    )
    db = Mock()
    db.get.return_value = user

    monkeypatch.setattr(
        auth_services,
        "decode_access_token",
        lambda _token: {
            "typ": "password-reset-session",
            "sub": "10",
            "pwd_fp": "different-fingerprint",
            "jti": "session-jti",
            "exp": int(datetime.now(timezone.utc).timestamp()) + 600,
        },
    )
    monkeypatch.setattr(auth_services, "is_token_revoked", lambda *_: False)

    with pytest.raises(
        UnauthorizedError, match="Token de recuperación inválido o expirado"
    ):
        auth_services.reset_password_with_token(db, "token", "NewPass123")


def test_exchange_password_reset_token_revokes_original_and_returns_session(
    monkeypatch,
):
    user = User(
        id=99,
        email="active@uni.com",
        recovery_email="personal@example.com",
        full_name="Active",
        hashed_password="old-hash",
        is_active=True,
    )
    db = Mock()
    db.get.return_value = user

    fp = auth_services._password_fingerprint("old-hash")
    exp_ts = int(datetime.now(timezone.utc).timestamp()) + 600

    monkeypatch.setattr(
        auth_services,
        "decode_access_token",
        lambda _token: {
            "typ": "password-reset",
            "sub": "99",
            "pwd_fp": fp,
            "jti": "original-jti",
            "exp": exp_ts,
        },
    )
    monkeypatch.setattr(auth_services, "is_token_revoked", lambda *_: False)

    created: list[dict] = []

    def _fake_create_access_token(**kwargs):
        created.append(kwargs)
        return "session-token"

    monkeypatch.setattr(auth_services, "create_access_token", _fake_create_access_token)

    session_token = auth_services.exchange_password_reset_token(db, "original-token")

    assert session_token == "session-token"
    assert created
    assert created[0]["subject"] == "99"
    assert created[0]["extra_claims"]["typ"] == "password-reset-session"
    assert created[0]["extra_claims"]["pwd_fp"] == fp
    assert db.add.call_count == 1
    assert db.commit.call_count == 1


def test_exchange_password_reset_token_rejects_revoked_token(monkeypatch):
    db = Mock()
    monkeypatch.setattr(
        auth_services,
        "decode_access_token",
        lambda _token: {
            "typ": "password-reset",
            "sub": "99",
            "pwd_fp": "fp",
            "jti": "revoked-jti",
            "exp": int(datetime.now(timezone.utc).timestamp()) + 600,
        },
    )
    monkeypatch.setattr(auth_services, "is_token_revoked", lambda *_: True)

    with pytest.raises(
        UnauthorizedError, match="Token de recuperación inválido o expirado"
    ):
        auth_services.exchange_password_reset_token(db, "already-used")
