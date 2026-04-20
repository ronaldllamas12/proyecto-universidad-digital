from __future__ import annotations

import os

import httpx
from app.core.config import settings


def _first_non_empty(*values: str | None) -> str | None:
    return next(
        (str(value).strip() for value in values if value and str(value).strip()), None
    )


def _send_via_mailtrap_http(to_email: str, reset_link: str) -> bool:
    api_token = _first_non_empty(
        settings.mailtrap_api_token,
        os.getenv("APP_MAILTRAP_API_TOKEN"),
        os.getenv("MAILTRAP_API_TOKEN"),
        os.getenv("APP_TOKEN_MAILTRAP"),
        os.getenv("TOKEN_MAILTRAP"),
    )
    mail_from = _first_non_empty(
        settings.mail_from_email,
        os.getenv("APP_MAIL_FROM"),
        os.getenv("MAIL_FROM"),
    )
    mail_from_name = _first_non_empty(
        settings.mail_from_name,
        os.getenv("APP_MAIL_FROM_NAME"),
        os.getenv("MAIL_FROM_NAME"),
    )

    if not api_token or not mail_from:
        return False

    payload = {
        "from": {"email": mail_from, "name": mail_from_name or "Universidad Digital"},
        "to": [{"email": to_email}],
        "subject": "Recuperacion de contrasena - Universidad Digital",
        "text": (
            "Hola,\n\n"
            "Recibimos una solicitud para restablecer tu contrasena.\n"
            "Usa el siguiente enlace:\n\n"
            f"{reset_link}\n\n"
            "Si no solicitaste este cambio, puedes ignorar este correo.\n"
        ),
    }

    response = httpx.post(
        settings.mailtrap_api_url,
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=settings.mail_http_timeout_seconds,
    )
    response.raise_for_status()
    return True


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Envia correo de recuperacion por Mailtrap HTTP."""
    try:
        return _send_via_mailtrap_http(to_email, reset_link)
    except httpx.HTTPError as exc:
        raise OSError(f"Error Mailtrap HTTP: {exc}") from exc
