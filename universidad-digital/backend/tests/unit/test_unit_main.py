from __future__ import annotations

import pytest
from app import main
from app.core.errors import (
    AppError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
)
from fastapi.exceptions import RequestValidationError

pytestmark = [pytest.mark.unit]


def test_root_returns_ok_payload() -> None:
    payload = main.root()

    assert payload["status"] == "ok"
    assert "message" in payload


def test_security_policy_metadata_contains_expected_keys() -> None:
    payload = main.security_policy_metadata()

    assert payload["middleware"] == "SecurityHeadersMiddleware"
    assert payload["environment"] == main.settings.env
    assert "x-frame-options" in payload["security_headers"]


def test_error_handlers_return_expected_status_codes() -> None:
    assert main.not_found_handler(None, NotFoundError("missing")).status_code == 404
    assert main.conflict_handler(None, ConflictError("conflict")).status_code == 409
    assert (
        main.unauthorized_handler(None, UnauthorizedError("unauthorized")).status_code
        == 401
    )
    assert main.forbidden_handler(None, ForbiddenError("forbidden")).status_code == 403
    assert main.app_error_handler(None, AppError("bad request")).status_code == 400


def test_validation_error_handler_normalizes_ctx_error_to_string() -> None:
    exc = RequestValidationError(
        [
            {
                "type": "value_error",
                "loc": ("body", "field"),
                "msg": "invalid field",
                "input": None,
                "ctx": {"error": ValueError("boom")},
            }
        ]
    )

    response = main.validation_error_handler(None, exc)

    assert response.status_code == 422
    assert b'"detail"' in response.body
    assert b'"boom"' in response.body


@pytest.mark.asyncio
async def test_security_headers_middleware_adds_headers() -> None:
    async def dummy_app(scope, receive, send):
        await send(
            {
                "type": "http.response.start",
                "status": 200,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send({"type": "http.response.body", "body": b"{}"})

    middleware = main.SecurityHeadersMiddleware(dummy_app)
    sent_messages = []

    async def send_collector(message):
        sent_messages.append(message)

    async def receive_dummy():
        return {"type": "http.request", "body": b"", "more_body": False}

    await middleware({"type": "http"}, receive_dummy, send_collector)

    response_start = next(
        msg for msg in sent_messages if msg["type"] == "http.response.start"
    )
    header_names = {name.decode("latin-1") for name, _ in response_start["headers"]}
    assert "x-content-type-options" in header_names
    assert "x-frame-options" in header_names
    assert "content-security-policy" in header_names


@pytest.mark.asyncio
async def test_security_headers_middleware_passthrough_non_http() -> None:
    called = {"app_called": False}

    async def dummy_app(scope, receive, send):
        called["app_called"] = True

    middleware = main.SecurityHeadersMiddleware(dummy_app)

    async def receive_dummy():
        return {"type": "websocket.receive"}

    async def send_dummy(_message):
        return None

    await middleware({"type": "websocket"}, receive_dummy, send_dummy)

    assert called["app_called"] is True


@pytest.mark.asyncio
async def test_lifespan_initializes_and_closes_db(monkeypatch) -> None:
    called = {"init": False, "roles": False, "closed": False}

    class DummySession:
        def close(self):
            called["closed"] = True

    dummy_db = DummySession()

    def fake_init_db():
        called["init"] = True

    def fake_session_local():
        return dummy_db

    def fake_ensure_default_roles(db):
        called["roles"] = db is dummy_db

    def fake_ensure_default_admin(db):
        pass

    monkeypatch.setattr(main, "init_db", fake_init_db)
    monkeypatch.setattr(main, "SessionLocal", fake_session_local)
    monkeypatch.setattr(main, "ensure_default_roles", fake_ensure_default_roles)
    monkeypatch.setattr(main, "ensure_default_admin", fake_ensure_default_admin)

    async with main.lifespan(main.app):
        pass

    assert called["init"] is True
    assert called["roles"] is True
    assert called["closed"] is True
