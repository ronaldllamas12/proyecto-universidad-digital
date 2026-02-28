import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.roles.models import Role
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate
from app.users.services import (
    assign_role,
    create_user,
    deactivate_user,
    get_user,
    list_users,
    remove_role,
    update_user,
)


pytestmark = [pytest.mark.integration, pytest.mark.db]


def _create_role(db: Session, name: str) -> Role:
    """
    Obtiene o crea un rol por nombre, respetando la UNIQUE constraint en roles.name.
    """
    existing = db.query(Role).filter_by(name=name).one_or_none()
    if existing:
        return existing

    role = Role(name=name, description=name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _create_basic_user(db: Session, email: str = "user@example.com") -> User:
    estudiante = _create_role(db, "Estudiante")
    user = create_user(
        db,
        UserCreate(
            email=email,
            full_name="Usuario Demo",
            password="password123",  # 11 chars, válido para Estudiante
            role_ids=[estudiante.id],
        ),
    )
    return user


def test_create_user_assigns_default_student_role_when_no_role_ids(db: Session) -> None:
    estudiante = _create_role(db, "Estudiante")

    user = create_user(
        db,
        UserCreate(
            email="student@example.com",
            full_name="Estudiante",
            password="password123",
            role_ids=None,
        ),
    )

    assert user.id is not None
    assert user.email == "student@example.com"
    assert len(user.roles) == 1
    assert user.roles[0].id == estudiante.id


def test_create_user_raises_conflict_on_duplicate_email(db: Session) -> None:
    _create_basic_user(db, email="dup@example.com")

    with pytest.raises(ConflictError, match="El email ya está registrado"):
        create_user(
            db,
            UserCreate(
                email="dup@example.com",
                full_name="Otro",
                password="password123",
                role_ids=None,
            ),
        )


def test_create_user_raises_not_found_when_role_does_not_exist(db: Session) -> None:
    with pytest.raises(NotFoundError, match="Rol no encontrado"):
        create_user(
            db,
            UserCreate(
                email="norole@example.com",
                full_name="Sin Rol",
                password="password123",
                role_ids=[9999],
            ),
        )


def test_create_user_requires_stronger_password_for_admin_or_teacher(db: Session) -> None:
    admin_role = _create_role(db, "Administrador")

    # Contraseña demasiado corta para administrador (min_length = 12)
    with pytest.raises(ConflictError, match="12 caracteres"):
        create_user(
            db,
            UserCreate(
                email="admin@example.com",
                full_name="Admin",
                password="shortpass",
                role_ids=[admin_role.id],
            ),
        )

    # Contraseña suficientemente larga
    user = create_user(
        db,
        UserCreate(
            email="admin_ok@example.com",
            full_name="Admin Ok",
            password="verystrongpass",  # > 12
            role_ids=[admin_role.id],
        ),
    )

    assert any(role.name == "Administrador" for role in user.roles)


def test_update_user_changes_full_name_and_password_and_roles(db: Session) -> None:
    user = _create_basic_user(db, email="update@example.com")
    teacher_role = _create_role(db, "Docente")

    updated = update_user(
        db,
        user_id=user.id,
        data=UserUpdate(
            full_name="Nuevo Nombre",
            password="teacherstrongpass",  # >= 12 para Docente
            role_ids=[teacher_role.id],
        ),
    )

    assert updated.full_name == "Nuevo Nombre"
    assert any(role.name == "Docente" for role in updated.roles)


def test_update_user_rejects_short_password_for_admin_or_teacher(db: Session) -> None:
    admin_role = _create_role(db, "Administrador")
    user = _create_basic_user(db, email="shortpwd@example.com")

    # Asigna rol de administrador primero
    assign_role(db, user_id=user.id, role_id=admin_role.id)

    with pytest.raises(ConflictError, match="12 caracteres"):
        update_user(
            db,
            user_id=user.id,
            data=UserUpdate(password="shortadm"),
        )


def test_deactivate_user_sets_is_active_false(db: Session) -> None:
    user = _create_basic_user(db, email="inactive@example.com")

    deactivated = deactivate_user(db, user_id=user.id)

    assert deactivated.is_active is False
    fetched = get_user(db, user_id=user.id)
    assert fetched.is_active is False


def test_assign_and_remove_role(db: Session) -> None:
    user = _create_basic_user(db, email="roles@example.com")
    extra_role = _create_role(db, "Docente")

    updated = assign_role(db, user_id=user.id, role_id=extra_role.id)
    assert any(role.name == "Docente" for role in updated.roles)

    # Llamada idempotente: no debe duplicar
    updated_again = assign_role(db, user_id=user.id, role_id=extra_role.id)
    docente_roles = [r for r in updated_again.roles if r.name == "Docente"]
    assert len(docente_roles) == 1

    updated_after_remove = remove_role(db, user_id=user.id, role_id=extra_role.id)
    assert all(role.name != "Docente" for role in updated_after_remove.roles)


def test_remove_role_raises_not_found_when_role_missing(db: Session) -> None:
    user = _create_basic_user(db, email="norole-remove@example.com")

    with pytest.raises(NotFoundError, match="Rol no encontrado"):
        remove_role(db, user_id=user.id, role_id=9999)


def test_list_users_returns_created_users_in_order(db: Session) -> None:
    _create_basic_user(db, email="a@example.com")
    _create_basic_user(db, email="b@example.com")

    users = list_users(db)

    emails = [u.email for u in users]
    assert emails[0] == "a@example.com"
    assert emails[1] == "b@example.com"

