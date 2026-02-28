from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.dashboard.services import (
    get_admin_dashboard,
    get_student_dashboard,
    get_teacher_dashboard,
)
from app.enrollments.models import Enrollment
from app.grades.models import Grade
from app.periods.models import AcademicPeriod
from app.roles.models import Role
from app.subjects.models import Subject
from app.users.models import User


pytestmark = [pytest.mark.integration, pytest.mark.db]


def _get_or_create_role(db: Session, name: str) -> Role:
    existing = db.query(Role).filter_by(name=name).one_or_none()
    if existing:
        return existing
    role = Role(name=name, description=name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _create_user(db: Session, email: str, role_names: list[str], is_active: bool = True) -> User:
    user = User(
        email=email,
        full_name=email.split("@")[0],
        hashed_password="hashed",
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    for role_name in role_names:
        role = _get_or_create_role(db, role_name)
        user.roles.append(role)

    db.commit()
    db.refresh(user)
    return user


def _create_subject(db: Session, code: str, active: bool = True) -> Subject:
    subject = Subject(code=code, name=f"Materia {code}", credits=3, is_active=active)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def _create_period(db: Session, code: str, active: bool = True) -> AcademicPeriod:
    period = AcademicPeriod(
        code=code,
        name=f"Periodo {code}",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
        is_active=active,
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


def _create_enrollment(
    db: Session,
    student: User,
    subject: Subject,
    period: AcademicPeriod,
    teacher: User | None = None,
    is_active: bool = True,
) -> Enrollment:
    enrollment = Enrollment(
        user_id=student.id,
        subject_id=subject.id,
        period_id=period.id,
        teacher_id=teacher.id if teacher else None,
        is_active=is_active,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def _create_grade(db: Session, enrollment: Enrollment, value: Decimal = Decimal("95.00")) -> Grade:
    grade = Grade(enrollment_id=enrollment.id, value=value, notes="nota")
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


def test_admin_dashboard_returns_expected_aggregates(db: Session) -> None:
    teacher = _create_user(db, "teacher@uni.com", ["Docente"], is_active=True)
    student = _create_user(db, "student@uni.com", ["Estudiante"], is_active=True)
    _create_user(db, "inactive@uni.com", ["Estudiante"], is_active=False)

    subject_active = _create_subject(db, code="MAT501", active=True)
    _create_subject(db, code="MAT502", active=False)

    period_active = _create_period(db, code="2026-1", active=True)
    _create_period(db, code="2026-2", active=False)

    _create_enrollment(
        db,
        student=student,
        subject=subject_active,
        period=period_active,
        teacher=teacher,
        is_active=True,
    )

    dashboard = get_admin_dashboard(db)

    assert dashboard["total_users"] == 2
    assert dashboard["total_students"] == 1
    assert dashboard["total_teachers"] == 1
    assert dashboard["total_subjects"] == 2
    assert dashboard["inactive_subjects"] == 1
    assert dashboard["active_periods"] == 1
    assert dashboard["total_enrollments"] == 1


def test_teacher_dashboard_returns_counts_for_assigned_enrollments(db: Session) -> None:
    teacher = _create_user(db, "teacher2@uni.com", ["Docente"])
    student_a = _create_user(db, "student.a@uni.com", ["Estudiante"])
    student_b = _create_user(db, "student.b@uni.com", ["Estudiante"])

    subject_1 = _create_subject(db, code="MAT601")
    subject_2 = _create_subject(db, code="MAT602")

    period_active = _create_period(db, code="2027-1", active=True)
    period_inactive = _create_period(db, code="2027-2", active=False)

    enrollment_1 = _create_enrollment(
        db,
        student=student_a,
        subject=subject_1,
        period=period_active,
        teacher=teacher,
        is_active=True,
    )
    enrollment_2 = _create_enrollment(
        db,
        student=student_b,
        subject=subject_2,
        period=period_inactive,
        teacher=teacher,
        is_active=True,
    )
    _create_enrollment(
        db,
        student=student_b,
        subject=subject_1,
        period=period_active,
        teacher=teacher,
        is_active=False,
    )

    _create_grade(db, enrollment_1)
    _create_grade(db, enrollment_2)

    dashboard = get_teacher_dashboard(db, teacher)

    assert dashboard["teacher"] == teacher.full_name
    assert dashboard["total_subjects"] == 2
    assert dashboard["total_students"] == 2
    assert dashboard["active_periods"] == 1
    assert dashboard["total_users"] == 3
    assert dashboard["total_grades"] == 2


def test_teacher_dashboard_returns_zeroes_without_enrollments(db: Session) -> None:
    teacher = _create_user(db, "teacher.empty@uni.com", ["Docente"])

    dashboard = get_teacher_dashboard(db, teacher)

    assert dashboard["total_subjects"] == 0
    assert dashboard["total_students"] == 0
    assert dashboard["active_periods"] == 0
    assert dashboard["total_grades"] == 0


def test_student_dashboard_counts_only_active_enrollments(db: Session) -> None:
    teacher = _create_user(db, "teacher3@uni.com", ["Docente"])
    student = _create_user(db, "student.main@uni.com", ["Estudiante"])

    subject_1 = _create_subject(db, code="MAT701")
    subject_2 = _create_subject(db, code="MAT702")

    period_active = _create_period(db, code="2028-1", active=True)
    period_inactive = _create_period(db, code="2028-2", active=False)

    enrollment_active = _create_enrollment(
        db,
        student=student,
        subject=subject_1,
        period=period_active,
        teacher=teacher,
        is_active=True,
    )
    _create_enrollment(
        db,
        student=student,
        subject=subject_2,
        period=period_inactive,
        teacher=teacher,
        is_active=False,
    )

    _create_grade(db, enrollment_active, value=Decimal("88.50"))

    dashboard = get_student_dashboard(db, student)

    assert dashboard["name"] == student.full_name
    assert dashboard["enrolled_subjects"] == 1
    assert dashboard["active_periods"] == 1
    assert dashboard["grades_count"] == 1


def test_student_dashboard_returns_zeroes_without_enrollments(db: Session) -> None:
    student = _create_user(db, "student.empty@uni.com", ["Estudiante"])

    dashboard = get_student_dashboard(db, student)

    assert dashboard["enrolled_subjects"] == 0
    assert dashboard["active_periods"] == 0
    assert dashboard["grades_count"] == 0
