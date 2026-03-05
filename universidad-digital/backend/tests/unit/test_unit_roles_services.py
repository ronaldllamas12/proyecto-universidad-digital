from unittest.mock import Mock

import pytest

from app.core.errors import ConflictError
from app.roles import services as roles_services
from app.roles.schemas import RoleCreate, RoleUpdate


pytestmark = [pytest.mark.unit]


def test_create_role_raises_conflict_when_name_exists():
    db = Mock()
    db.scalar.return_value = object()

    with pytest.raises(ConflictError, match="ya existe"):
        roles_services.create_role(db, RoleCreate(name="Docente", description="x"))


def test_update_role_raises_conflict_for_duplicate_name(monkeypatch):
    db = Mock()
    current_role = Mock(name="Role")
    current_role.name = "Docente"
    monkeypatch.setattr(roles_services, "get_role", lambda *_: current_role)
    db.scalar.return_value = object()

    with pytest.raises(ConflictError, match="ya existe"):
        roles_services.update_role(db, 1, RoleUpdate(name="Administrador"))


def test_ensure_default_roles_creates_only_missing_roles():
    db = Mock()
    existing_admin = Mock()
    existing_admin.name = "Administrador"
    db.scalars.return_value.all.return_value = [existing_admin]

    roles_services.ensure_default_roles(db)

    assert db.add.call_count == 2
    db.commit.assert_called_once()
