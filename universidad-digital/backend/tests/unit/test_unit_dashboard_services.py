from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.dashboard import services as dashboard_services


pytestmark = [pytest.mark.unit]


class FakeQuery:
    def __init__(self, scalar_value=None, all_value=None):
        self._scalar_value = scalar_value
        self._all_value = all_value

    def filter(self, *args, **kwargs):
        return self

    def join(self, *args, **kwargs):
        return self

    def scalar(self):
        return self._scalar_value

    def all(self):
        return self._all_value


def test_get_admin_dashboard_returns_aggregated_counters():
    db = Mock()
    db.query.side_effect = [
        FakeQuery(scalar_value=25),
        FakeQuery(scalar_value=18),
        FakeQuery(scalar_value=5),
        FakeQuery(scalar_value=12),
        FakeQuery(scalar_value=2),
        FakeQuery(scalar_value=1),
        FakeQuery(scalar_value=40),
    ]

    data = dashboard_services.get_admin_dashboard(db)

    assert data["total_users"] == 25
    assert data["total_students"] == 18
    assert data["total_teachers"] == 5
    assert data["total_subjects"] == 12
    assert data["inactive_subjects"] == 2
    assert data["active_periods"] == 1
    assert data["total_enrollments"] == 40


def test_get_teacher_dashboard_counts_subjects_students_periods_and_grades():
    db = Mock()
    current_user = SimpleNamespace(id=50, full_name="Docente Uno")
    enrollments = [
        SimpleNamespace(id=1, subject_id=101, period_id=202601),
        SimpleNamespace(id=2, subject_id=102, period_id=202601),
    ]
    db.query.side_effect = [
        FakeQuery(all_value=enrollments),
        FakeQuery(scalar_value=1),
        FakeQuery(scalar_value=100),
        FakeQuery(scalar_value=2),
    ]

    data = dashboard_services.get_teacher_dashboard(db, current_user)

    assert data["teacher"] == "Docente Uno"
    assert data["total_subjects"] == 2
    assert data["total_students"] == 2
    assert data["active_periods"] == 1
    assert data["total_users"] == 100
    assert data["total_grades"] == 2


def test_get_student_dashboard_returns_zero_counts_without_enrollments():
    db = Mock()
    current_user = SimpleNamespace(id=77, full_name="Estudiante Uno")
    db.query.side_effect = [FakeQuery(all_value=[])]

    data = dashboard_services.get_student_dashboard(db, current_user)

    assert data["name"] == "Estudiante Uno"
    assert data["enrolled_subjects"] == 0
    assert data["active_periods"] == 0
    assert data["grades_count"] == 0
