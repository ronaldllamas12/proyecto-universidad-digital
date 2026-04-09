from __future__ import annotations

from contextlib import suppress

from app.auth.schemas import (ForgotPasswordRequest, ForgotPasswordResponse,
                              LoginRequest, MessageResponse,
                              ResetPasswordRequest, TokenResponse)
from app.auth.services import (authenticate_user,
                               create_password_reset_token_for_email,
                               create_token_for_user, extract_token_data,
                               reset_password_with_token, revoke_token)
from app.core.config import settings
from app.core.deps import get_current_user_dep, get_db
from app.core.errors import UnauthorizedError
from app.users.schemas import UserResponse
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login_endpoint(
    payload: LoginRequest, response: Response, db: Session = Depends(get_db)
) -> TokenResponse:
    user = authenticate_user(db, payload.email, payload.password)
    token, _, _ = create_token_for_user(user)
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expiration_minutes * 60,
    )
    return TokenResponse(access_token=token)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password_endpoint(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    token = create_password_reset_token_for_email(db, payload.email)
    detail = (
        "Si el correo está registrado, recibirás instrucciones para restablecer "
        "tu contraseña."
    )

    # En desarrollo se retorna el token para facilitar pruebas manuales.
    if settings.is_production:
        return ForgotPasswordResponse(detail=detail)
    return ForgotPasswordResponse(detail=detail, reset_token=token)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_endpoint(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    reset_password_with_token(db, payload.token, payload.new_password)
    return MessageResponse(detail="Contraseña restablecida correctamente.")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_endpoint(
    request: Request,
    db: Session = Depends(get_db),
) -> Response:
    """
    Cierra sesión del usuario actual.

    Siempre devuelve una respuesta HTTP válida (204) aunque falle la revocación
    del token, para evitar estados inconsistentes y errores en el servidor.
    """

    if token := request.cookies.get(settings.cookie_name):
        with suppress(UnauthorizedError):
            jti, expires_at = extract_token_data(token)
            revoke_token(db, jti, expires_at)

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(settings.cookie_name)
    return response


@router.get("/me", response_model=UserResponse)
def me_endpoint(user=Depends(get_current_user_dep)) -> UserResponse:
    return UserResponse.model_validate(user, from_attributes=True)
