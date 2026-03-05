from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.core.errors import ConflictError
from app.enrollments import services as enrollments_services
from app.enrollments.schemas import EnrollmentCreate, EnrollmentUpdate


pytestmark = [pytest.mark.unit]


def test_create_enrollment_raises_conflict_if_already_exists():
    db = Mock()
    db.scalar.return_value = object()
    actor = SimpleNamespace(id=1, roles=[])

    data = EnrollmentCreate(user_id=1, subject_id=2, period_id=3, teacher_id=4)

    with pytest.raises(ConflictError, match="ya está matriculado"):
        enrollments_services.create_enrollment(db, data, actor)


def test_list_enrollments_maps_to_response_for_student(monkeypatch):
    db = Mock()
    enrollment = SimpleNamespace(id=10)
    db.scalars.return_value.all.return_value = [enrollment]
    user = SimpleNamespace(id=7, roles=[SimpleNamespace(name="Estudiante")])
    monkeypatch.setattr(
        enrollments_services,
        "_enrollment_to_response",
        lambda _db, e: f"enrollment-{e.id}",
    )

    items = enrollments_services.list_enrollments(db, user)

    assert items == ["enrollment-10"]


def test_update_enrollment_student_cannot_edit_others():
    db = Mock()
    db.get.return_value = SimpleNamespace(user_id=99, is_active=True, teacher_id=5)
    user = SimpleNamespace(id=7, roles=[SimpleNamespace(name="Estudiante")])

    with pytest.raises(ConflictError, match="Acceso no permitido"):
        enrollments_services.update_enrollment(
            db,
            enrollment_id=1,
            data=EnrollmentUpdate(is_active=False),
            user=user,
        )
