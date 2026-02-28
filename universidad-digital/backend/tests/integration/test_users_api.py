# tests/integration/test_users_api.py

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.orm import Session
from fastapi import status

from app.users.models import User
from tests.factories import RoleFactory, UserFactory


# =====================================================
# MARCAS GLOBALES
# =====================================================

pytestmark = [
    pytest.mark.integration,
    pytest.mark.asyncio,
]


# =====================================================
# FIXTURES
# =====================================================


@pytest.fixture
def admin_role(db: Session):
    """Crea rol Administrador."""
    return RoleFactory(name="Administrador")


@pytest.fixture
def admin_user(db: Session, admin_role):
    """
    Crea usuario administrador.
    """

    user = UserFactory(roles=[admin_role])

    # contraseña usada por la factory
    user.raw_password = "testpassword"

    # ⚠️ IMPORTANTE:
    # asegurar que el usuario exista antes del login
    db.flush()

    return user


@pytest_asyncio.fixture
async def authenticated_admin_client(
    api_client: AsyncClient,
    admin_user,
) -> AsyncClient:
    """
    Cliente autenticado como administrador.
    """

    response = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": admin_user.raw_password,
        },
    )

    assert response.status_code == status.HTTP_200_OK

    token = response.json()["access_token"]

    # ✅ forma segura
    api_client.headers.update({"Authorization": f"Bearer {token}"})

    return api_client


@pytest.fixture
def student_user(db: Session):
    student_role = RoleFactory(name="Estudiante")
    user = UserFactory(roles=[student_role])
    user.raw_password = "testpassword"
    db.flush()
    return user


@pytest_asyncio.fixture
async def authenticated_student_client(
    api_client: AsyncClient,
    student_user,
) -> AsyncClient:
    response = await api_client.post(
        "/auth/login",
        json={
            "email": student_user.email,
            "password": student_user.raw_password,
        },
    )

    assert response.status_code == status.HTTP_200_OK

    token = response.json()["access_token"]
    api_client.headers.update({"Authorization": f"Bearer {token}"})
    return api_client


# =====================================================
# TESTS
# =====================================================


class TestUsersAPI:
    """Tests de integración para Users API."""

    # -------------------------------------------------
    # CREATE USER SUCCESS
    # -------------------------------------------------
    async def test_create_user_as_admin_success(
        self,
        authenticated_admin_client: AsyncClient,
        db: Session,
    ):
        new_user_data = {
            "full_name": "Test User From API",
            "email": "test.api@example.com",
            "password": "a_strong_password",
        }

        response = await authenticated_admin_client.post(
            "/users/",
            json=new_user_data,
        )

        # ---------- API ASSERT ----------
        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()

        assert response_data["email"] == new_user_data["email"]
        assert response_data["full_name"] == new_user_data["full_name"]
        assert "id" in response_data
        assert "hashed_password" not in response_data

        # ---------- DB ASSERT ----------
        db.flush()

        db_user = db.query(User).filter_by(email=new_user_data["email"]).one_or_none()

        assert db_user is not None
        assert db_user.full_name == new_user_data["full_name"]

    # -------------------------------------------------
    # UNAUTHORIZED CREATE
    # -------------------------------------------------
    async def test_create_user_unauthenticated_fails(
        self,
        api_client: AsyncClient,
    ):
        new_user_data = {
            "full_name": "Test User Unauthorized",
            "email": "unauthorized@example.com",
            "password": "password",
        }

        response = await api_client.post(
            "/users/",
            json=new_user_data,
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # -------------------------------------------------
    # DUPLICATE EMAIL
    # -------------------------------------------------
    async def test_create_user_with_duplicate_email_fails(
        self,
        authenticated_admin_client: AsyncClient,
        admin_user,
    ):
        duplicate_user_data = {
            "full_name": "Another Name",
            "email": admin_user.email,
            "password": "another_password",
        }

        response = await authenticated_admin_client.post(
            "/users/",
            json=duplicate_user_data,
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "email" in response.text.lower()

    async def test_list_users_forbidden_for_non_admin(
        self,
        authenticated_student_client: AsyncClient,
    ):
        response = await authenticated_student_client.get("/users/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_get_user_returns_404_when_not_found(
        self,
        authenticated_admin_client: AsyncClient,
    ):
        response = await authenticated_admin_client.get("/users/99999")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no encontrado" in response.text.lower()
