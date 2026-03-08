from __future__ import annotations

import pytest
import pytest_asyncio
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.orm import Session

from tests.factories import RoleFactory, UserFactory


pytestmark = [pytest.mark.integration, pytest.mark.asyncio, pytest.mark.security]


@pytest.fixture
def admin_user(db: Session):
    admin_role = RoleFactory(name="Administrador")
    user = UserFactory(roles=[admin_role])
    user.raw_password = "testpassword"
    db.flush()
    return user


@pytest_asyncio.fixture
async def authenticated_admin_client(api_client: AsyncClient, admin_user) -> AsyncClient:
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


async def test_security_headers_present_in_api_response(api_client: AsyncClient) -> None:
    response = await api_client.get("/auth/me")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "no-referrer"
    assert response.headers.get("content-security-policy") == "default-src 'self'"
    assert "max-age=" in (response.headers.get("strict-transport-security") or "")


async def test_security_headers_present_in_openapi_response(api_client: AsyncClient) -> None:
    response = await api_client.get("/openapi.json")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "no-referrer"
    assert response.headers.get("content-security-policy") == "default-src 'self'"
    assert "max-age=" in (response.headers.get("strict-transport-security") or "")


async def test_login_sqli_payload_does_not_bypass_auth(api_client: AsyncClient, admin_user) -> None:
    response = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": "' OR '1'='1",
        },
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_create_user_rejects_xss_like_full_name(
    authenticated_admin_client: AsyncClient,
) -> None:
    payload = {
        "full_name": "<script>alert('xss')</script>",
        "email": "xss.blocked@uni.com",
        "password": "safe_password_123",
    }

    response = await authenticated_admin_client.post("/users/", json=payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = response.json()
    assert "detail" in body
    assert any(err.get("loc") == ["body", "full_name"] for err in body["detail"])
