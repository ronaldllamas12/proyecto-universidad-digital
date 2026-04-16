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
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    message.set_content(
        "Recibimos una solicitud para restablecer tu contraseña.\n\n"
        f"Haz clic en este enlace para continuar:\n{reset_link}\n\n"
        "Si no solicitaste este cambio, ignora este correo."
    )

    smtp_cls = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
    with smtp_cls(
        settings.smtp_host, settings.smtp_port, timeout=settings.smtp_timeout_seconds
    ) as server:
        if settings.smtp_use_tls and not settings.smtp_use_ssl:
            server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)

    return True
