from types import SimpleNamespace

import pytest

from app.auth.role_utils import (
    normalize_role_name,
    normalize_role_names,
    user_has_role,
    user_role_names,
)


pytestmark = [pytest.mark.unit]


def test_normalize_role_name_maps_known_prefixes_to_canonical_names():
    assert normalize_role_name("  docente temporal  ") == "Docente"
    assert normalize_role_name("Estudiante Invitado") == "Estudiante"
    assert normalize_role_name("administrador principal") == "Administrador"


def test_normalize_role_name_preserves_unknown_roles():
    assert normalize_role_name("Coordinador") == "Coordinador"


def test_normalize_role_names_and_user_role_helpers_support_variants():
    user = SimpleNamespace(
        roles=[
            SimpleNamespace(name="Docente Temporal"),
            SimpleNamespace(name="Coordinador"),
        ]
    )

    assert normalize_role_names(["Docente", "Coordinador"]) == {
        "Docente",
        "Coordinador",
    }
    assert user_role_names(user) == {"Docente", "Coordinador"}
    assert user_has_role(user, "Docente")
    assert not user_has_role(user, "Estudiante")
