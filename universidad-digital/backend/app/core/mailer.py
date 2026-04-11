from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Envía correo de recuperación si SMTP está configurado."""
    if not settings.smtp_host or not settings.smtp_from_email:
        return False

    message = EmailMessage()
    message["Subject"] = "Recuperación de contraseña - Universidad Digital"
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message.set_content(
        "Recibimos una solicitud para restablecer tu contraseña.\n\n"
        f"Haz clic en este enlace para continuar:\n{reset_link}\n\n"
        "Si no solicitaste este cambio, ignora este correo."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)

    return True
