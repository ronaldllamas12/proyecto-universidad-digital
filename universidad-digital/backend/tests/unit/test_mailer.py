from unittest.mock import MagicMock

import pytest
from app.core.mailer import send_password_reset_email

pytestmark = [pytest.mark.unit]


def test_send_password_reset_email_returns_false_when_smtp_not_configured(monkeypatch):
    monkeypatch.setattr("app.core.mailer.settings.smtp_host", None)
    monkeypatch.setattr("app.core.mailer.settings.smtp_from_email", None)

    sent = send_password_reset_email("user@example.com", "https://example.com/reset")

    assert sent is False


def test_send_password_reset_email_uses_starttls_and_login(monkeypatch):
    fake_server = MagicMock()
    fake_context = MagicMock()
    fake_context.__enter__.return_value = fake_server

    fake_smtp_ctor = MagicMock(return_value=fake_context)
    monkeypatch.setattr("app.core.mailer.smtplib.SMTP", fake_smtp_ctor)

    monkeypatch.setattr(
        "app.core.mailer.settings.smtp_host", "sandbox.smtp.mailtrap.io"
    )
    monkeypatch.setattr("app.core.mailer.settings.smtp_port", 587)
    monkeypatch.setattr("app.core.mailer.settings.smtp_from_email", "noreply@ud.edu")
    monkeypatch.setattr(
        "app.core.mailer.settings.smtp_from_name", "Universidad Digital"
    )
    monkeypatch.setattr("app.core.mailer.settings.smtp_username", "mailtrap-user")
    monkeypatch.setattr("app.core.mailer.settings.smtp_password", "mailtrap-pass")
    monkeypatch.setattr("app.core.mailer.settings.smtp_use_tls", True)
    monkeypatch.setattr("app.core.mailer.settings.smtp_use_ssl", False)
    monkeypatch.setattr("app.core.mailer.settings.smtp_timeout_seconds", 10)

    sent = send_password_reset_email("user@example.com", "https://app/reset?token=abc")

    assert sent is True
    fake_server.starttls.assert_called_once()
    fake_server.login.assert_called_once_with("mailtrap-user", "mailtrap-pass")
    fake_server.send_message.assert_called_once()


def test_send_password_reset_email_uses_smtp_ssl_when_configured(monkeypatch):
    fake_server = MagicMock()
    fake_context = MagicMock()
    fake_context.__enter__.return_value = fake_server

    fake_smtp_ssl_ctor = MagicMock(return_value=fake_context)
    monkeypatch.setattr("app.core.mailer.smtplib.SMTP_SSL", fake_smtp_ssl_ctor)

    monkeypatch.setattr("app.core.mailer.settings.smtp_host", "live.smtp.mailtrap.io")
    monkeypatch.setattr("app.core.mailer.settings.smtp_port", 465)
    monkeypatch.setattr("app.core.mailer.settings.smtp_from_email", "noreply@ud.edu")
    monkeypatch.setattr(
        "app.core.mailer.settings.smtp_from_name", "Universidad Digital"
    )
    monkeypatch.setattr("app.core.mailer.settings.smtp_username", "mailtrap-user")
    monkeypatch.setattr("app.core.mailer.settings.smtp_password", "mailtrap-pass")
    monkeypatch.setattr("app.core.mailer.settings.smtp_use_tls", False)
    monkeypatch.setattr("app.core.mailer.settings.smtp_use_ssl", True)
    monkeypatch.setattr("app.core.mailer.settings.smtp_timeout_seconds", 10)

    sent = send_password_reset_email("user@example.com", "https://app/reset?token=abc")

    assert sent is True
    fake_server.starttls.assert_not_called()
    fake_server.login.assert_called_once_with("mailtrap-user", "mailtrap-pass")
    fake_server.send_message.assert_called_once()
