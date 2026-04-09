import pytest
from app.auth.schemas import (ForgotPasswordRequest, LoginRequest,
                              ResetPasswordRequest)
from pydantic import ValidationError

pytestmark = [pytest.mark.unit]


def test_login_request_normalizes_valid_payload() -> None:
    payload = LoginRequest(email="  USER@Test.COM ", password="password123")

    assert payload.email == "user@test.com"
    assert payload.password == "password123"


@pytest.mark.parametrize(
    "data,expected_message",
    [
        ({"email": "", "password": "password123"}, "El correo electrónico es obligatorio."),
        (
            {"email": "correo-invalido", "password": "password123"},
            "El formato del correo electrónico no es válido.",
        ),
        ({"email": "user@test.com", "password": ""}, "La contraseña es obligatoria."),
        (
            {"email": "user@test.com", "password": "short"},
            "La contraseña debe tener al menos 8 caracteres.",
        ),
    ],
)
def test_login_request_validation_errors(data: dict[str, str], expected_message: str) -> None:
    with pytest.raises(ValidationError, match=expected_message):
        LoginRequest(**data)


def test_forgot_password_request_requires_valid_email() -> None:
    with pytest.raises(ValidationError, match="El formato del correo electrónico no es válido."):
        ForgotPasswordRequest(email="invalido")


def test_reset_password_request_validates_token_and_password() -> None:
    with pytest.raises(ValidationError, match="El token de recuperación es obligatorio."):
        ResetPasswordRequest(token="", new_password="Password123")

    with pytest.raises(ValidationError, match="La nueva contraseña debe tener al menos 8 caracteres."):
        ResetPasswordRequest(token="abc", new_password="123")

    payload = ResetPasswordRequest(token=" token-abc ", new_password="Password123")
    assert payload.token == "token-abc"
    assert payload.new_password == "Password123"
