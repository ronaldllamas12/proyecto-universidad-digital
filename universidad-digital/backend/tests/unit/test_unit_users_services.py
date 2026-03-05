from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.core.errors import ConflictError
from app.roles.models import Role
from app.users import services as users_services
from app.users.schemas import UserCreate


pytestmark = [pytest.mark.unit]


def test_create_user_assigns_default_role_and_persists(monkeypatch):
    db = Mock()
    default_role = Role(name="Estudiante", description="Rol base")
    db.scalar.side_effect = [None, default_role]
    monkeypatch.setattr(users_services, "hash_password", lambda _: "hashed")

    data = UserCreate(
        email="student@uni.com",
        full_name="Student User",
        password="password123",
        role_ids=None,
    )

    user = users_services.create_user(db, data)

    assert user.email == "student@uni.com"
    assert user.hashed_password == "hashed"
    assert user.roles == [default_role]
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(user)


def test_create_user_rejects_short_password_for_admin_role(monkeypatch):
    db = Mock()
    admin_role = SimpleNamespace(name="Administrador", id=1)
    db.scalar.return_value = None
    db.scalars.return_value.all.return_value = [admin_role]
    monkeypatch.setattr(users_services, "hash_password", lambda _: "hashed")

    data = UserCreate(
        email="admin@uni.com",
        full_name="Admin User",
        password="short1234",
        role_ids=[1],
    )

    with pytest.raises(ConflictError, match="al menos 12"):
        users_services.create_user(db, data)


def test_assign_role_only_commits_when_role_is_new():
    db = Mock()
    user = SimpleNamespace(roles=[])
    role = SimpleNamespace(id=10, name="Docente")
    db.get.side_effect = [user, role, user, role]

    users_services.assign_role(db, user_id=1, role_id=10)
    first_count = db.commit.call_count

    users_services.assign_role(db, user_id=1, role_id=10)

    assert role in user.roles
    assert first_count == 1
    assert db.commit.call_count == 1
