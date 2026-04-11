import pytest
import pytest_asyncio
from app.auth import services as auth_services
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.factories import RoleFactory, UserFactory

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
def admin_user(db: Session):
    admin_role = RoleFactory(name="Administrador")
    user = UserFactory(roles=[admin_role], recovery_email="recovery@test.com")
    user.raw_password = "testpassword"
    db.flush()
    return user


@pytest_asyncio.fixture
async def authenticated_client(api_client: AsyncClient, admin_user) -> AsyncClient:
    response = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": admin_user.raw_password,
        },
    )
    assert response.status_code == status.HTTP_200_OK
    token = response.json()["access_token"]
    api_client.headers.update({"Authorization": f"Bearer {token}"})
    return api_client


async def test_me_returns_authenticated_user(authenticated_client: AsyncClient, admin_user) -> None:
    response = await authenticated_client.get("/auth/me")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["email"] == admin_user.email
    assert payload["full_name"] == admin_user.full_name
    assert "Administrador" in payload["roles"]


async def test_me_requires_authentication(api_client: AsyncClient) -> None:
    response = await api_client.get("/auth/me")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_logout_without_token_returns_204(api_client: AsyncClient) -> None:
    response = await api_client.post("/auth/logout")

    assert response.status_code == status.HTTP_204_NO_CONTENT


async def test_logout_returns_204_even_if_revoke_fails(
    authenticated_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.auth.routes as auth_routes

    def _raise_extract(_token: str):
        raise RuntimeError("decode failed")

    monkeypatch.setattr(auth_routes, "extract_token_data", _raise_extract)

    response = await authenticated_client.post("/auth/logout")

    assert response.status_code == status.HTTP_204_NO_CONTENT


async def test_me_includes_user_roles(authenticated_client: AsyncClient) -> None:
    response = await authenticated_client.get("/auth/me")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert isinstance(payload.get("roles"), list)
    assert payload["roles"]


async def test_forgot_password_returns_generic_message(api_client: AsyncClient, admin_user) -> None:
    response = await api_client.post(
        "/auth/forgot-password",
        json={"email": admin_user.email},
    )

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert "Si el correo está registrado" in payload["detail"]


async def test_forgot_password_unknown_email_keeps_generic_response(api_client: AsyncClient) -> None:
    response = await api_client.post(
        "/auth/forgot-password",
        json={"email": "missing.user@test.com"},
    )

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert "Si el correo está registrado" in payload["detail"]
    assert "reset_token" not in payload


async def test_reset_password_updates_credentials(
    api_client: AsyncClient,
    admin_user,
    db: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth_services, "send_password_reset_email", lambda *_args, **_kwargs: None)

    forgot_response = await api_client.post(
        "/auth/forgot-password",
        json={"email": admin_user.email},
    )
    assert forgot_response.status_code == status.HTTP_200_OK

    reset_token = auth_services.create_password_reset_token_for_email(db, admin_user.email)
    assert reset_token

    exchange_response = await api_client.post(
        "/auth/reset-password/exchange",
        json={"token": reset_token},
    )
    assert exchange_response.status_code == status.HTTP_200_OK
    session_token = exchange_response.json()["session_token"]

    reset_response = await api_client.post(
        "/auth/reset-password",
        json={
            "token": session_token,
            "new_password": "newpassword123",
        },
    )
    assert reset_response.status_code == status.HTTP_200_OK
    assert reset_response.json()["detail"] == "Contraseña restablecida correctamente."

    login_with_old_password = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": admin_user.raw_password,
        },
    )
    assert login_with_old_password.status_code == status.HTTP_401_UNAUTHORIZED

    login_with_new_password = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": "newpassword123",
        },
    )
    assert login_with_new_password.status_code == status.HTTP_200_OK


async def test_reset_password_rejects_invalid_token(api_client: AsyncClient) -> None:
    response = await api_client.post(
        "/auth/reset-password",
        json={
            "token": "invalid-token",
            "new_password": "newpassword123",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Token de recuperación inválido o expirado." in response.json()["detail"]
