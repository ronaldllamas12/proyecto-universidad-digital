from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.enrollments.schemas import EnrollmentCreate, EnrollmentUpdate,EnrollmentResponse
from app.periods.models import AcademicPeriod
from app.subjects.models import Subject
from app.users.models import User


def _enrollment_to_response(db: Session, e: Enrollment) -> EnrollmentResponse:
    """Construye EnrollmentResponse con nombres desde relaciones."""
    subject = db.get(Subject, e.subject_id) if e.subject_id else None
    period = db.get(AcademicPeriod, e.period_id) if e.period_id else None
    user = db.get(User, e.user_id) if e.user_id else None
    teacher = db.get(User, e.teacher_id) if e.teacher_id else None
    return EnrollmentResponse(
        id=e.id,
        user_id=e.user_id,
        subject_id=e.subject_id,
        period_id=e.period_id,
        teacher_id=e.teacher_id,
        is_active=e.is_active,
        enrolled_at=e.enrolled_at,
        subject_name=subject.name if subject else None,
        period_name=period.name if period else None,
        user_name=user.full_name if user else None,
        teacher_name=teacher.full_name if teacher else None,
    )


def create_enrollment(db: Session, data: EnrollmentCreate, actor: User) -> EnrollmentResponse:
    existing = db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == data.user_id,
            Enrollment.subject_id == data.subject_id,
            Enrollment.period_id == data.period_id,
        )
    )

    if existing:
        
        
        raise ConflictError(
            "El estudiante ya está matriculado en esta materia para este periodo"
        )
        
    enrollment = Enrollment(
        user_id=data.user_id,
        subject_id=data.subject_id,
        period_id=data.period_id,
        teacher_id=data.teacher_id,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return _enrollment_to_response(db, enrollment)


from sqlalchemy import select
from app.enrollments.schemas import EnrollmentResponse

def list_enrollments(db: Session, user: User) -> list[EnrollmentResponse]:
    """Lista inscripciones respetando ownership."""
    stmt = select(Enrollment).order_by(Enrollment.id)

    if any(role.name == "Estudiante" for role in user.roles):
        stmt = stmt.where(Enrollment.user_id == user.id)
    elif any(role.name == "Docente" for role in user.roles):
        stmt = stmt.where(Enrollment.teacher_id == user.id)

    enrollments = db.scalars(stmt).all()
    return [_enrollment_to_response(db, e) for e in enrollments]


def get_enrollment(db: Session, enrollment_id: int, user: User) -> EnrollmentResponse:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise NotFoundError("Inscripción no encontrada.")
    return _enrollment_to_response(db, enrollment)



def update_enrollment(
    db: Session, enrollment_id: int, data: EnrollmentUpdate, user: User
) -> EnrollmentResponse:
    """Actualiza una inscripción y devuelve un Pydantic model."""
    # Obtiene la inscripción respetando ownership
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise NotFoundError("Inscripción no encontrada.")

    if any(role.name == "Estudiante" for role in user.roles):
        if enrollment.user_id != user.id:
            raise ConflictError("Acceso no permitido.")

    # Actualiza campos
    if data.is_active is not None:
        enrollment.is_active = data.is_active
    if data.teacher_id is not None:
        enrollment.teacher_id = data.teacher_id

    db.commit()
    db.refresh(enrollment)

    return _enrollment_to_response(db, enrollment)


def deactivate_enrollment(
    db: Session, enrollment_id: int, user: User
) -> EnrollmentResponse:
    """Desactiva una inscripción (eliminación lógica) y devuelve un Pydantic model."""
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise NotFoundError("Inscripción no encontrada.")

    if any(role.name == "Estudiante" for role in user.roles):
        if enrollment.user_id != user.id:
            raise ConflictError("Acceso no permitido.")

    # Eliminación lógica
    enrollment.is_active = False
    db.commit()
    db.refresh(enrollment)

    return _enrollment_to_response(db, enrollment)