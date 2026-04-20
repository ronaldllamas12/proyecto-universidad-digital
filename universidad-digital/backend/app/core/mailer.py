"""Servicio de correo para flujos de autenticación (API HTTP de Mailtrap)."""

from __future__ import annotations

import os
from urllib.parse import urlencode

import requests
from fastapi import HTTPException


def _get_required_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value

    primary = names[0] if names else "ENV_VAR"
    aliases = f" (aliases: {', '.join(names[1:])})" if len(names) > 1 else ""
    raise HTTPException(
        status_code=500,
        detail=(
            f"Falta configurar la variable de entorno {primary}{aliases} "
            "para envío de correos."
        ),
    )


def _get_optional_env(default: str, *names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


def send_password_reset_email(*, recipient_email: str, token: str) -> None:
    """Envía el enlace de recuperación de contraseña usando la API HTTP de Mailtrap."""
    api_token = _get_required_env("APP_MAILTRAP_API_TOKEN", "SMTP_PASSWORD", "PASSWORD")
    mail_from = _get_required_env("APP_MAIL_FROM_EMAIL")
    mail_from_name = _get_optional_env("UNIVERSIDAD DIGITAL", "APP_MAIL_FROM_NAME")

    frontend_url = _get_required_env("APP_FRONTEND_URL").rstrip("/")
    reset_path = (
        _get_optional_env("/login", "APP_FRONTEND_RESET_PASSWORD_URL") or "/login"
    )
    if not reset_path.startswith("/"):
        reset_path = f"/{reset_path}"

    query = urlencode({"token": token})
    reset_url = f"{frontend_url}{reset_path}?{query}"

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
            "https://send.api.mailtrap.io/api/send",
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
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
