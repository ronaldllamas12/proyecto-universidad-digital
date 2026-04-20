from unittest.mock import MagicMock

import pytest
from app.core.mailer import send_password_reset_email
from fastapi import HTTPException

pytestmark = [pytest.mark.unit]


def test_send_password_reset_email_raises_when_mailtrap_not_configured(monkeypatch):
    monkeypatch.setattr("app.core.mailer.settings.mailtrap_api_token", None)
    monkeypatch.setattr("app.core.mailer.settings.mail_from_email", "noreply@ud.edu")
    monkeypatch.setattr(
        "app.core.mailer.settings.frontend_url", "https://app.example.com"
    )
    monkeypatch.setattr(
        "app.core.mailer.settings.frontend_reset_password_url",
        "/login",
    )

    with pytest.raises(HTTPException) as exc_info:
        send_password_reset_email(recipient_email="user@example.com", token="abc")

    assert exc_info.value.status_code == 500


def test_send_password_reset_email_uses_mailtrap_http_when_configured(monkeypatch):
    fake_response = MagicMock()
    fake_response.raise_for_status = MagicMock()
    fake_post = MagicMock(return_value=fake_response)

    monkeypatch.setattr("app.core.mailer.requests.post", fake_post)
    monkeypatch.setattr("app.core.mailer.settings.mailtrap_api_token", "api-token")
    monkeypatch.setattr(
        "app.core.mailer.settings.mailtrap_api_url",
        "https://send.api.mailtrap.io/api/send",
    )
    monkeypatch.setattr("app.core.mailer.settings.mail_http_timeout_seconds", 15)
    monkeypatch.setattr("app.core.mailer.settings.mail_from_email", "noreply@ud.edu")
    monkeypatch.setattr(
        "app.core.mailer.settings.mail_from_name",
        "Universidad Digital",
    )
    monkeypatch.setattr(
        "app.core.mailer.settings.frontend_url", "https://app.example.com"
    )
    monkeypatch.setattr(
        "app.core.mailer.settings.frontend_reset_password_url",
        "/login",
    )

    sent = send_password_reset_email(recipient_email="user@example.com", token="abc")

    assert sent is None
    fake_post.assert_called_once()
    fake_response.raise_for_status.assert_called_once()
