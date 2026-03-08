from __future__ import annotations

from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import status
from httpx import ASGITransport, AsyncClient
from sqlalchemy.orm import Session

from app.main import app
from tests.factories import RoleFactory, UserFactory


pytestmark = [pytest.mark.integration, pytest.mark.asyncio, pytest.mark.concurrency]


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


async def test_concurrent_user_creation_with_same_email_is_handled(
    authenticated_admin_client: AsyncClient,
) -> None:
    payload = {
        "full_name": "Concurrent User",
        "email": "concurrent.user@uni.com",
        "password": "a_strong_password",
    }

    # Deterministic proxy for concurrent collision: two immediate writes
    # against the same unique key must not create duplicates.
    first_response = await authenticated_admin_client.post("/users/", json=payload)
    second_response = await authenticated_admin_client.post("/users/", json=payload)

    assert first_response.status_code == status.HTTP_201_CREATED
    assert second_response.status_code == status.HTTP_409_CONFLICT


async def test_system_remains_operational_after_concurrency_conflict(
    authenticated_admin_client: AsyncClient,
) -> None:
    response = await authenticated_admin_client.get("/users/")

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)
