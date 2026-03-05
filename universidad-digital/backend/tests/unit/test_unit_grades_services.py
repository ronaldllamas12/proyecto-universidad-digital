from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.core.errors import ConflictError
from app.grades import services as grades_services
from app.grades.schemas import GradeCreate


pytestmark = [pytest.mark.unit]


def test_create_grade_rejects_inactive_enrollment():
    db = Mock()
    db.get.return_value = SimpleNamespace(is_active=False)

    with pytest.raises(ConflictError, match="Inscripción inactiva"):
        grades_services.create_grade(
            db,
            GradeCreate(enrollment_id=1, value=Decimal("95"), notes="ok"),
        )


def test_list_grades_hides_value_for_admin():
    db = Mock()
    grade = SimpleNamespace(
        id=1,
        enrollment_id=10,
        value=Decimal("89.50"),
        notes="good",
        created_at=datetime.now(timezone.utc),
    )
    enrollment = SimpleNamespace(
        user=SimpleNamespace(full_name="Alice"),
        subject=SimpleNamespace(name="Álgebra"),
    )
    db.scalars.return_value.all.return_value = [grade]
    db.get.return_value = enrollment
    user = SimpleNamespace(id=1, roles=[SimpleNamespace(name="Administrador")])

    items = grades_services.list_grades(db, user)

    assert len(items) == 1
    assert items[0].value is None
    assert items[0].user_name == "Alice"
    assert items[0].subject_name == "Álgebra"


def test_get_grade_for_teacher_rejects_other_teacher_assignment():
    db = Mock()
    grade = SimpleNamespace(enrollment_id=5)
    enrollment = SimpleNamespace(teacher_id=99, user_id=2)
    db.get.side_effect = [grade, enrollment]
    user = SimpleNamespace(id=7, roles=[SimpleNamespace(name="Docente")])

    with pytest.raises(ConflictError, match="Solo puedes ver o editar"):
        grades_services.get_grade(db, grade_id=1, user=user)
