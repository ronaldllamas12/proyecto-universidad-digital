from datetime import date

import pytest
from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.periods.models import AcademicPeriod
from app.subjects.models import Subject
from app.subjects.schemas import SubjectCreate, SubjectUpdate
from app.subjects.services import (create_subject, deactivate_subject,
                                   get_subject, list_subjects, update_subject)
from app.users.models import User
from sqlalchemy.orm import Session

pytestmark = [pytest.mark.integration, pytest.mark.db]


def _create_subject(db: Session, code: str, name: str = "Materia Demo") -> Subject:
    return create_subject(db, SubjectCreate(code=code, name=name, credits=3))


def _create_user(db: Session, email: str) -> User:
    user = User(email=email, full_name=email.split("@")[0], hashed_password="hashed")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_period(db: Session, code: str = "2026-1") -> AcademicPeriod:
    period = AcademicPeriod(
        code=code,
        name=f"Periodo {code}",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


def _create_enrollment(
    db: Session,
    user: User,
    subject: Subject,
    period: AcademicPeriod,
    is_active: bool = True,
) -> Enrollment:
    enrollment = Enrollment(
        user_id=user.id,
        subject_id=subject.id,
        period_id=period.id,
        is_active=is_active,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def test_create_subject_success(db: Session) -> None:
    created = _create_subject(db, code="MAT301", name="Programación")

    assert created.id is not None
    assert created.code == "MAT301"
    assert created.name == "Programación"
    assert created.credits == 3


def test_create_subject_raises_conflict_on_duplicate_code(db: Session) -> None:
    _create_subject(db, code="MAT302")

    with pytest.raises(ConflictError, match="materia registrada con ese código"):
        _create_subject(db, code="MAT302")


def test_get_subject_raises_not_found_for_missing_id(db: Session) -> None:
    with pytest.raises(NotFoundError, match="Materia no encontrada"):
        get_subject(db, subject_id=9999)


def test_update_subject_updates_name_credits_and_active(db: Session) -> None:
    subject = _create_subject(db, code="MAT303", name="Antes")

    updated = update_subject(
        db,
        subject_id=subject.id,
        data=SubjectUpdate(name="Después", credits=5, is_active=False),
    )

    assert updated.name == "Después"
    assert updated.credits == 5
    assert updated.is_active is False


def test_deactivate_subject_marks_subject_inactive(db: Session) -> None:
    subject = _create_subject(db, code="MAT304")

    deactivated = deactivate_subject(db, subject_id=subject.id)

    assert deactivated.is_active is False


def test_list_subjects_includes_students_count_only_for_active_enrollments(db: Session) -> None:
    subject = _create_subject(db, code="MAT305")
    user_a = _create_user(db, "student.a@uni.com")
    user_b = _create_user(db, "student.b@uni.com")
    period = _create_period(db)

    _create_enrollment(db, user=user_a, subject=subject, period=period, is_active=True)
    _create_enrollment(db, user=user_b, subject=subject, period=period, is_active=False)

    subjects = list_subjects(db)
    listed = next(item for item in subjects if item.id == subject.id)

    students_count = getattr(listed, "students_count", None)
    assert students_count == 1
