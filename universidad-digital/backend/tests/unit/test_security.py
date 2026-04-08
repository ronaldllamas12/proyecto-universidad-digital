# tests/unit/test_security.py
import pytest
from jose import JWTError

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.core.config import settings


@pytest.mark.unit
class TestSecurity:
    """
    Suite de tests para las funciones de seguridad.
    Estos tests son unitarios: no dependen de la base de datos ni de la red.
    """

    def test_hash_password(self):
        """
        Test para hash_password.
        Verifica que la función retorna un hash y que este es verificable.
        """
        # Arrange: Define una contraseña simple
        password = "plain_password"

        # Act: Genera el hash
        hashed = hash_password(password)

        # Assert:
        # 1. El resultado es un string
        assert isinstance(hashed, str)
        # 2. El hash no es igual a la contraseña original
        assert hashed != password
        # 3. La contraseña original puede ser verificada contra el hash
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """
        Test para verify_password con una contraseña incorrecta.
        """
        # Arrange
        password = "correct_password"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        # Act & Assert
        assert verify_password(wrong_password, hashed) is False

    def test_jwt_token_creation_and_decoding(self):
        """
        Test para el ciclo completo de creación y decodificación de un token JWT.
        Asegura que los datos codificados ("subject" y "jti") se mantienen intactos.
        """
        # Arrange
        subject = "test@example.com"
        jti = "unique_token_id"

        # Act: Crear el token
        token = create_access_token(subject=subject, jti=jti)
        # Decodificar el token
        decoded_payload = decode_access_token(token)

        # Assert
        assert decoded_payload["sub"] == subject
        assert decoded_payload["jti"] == jti
        assert "exp" in decoded_payload  # Verificar que la expiración está presente

    def test_decode_invalid_token_raises_error(self):
        """
        Test para decode_access_token con un token inválido.
        Verifica que se lanza una excepción del tipo JWTError.
        """
        # Arrange: un token falso que no pasará la validación de firma
        invalid_token = "this.is.not.a.valid.token"

        # Act & Assert: Usar pytest.raises para esperar una excepción
        with pytest.raises(JWTError):
            decode_access_token(invalid_token)

    def test_token_creation_fails_without_secret(self, monkeypatch):
        """
        Test para create_access_token cuando falta el secreto JWT.
        Usa monkeypatch para simular un entorno mal configurado de forma segura.
        """
        # Arrange: Usar monkeypatch para modificar temporalmente la configuración
        # 'monkeypatch' es una fixture de pytest que revierte los cambios al final del test.
        monkeypatch.setattr(settings, "jwt_secret", None)

        # Act & Assert: Esperar que se lance un RuntimeError
        with pytest.raises(RuntimeError, match="APP_JWT_SECRET no configurado"):
            create_access_token(subject="test", jti="test")
