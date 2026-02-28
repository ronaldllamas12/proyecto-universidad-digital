from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.grades.models import Grade
from app.grades.schemas import GradeCreate, GradeUpdate
from app.grades.services import (
    create_grade,
    delete_grade,
    get_grade,
    list_grades,
    update_grade,
)
from app.periods.models import AcademicPeriod
from app.roles.models import Role
from app.subjects.models import Subject
from app.users.models import User


pytestmark = [pytest.mark.integration, pytest.mark.db]


def _create_role(db: Session, name: str) -> Role:
    """
    Obtiene o crea un rol por nombre para evitar violar la UNIQUE constraint.
    """
    existing = db.query(Role).filter_by(name=name).one_or_none()
    if existing:
        return existing

    role = Role(name=name, description=name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _create_user(db: Session, email: str, role_names: list[str]) -> User:
    user = User(
        email=email,
        full_name=email.split("@")[0],
        hashed_password="hashed",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    for name in role_names:
        role = _create_role(db, name)
        user.roles.append(role)
    db.commit()
    db.refresh(user)
    return user


def _create_subject(db: Session, code: str = "MAT201") -> Subject:
    subject = Subject(code=code, name="Materia Calificaciones", credits=3)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def _create_period(db: Session, code: str = "2025-GR") -> AcademicPeriod:
    period = AcademicPeriod(
        code=code,
        name="Periodo GR",
        start_date=date(2025, 1, 1),
        end_date=date(2025, 6, 30),
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


def _create_enrollment(
    db: Session,
    student: User,
    teacher: User,
    subject: Subject,
    period: AcademicPeriod,
    is_active: bool = True,
) -> Enrollment:
    enrollment = Enrollment(
        user_id=student.id,
        subject_id=subject.id,
        period_id=period.id,
        teacher_id=teacher.id,
        is_active=is_active,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def test_create_grade_success_for_teacher_of_enrollment(db: Session) -> None:
    student = _create_user(db, "grade_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "grade_teacher@uni.com", ["Docente"])
    subject = _create_subject(db)
    period = _create_period(db)
    enrollment = _create_enrollment(db, student=student, teacher=teacher, subject=subject, period=period)

    grade = create_grade(
        db,
        data=GradeCreate(
            enrollment_id=enrollment.id,
            value=Decimal("95.50"),
            notes="Excelente",
        ),
        user=teacher,
    )

    assert grade.id is not None
    assert grade.enrollment_id == enrollment.id
    assert grade.value == Decimal("95.50")


def test_create_grade_raises_not_found_when_enrollment_missing(db: Session) -> None:
    teacher = _create_user(db, "no_enrollment_teacher@uni.com", ["Docente"])

    with pytest.raises(NotFoundError, match="Inscripción no encontrada"):
        create_grade(
            db,
            data=GradeCreate(
                enrollment_id=9999,
                value=Decimal("10.00"),
                notes=None,
            ),
            user=teacher,
        )


def test_create_grade_raises_conflict_when_enrollment_inactive(db: Session) -> None:
    student = _create_user(db, "inactive_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "inactive_teacher@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT202")
    period = _create_period(db, code="2025-IN")
    enrollment = _create_enrollment(
        db, student=student, teacher=teacher, subject=subject, period=period, is_active=False
    )

    with pytest.raises(ConflictError, match="Inscripción inactiva"):
        create_grade(
            db,
            data=GradeCreate(
                enrollment_id=enrollment.id,
                value=Decimal("80.00"),
                notes=None,
            ),
            user=teacher,
        )


def test_create_grade_raises_conflict_when_teacher_is_not_owner(db: Session) -> None:
    student = _create_user(db, "other_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "real_teacher@uni.com", ["Docente"])
    other_teacher = _create_user(db, "other_teacher@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT203")
    period = _create_period(db, code="2025-OT")
    enrollment = _create_enrollment(
        db, student=student, teacher=teacher, subject=subject, period=period
    )

    with pytest.raises(ConflictError, match="Solo puedes calificar estudiantes de tus materias"):
        create_grade(
            db,
            data=GradeCreate(
                enrollment_id=enrollment.id,
                value=Decimal("75.00"),
                notes=None,
            ),
            user=other_teacher,
        )


def test_list_grades_masks_value_for_admin(db: Session) -> None:
    student = _create_user(db, "list_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "list_teacher@uni.com", ["Docente"])
    admin = _create_user(db, "list_admin@uni.com", ["Administrador"])
    subject = _create_subject(db, code="MAT204")
    period = _create_period(db, code="2025-LS")
    enrollment = _create_enrollment(
        db, student=student, teacher=teacher, subject=subject, period=period
    )

    grade = Grade(
        enrollment_id=enrollment.id,
        value=Decimal("88.00"),
        notes="Buen trabajo",
    )
    db.add(grade)
    db.commit()

    # Estudiante ve su nota
    student_grades = list_grades(db, user=student)
    assert len(student_grades) == 1
    assert student_grades[0].value == Decimal("88.00")

    # Docente también ve el valor
    teacher_grades = list_grades(db, user=teacher)
    assert len(teacher_grades) == 1
    assert teacher_grades[0].value == Decimal("88.00")

    # Admin ve value=None
    admin_grades = list_grades(db, user=admin)
    assert len(admin_grades) == 1
    assert admin_grades[0].value is None


def test_get_grade_respects_ownership(db: Session) -> None:
    student = _create_user(db, "own_student@uni.com", ["Estudiante"])
    other_student = _create_user(db, "own_other_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "own_teacher@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT205")
    period = _create_period(db, code="2025-OW")
    enrollment = _create_enrollment(
        db, student=student, teacher=teacher, subject=subject, period=period
    )

    grade = Grade(
        enrollment_id=enrollment.id,
        value=Decimal("90.00"),
        notes=None,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)

    # Estudiante dueño puede ver
    fetched = get_grade(db, grade_id=grade.id, user=student)
    assert fetched.id == grade.id

    # Otro estudiante no puede ver
    with pytest.raises(ConflictError, match="Acceso no permitido"):
        get_grade(db, grade_id=grade.id, user=other_student)


def test_update_and_delete_grade(db: Session) -> None:
    student = _create_user(db, "upd_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "upd_teacher@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT206")
    period = _create_period(db, code="2025-UP")
    enrollment = _create_enrollment(
        db, student=student, teacher=teacher, subject=subject, period=period
    )

    grade = Grade(
        enrollment_id=enrollment.id,
        value=Decimal("70.00"),
        notes="Inicial",
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)

    updated = update_grade(
        db,
        grade_id=grade.id,
        data=GradeUpdate(value=Decimal("85.00"), notes="Actualizada"),
        user=teacher,
    )

    assert updated.value == Decimal("85.00")
    assert updated.notes == "Actualizada"

    delete_grade(db, grade_id=grade.id, user=teacher)
    assert db.get(Grade, grade.id) is None

