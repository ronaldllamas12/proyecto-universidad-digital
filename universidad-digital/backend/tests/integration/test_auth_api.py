import pytest
import pytest_asyncio
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.orm import Session

from tests.factories import RoleFactory, UserFactory


pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.fixture
def admin_user(db: Session):
    admin_role = RoleFactory(name="Administrador")
    user = UserFactory(roles=[admin_role])
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
