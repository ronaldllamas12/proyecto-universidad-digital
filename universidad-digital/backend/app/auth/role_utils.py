from __future__ import annotations

from collections.abc import Iterable

ROLE_PREFIXES: tuple[tuple[str, str], ...] = (
    ("administrador", "Administrador"),
    ("docente", "Docente"),
    ("estudiante", "Estudiante"),
)


def normalize_role_name(role_name: str) -> str:
    normalized = " ".join(role_name.strip().split()).lower()
    for prefix, canonical in ROLE_PREFIXES:
        if normalized == prefix or normalized.startswith(f"{prefix} "):
            return canonical
    return role_name.strip()


def normalize_role_names(role_names: Iterable[str]) -> set[str]:
    return {normalize_role_name(role_name) for role_name in role_names}


def user_role_names(user) -> set[str]:
    return normalize_role_names(
        getattr(role, "name", str(role)) for role in getattr(user, "roles", [])
    )


def user_has_role(user, *role_names: str) -> bool:
    return bool(user_role_names(user).intersection(normalize_role_names(role_names)))
