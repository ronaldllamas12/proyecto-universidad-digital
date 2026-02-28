# tests/conftest.py

from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.core.deps import get_db
from app.main import app

from tests.factories import BaseFactory, UserFactory, RoleFactory


# =====================================================
# DATABASE DE TEST (SQLite MEMORY REAL COMPARTIDA)
# =====================================================

DATABASE_URL = "sqlite://"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # ⭐ CLAVE PARA SQLITE MEMORY
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# =====================================================
# CREAR TABLAS UNA SOLA VEZ
# =====================================================


@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# =====================================================
# SESIÓN AISLADA POR TEST (ROLLBACK)
# =====================================================


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# =====================================================
# FACTORY BOY USA LA MISMA SESIÓN ⭐
# =====================================================


@pytest.fixture(autouse=True)
def set_factory_session(db: Session):
    for factory_class in (BaseFactory, RoleFactory, UserFactory):
        setattr(factory_class._meta, "sqlalchemy_session", db)
    yield
    for factory_class in (BaseFactory, RoleFactory, UserFactory):
        setattr(factory_class._meta, "sqlalchemy_session", None)


# =====================================================
# FASTAPI USA LA MISMA SESIÓN ⭐⭐⭐
# =====================================================


@pytest.fixture(autouse=True)
def override_get_db(db: Session):

    def _get_test_db():
        yield db

    app.dependency_overrides[get_db] = _get_test_db

    yield

    app.dependency_overrides.clear()


# =====================================================
# API CLIENT ASYNC
# =====================================================


@pytest_asyncio.fixture
async def api_client(db: Session) -> AsyncGenerator[AsyncClient, None]:

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        yield client


# =====================================================
# CLIENTE AUTENTICADO (ADMIN)
# =====================================================


@pytest_asyncio.fixture
async def authorized_client(api_client: AsyncClient, db: Session):

    # Crear rol admin
    admin_role = RoleFactory(name="Administrador")

    # Crear usuario admin
    admin_user = UserFactory(roles=[admin_role])

    # ⭐ FORZAR escritura en DB antes del login
    db.flush()

    response = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": "testpassword",
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    api_client.headers.update({"Authorization": f"Bearer {token}"})

    return api_client


# =====================================================
# DATA FIXTURES
# =====================================================


@pytest.fixture
def normal_user():
    return UserFactory()


@pytest.fixture
def student_role():
    return RoleFactory(name="student")


@pytest.fixture(scope="function")
def valid_user_payload() -> dict:
    return {
        "full_name": "Usuario Válido",
        "email": "usuario.valido@universidad.com",
        "password": "password123",
    }


@pytest.fixture(scope="function")
def invalid_user_payload() -> dict:
    return {
        "full_name": "",
        "email": "correo-invalido",
        "password": "123",
    }


@pytest.fixture(scope="function")
def course_payload() -> dict:
    return {
        "code": "CURSO-101",
        "name": "Curso de Prueba",
        "credits": 3,
    }


@pytest.fixture(scope="function")
def enrollment_payload() -> dict:
    return {
        "user_id": 1,
        "subject_id": 1,
        "period_id": 1,
        "teacher_id": None,
    }


@pytest_asyncio.fixture(scope="function")
async def authenticated_headers(api_client: AsyncClient, db: Session) -> dict:
    admin_role = RoleFactory(name="Administrador")
    admin_user = UserFactory(roles=[admin_role])
    db.flush()

    response = await api_client.post(
        "/auth/login",
        json={
            "email": admin_user.email,
            "password": "testpassword",
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
