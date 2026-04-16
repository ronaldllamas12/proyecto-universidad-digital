from __future__ import annotations

from app.auth.role_utils import normalize_role_name
from app.core.errors import ConflictError, NotFoundError
from app.core.security import hash_password
from app.roles.models import Role
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate
from sqlalchemy import select
from sqlalchemy.orm import Session


def create_user(db: Session, data: UserCreate) -> User:
    """Crea un usuario y asigna roles."""
    if db.scalar(select(User).where(User.email == data.email)):
        raise ConflictError("El email institucional ya está registrado.")

    roles: list[Role] = []
    if data.role_ids:
        roles = list(db.scalars(select(Role).where(Role.id.in_(data.role_ids))).all())
        if len(roles) != len(set(data.role_ids)):
            raise NotFoundError("Rol no encontrado.")
    else:
        default_role = db.scalar(select(Role).where(Role.name == "Estudiante"))
        if default_role:
            roles = [default_role]

    min_length = 8
    if any(
        normalize_role_name(role.name) in {"Administrador", "Docente"}
        for role in roles
    ):
        min_length = 12
    if len(data.password) < min_length:
        raise ConflictError(f"La contraseña debe tener al menos {min_length} caracteres.")

    user = User(
        email=data.email,
        recovery_email=data.recovery_email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
    )
    if roles:
        user.roles = roles
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session) -> list[User]:
    """Lista usuarios."""
    return list(db.scalars(select(User).order_by(User.id)).all())


def get_user(db: Session, user_id: int) -> User:
    """Obtiene un usuario por ID."""
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("Usuario no encontrado.")
    return user


def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    """Actualiza un usuario."""
    user = get_user(db, user_id)
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.password is not None:
        min_length = 8
        if any(
            normalize_role_name(role.name) in {"Administrador", "Docente"}
            for role in user.roles
        ):
            min_length = 12
        if len(data.password) < min_length:
            raise ConflictError(f"La contraseña debe tener al menos {min_length} caracteres.")
        user.hashed_password = hash_password(data.password)
    if data.recovery_email is not None:
        user.recovery_email = data.recovery_email
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role_ids is not None:
        roles = list(db.scalars(select(Role).where(Role.id.in_(data.role_ids))).all())
        if len(roles) != len(set(data.role_ids)):
            raise NotFoundError("Rol no encontrado.")
        user.roles = roles
    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: int) -> User:
    """Desactiva un usuario (eliminación lógica)."""
    user = get_user(db, user_id)
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def ensure_default_admin(db: Session) -> None:
    """Crea un usuario administrador por defecto si no existe ninguno."""
    from app.core.config import settings

    admin_role = db.scalar(select(Role).where(Role.name == "Administrador"))
    if admin_role is None:
        return

    existing = db.scalar(
        select(User).join(User.roles).where(Role.name == "Administrador")
    )
    if existing:
        return

    admin = User(
        email=settings.seed_admin_email,
        full_name=settings.seed_admin_name,
        hashed_password=hash_password(settings.seed_admin_password),
    )
    admin.roles = [admin_role]
    db.add(admin)
    db.commit()


def assign_role(db: Session, user_id: int, role_id: int) -> User:
    """Asigna un rol a un usuario."""
    user = get_user(db, user_id)
    role = db.get(Role, role_id)
    if not role:
        raise NotFoundError("Rol no encontrado.")
    if role not in user.roles:
        user.roles.append(role)
        db.commit()
        db.refresh(user)
    return user


def remove_role(db: Session, user_id: int, role_id: int) -> User:
    """Remueve un rol de un usuario."""
    user = get_user(db, user_id)
    role = db.get(Role, role_id)
    if not role:
        raise NotFoundError("Rol no encontrado.")
    if role in user.roles:
        user.roles.remove(role)
        db.commit()
        db.refresh(user)
    return user
