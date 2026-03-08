from __future__ import annotations

from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import status
from httpx import ASGITransport, AsyncClient
from sqlalchemy.orm import Session

from app.main import app
from app.users import routes as users_routes
from tests.factories import RoleFactory, UserFactory


pytestmark = [pytest.mark.integration, pytest.mark.asyncio, pytest.mark.resilience]


@pytest.fixture
def admin_user(db: Session):
    admin_role = RoleFactory(name="Administrador")
    user = UserFactory(roles=[admin_role])
    user.raw_password = "testpassword"
    db.flush()
    return user


@pytest_asyncio.fixture
async def authenticated_admin_client(
    api_client: AsyncClient,
    admin_user,
) -> AsyncGenerator[AsyncClient, None]:
    response = await api_client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": admin_user.raw_password},
    )
    assert response.status_code == status.HTTP_200_OK

    token = response.json()["access_token"]

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    client = AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        yield client
    finally:
        await client.aclose()


async def test_users_listing_recovers_after_transient_dependency_failure(
    authenticated_admin_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    original_list_users = users_routes.list_users
    calls = {"count": 0}

    def flaky_list_users(db_session: Session):
        calls["count"] += 1
        if calls["count"] == 1:
            raise RuntimeError("simulated dependency outage")
        return original_list_users(db_session)

    monkeypatch.setattr(users_routes, "list_users", flaky_list_users)

    first_response = await authenticated_admin_client.get("/users/")
    second_response = await authenticated_admin_client.get("/users/")

    assert first_response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert second_response.status_code == status.HTTP_200_OK
    assert isinstance(second_response.json(), list)
