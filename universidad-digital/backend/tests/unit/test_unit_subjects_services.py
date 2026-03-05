from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.core.errors import ConflictError
from app.subjects import services as subjects_services
from app.subjects.schemas import SubjectCreate


pytestmark = [pytest.mark.unit]


def test_create_subject_raises_conflict_when_code_exists():
    db = Mock()
    db.scalar.return_value = object()

    with pytest.raises(ConflictError, match="código de materia ya existe"):
        subjects_services.create_subject(
            db,
            SubjectCreate(code="MAT101", name="Matemática", credits=3),
        )


def test_list_subjects_attaches_students_count():
    db = Mock()
    subject = SimpleNamespace(id=1, code="MAT101", name="Matemática")
    db.execute.return_value.all.return_value = [(subject, 4)]

    items = subjects_services.list_subjects(db)

    assert items[0] is subject
    assert items[0].students_count == 4


def test_deactivate_subject_marks_inactive(monkeypatch):
    db = Mock()
    subject = SimpleNamespace(is_active=True)
    monkeypatch.setattr(subjects_services, "get_subject", lambda *_: subject)

    result = subjects_services.deactivate_subject(db, subject_id=1)

    assert result.is_active is False
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(subject)
