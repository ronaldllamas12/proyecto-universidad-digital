from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.enrollments.schemas import EnrollmentCreate, EnrollmentUpdate
from app.enrollments.services import (
    create_enrollment,
    deactivate_enrollment,
    get_enrollment,
    list_enrollments,
    update_enrollment,
)
from app.periods.models import AcademicPeriod
from app.roles.models import Role
from app.subjects.models import Subject
from app.users.models import User


pytestmark = [pytest.mark.integration, pytest.mark.db]


def _create_role(db: Session, name: str) -> Role:
    """
    Obtiene o crea un rol por nombre.

    Evita romper tests por la restricción UNIQUE (roles.name).
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


def _create_subject(db: Session, code: str = "MAT101") -> Subject:
    subject = Subject(code=code, name="Matemáticas", credits=3)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def _create_period(db: Session, code: str = "2025-1") -> AcademicPeriod:
    period = AcademicPeriod(
        code=code,
        name="Periodo 2025-1",
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
    subject: Subject,
    period: AcademicPeriod,
    teacher: User | None = None,
) -> Enrollment:
    enrollment = Enrollment(
        user_id=student.id,
        subject_id=subject.id,
        period_id=period.id,
        teacher_id=teacher.id if teacher else None,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def test_create_enrollment_success(db: Session) -> None:
    student = _create_user(db, "student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "teacher@uni.com", ["Docente"])
    subject = _create_subject(db)
    period = _create_period(db)

    actor = teacher  # puede ser admin/docente, aquí no se restringe en el servicio
    data = EnrollmentCreate(
        user_id=student.id,
        subject_id=subject.id,
        period_id=period.id,
        teacher_id=teacher.id,
    )

    response = create_enrollment(db, data=data, actor=actor)

    assert response.user_id == student.id
    assert response.subject_id == subject.id
    assert response.period_id == period.id
    assert response.teacher_id == teacher.id
    assert response.is_active is True
    assert response.subject_name == subject.name


def test_create_enrollment_raises_conflict_on_duplicate(db: Session) -> None:
    student = _create_user(db, "student2@uni.com", ["Estudiante"])
    teacher = _create_user(db, "teacher2@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT102")
    period = _create_period(db, code="2025-2")

    _create_enrollment(db, student=student, subject=subject, period=period, teacher=teacher)

    data = EnrollmentCreate(
        user_id=student.id,
        subject_id=subject.id,
        period_id=period.id,
        teacher_id=teacher.id,
    )

    with pytest.raises(ConflictError, match="ya está matriculado"):
        create_enrollment(db, data=data, actor=teacher)


def test_list_enrollments_filters_by_role(db: Session) -> None:
    student = _create_user(db, "filter_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "filter_teacher@uni.com", ["Docente"])
    admin = _create_user(db, "admin@uni.com", ["Administrador"])
    subject = _create_subject(db, code="MAT103")
    period = _create_period(db, code="2025-3")

    _create_enrollment(db, student=student, subject=subject, period=period, teacher=teacher)

    # Estudiante solo ve sus inscripciones
    student_enrollments = list_enrollments(db, user=student)
    assert len(student_enrollments) == 1
    assert student_enrollments[0].user_id == student.id

    # Docente solo ve las suyas
    teacher_enrollments = list_enrollments(db, user=teacher)
    assert len(teacher_enrollments) == 1
    assert teacher_enrollments[0].teacher_id == teacher.id

    # Admin ve todas
    admin_enrollments = list_enrollments(db, user=admin)
    assert len(admin_enrollments) == 1


def test_get_enrollment_raises_not_found_for_missing_id(db: Session) -> None:
    user = _create_user(db, "missing_enrollment@uni.com", ["Administrador"])

    with pytest.raises(NotFoundError, match="Inscripción no encontrada"):
        get_enrollment(db, enrollment_id=9999, user=user)


def test_update_enrollment_respects_student_ownership(db: Session) -> None:
    student = _create_user(db, "owner_student@uni.com", ["Estudiante"])
    other_student = _create_user(db, "other_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "owner_teacher@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT104")
    period = _create_period(db, code="2025-4")

    enrollment = _create_enrollment(
        db, student=student, subject=subject, period=period, teacher=teacher
    )

    # El estudiante dueño puede actualizar su inscripción
    updated = update_enrollment(
        db,
        enrollment_id=enrollment.id,
        data=EnrollmentUpdate(is_active=False),
        user=student,
    )
    assert updated.is_active is False

    # Otro estudiante no puede modificar la inscripción de otro
    with pytest.raises(ConflictError, match="Acceso no permitido"):
        update_enrollment(
            db,
            enrollment_id=enrollment.id,
            data=EnrollmentUpdate(is_active=True),
            user=other_student,
        )


def test_deactivate_enrollment_marks_inactive(db: Session) -> None:
    student = _create_user(db, "deact_student@uni.com", ["Estudiante"])
    teacher = _create_user(db, "deact_teacher@uni.com", ["Docente"])
    subject = _create_subject(db, code="MAT105")
    period = _create_period(db, code="2025-5")

    enrollment = _create_enrollment(
        db, student=student, subject=subject, period=period, teacher=teacher
    )

    response = deactivate_enrollment(db, enrollment_id=enrollment.id, user=student)

    assert response.is_active is False
    # Verificar en la BD
    db_enrollment = db.get(Enrollment, enrollment.id)
    assert db_enrollment is not None
    assert db_enrollment.is_active is False

