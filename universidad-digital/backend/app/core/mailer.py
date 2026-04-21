"""Servicio de correo para flujos de autenticación (API HTTP de Mailtrap)."""

from __future__ import annotations

from urllib.parse import urlencode

import requests
from app.core.config import settings
from fastapi import HTTPException


def _get_required_setting(value: str | None, primary: str, *aliases: str) -> str:
    if value and value.strip():
        return value.strip()

    aliases_label = f" (aliases: {', '.join(aliases)})" if aliases else ""
    raise HTTPException(
        status_code=500,
        detail=(
            f"Falta configurar la variable de entorno {primary}{aliases_label} "
            "para envío de correos."
        ),
    )


def _build_reset_url(token: str) -> str:
    reset_path_or_url = _get_required_setting(
        settings.frontend_reset_password_url,
        "APP_FRONTEND_RESET_PASSWORD_URL",
    )

    if reset_path_or_url.startswith("http://") or reset_path_or_url.startswith(
        "https://"
    ):
        separator = "&" if "?" in reset_path_or_url else "?"
        return f"{reset_path_or_url}{separator}{urlencode({'token': token})}"

    frontend_url = (
        _get_required_setting(settings.frontend_url, "APP_FRONTEND_URL")
        or "/forgot-password"
    )
    reset_path = (
        reset_path_or_url
        if reset_path_or_url.startswith("/")
        else f"/{reset_path_or_url}"
    )
    return f"{frontend_url.rstrip('/')}{reset_path}?{urlencode({'token': token})}"


def send_password_reset_email(*, recipient_email: str, token: str) -> None:
    """Envía el enlace de recuperación de contraseña usando la API HTTP de Mailtrap."""
    api_token = _get_required_setting(
        settings.mailtrap_api_token, "APP_MAILTRAP_API_TOKEN"
    )
    mail_from = _get_required_setting(settings.mail_from_email, "APP_MAIL_FROM_EMAIL")
    mail_from_name = (settings.mail_from_name or "UNIVERSIDAD DIGITAL").strip()
    reset_url = _build_reset_url(token)

    payload = {
        "from": {"email": mail_from, "name": mail_from_name},
        "to": [{"email": recipient_email}],
        "subject": "Recuperación de contraseña - UNIVERSIDAD DIGITAL",
        "text": (
            "Hola,\n\n"
            "Recibimos una solicitud para restablecer tu contraseña.\n"
            "Usa el siguiente enlace:\n\n"
            f"{reset_url}\n\n"
            "Si no solicitaste este cambio, puedes ignorar este correo.\n"
        ),
    }

    print(f"[EMAIL] Enviando via API HTTP a {recipient_email}")

    try:
        response = requests.post(
            settings.mailtrap_api_url,
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=settings.mail_http_timeout_seconds,
        )
        print(f"[EMAIL] Respuesta Mailtrap: {response.status_code} {response.text}")
        response.raise_for_status()
        print("[EMAIL] Enviado exitosamente")
    except requests.HTTPError as exc:
        print(f"[EMAIL ERROR] HTTP {exc.response.status_code}: {exc.response.text}")
        raise HTTPException(
            status_code=502,
            detail=f"Error al enviar correo: {exc.response.text}",
        ) from exc
    except Exception as exc:
        import traceback

        print(f"[EMAIL ERROR] {traceback.format_exc()}")
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo enviar el correo: {str(exc)}",
        ) from exc
