from unittest.mock import MagicMock

import pytest
from app.core.mailer import send_password_reset_email

pytestmark = [pytest.mark.unit]


def test_send_password_reset_email_returns_false_when_mailtrap_not_configured(
    monkeypatch,
):
    monkeypatch.setattr("app.core.mailer.settings.mailtrap_api_token", None)
    monkeypatch.setattr("app.core.mailer.settings.mail_from_email", None)
    monkeypatch.delenv("APP_MAILTRAP_API_TOKEN", raising=False)
    monkeypatch.delenv("MAILTRAP_API_TOKEN", raising=False)
    monkeypatch.delenv("APP_TOKEN_MAILTRAP", raising=False)
    monkeypatch.delenv("TOKEN_MAILTRAP", raising=False)

    sent = send_password_reset_email("user@example.com", "https://example.com/reset")

    assert sent is False


def test_send_password_reset_email_uses_mailtrap_http_when_configured(monkeypatch):
    fake_response = MagicMock()
    fake_response.raise_for_status = MagicMock()
    fake_post = MagicMock(return_value=fake_response)

    monkeypatch.setattr("app.core.mailer.httpx.post", fake_post)
    monkeypatch.setattr("app.core.mailer.settings.mailtrap_api_token", "api-token")
    monkeypatch.setattr("app.core.mailer.settings.mail_from_email", "noreply@ud.edu")
    monkeypatch.setattr(
        "app.core.mailer.settings.mail_from_name", "Universidad Digital"
    )
    monkeypatch.setattr(
        "app.core.mailer.settings.mailtrap_api_url",
        "https://send.api.mailtrap.io/api/send",
    )
    monkeypatch.setattr("app.core.mailer.settings.mail_http_timeout_seconds", 15)

    sent = send_password_reset_email("user@example.com", "https://app/reset?token=abc")

    assert sent is True
    fake_post.assert_called_once()
    fake_response.raise_for_status.assert_called_once()
