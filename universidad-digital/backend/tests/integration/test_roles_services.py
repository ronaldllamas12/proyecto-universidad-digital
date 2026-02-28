import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.roles.models import Role
from app.roles.schemas import RoleCreate, RoleUpdate
from app.roles.services import (
    create_role,
    delete_role,
    ensure_default_roles,
    get_role,
    list_roles,
    update_role,
)


pytestmark = [pytest.mark.integration, pytest.mark.db]


def _create_role(db: Session, name: str, description: str | None = None) -> Role:
    return create_role(db, RoleCreate(name=name, description=description))


def test_create_role_success(db: Session) -> None:
    role = _create_role(db, name="Coordinador", description="Gestión académica")

    assert role.id is not None
    assert role.name == "Coordinador"
    assert role.description == "Gestión académica"


def test_create_role_raises_conflict_on_duplicate_name(db: Session) -> None:
    _create_role(db, name="Docente")

    with pytest.raises(ConflictError, match="nombre del rol ya existe"):
        _create_role(db, name="Docente")


def test_list_roles_returns_roles_ordered_by_id(db: Session) -> None:
    _create_role(db, name="RoleA")
    _create_role(db, name="RoleB")

    roles = list_roles(db)

    assert len(roles) == 2
    assert roles[0].name == "RoleA"
    assert roles[1].name == "RoleB"


def test_get_role_raises_not_found_for_missing_id(db: Session) -> None:
    with pytest.raises(NotFoundError, match="Rol no encontrado"):
        get_role(db, role_id=9999)


def test_update_role_changes_name_and_description(db: Session) -> None:
    role = _create_role(db, name="Tutor", description="Original")

    updated = update_role(
        db,
        role_id=role.id,
        data=RoleUpdate(name="Mentor", description="Actualizada"),
    )

    assert updated.name == "Mentor"
    assert updated.description == "Actualizada"


def test_update_role_raises_conflict_when_name_exists(db: Session) -> None:
    _create_role(db, name="Administrador")
    role = _create_role(db, name="Auxiliar")

    with pytest.raises(ConflictError, match="nombre del rol ya existe"):
        update_role(db, role_id=role.id, data=RoleUpdate(name="Administrador"))


def test_delete_role_removes_role(db: Session) -> None:
    role = _create_role(db, name="Temporal")

    delete_role(db, role_id=role.id)

    with pytest.raises(NotFoundError, match="Rol no encontrado"):
        get_role(db, role_id=role.id)


def test_ensure_default_roles_creates_missing_and_is_idempotent(db: Session) -> None:
    ensure_default_roles(db)
    ensure_default_roles(db)

    roles = list_roles(db)
    role_names = {role.name for role in roles}

    assert "Administrador" in role_names
    assert "Docente" in role_names
    assert "Estudiante" in role_names
    assert len([r for r in roles if r.name == "Administrador"]) == 1
    assert len([r for r in roles if r.name == "Docente"]) == 1
    assert len([r for r in roles if r.name == "Estudiante"]) == 1
