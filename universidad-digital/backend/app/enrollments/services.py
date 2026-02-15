from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.enrollments.schemas import EnrollmentCreate, EnrollmentUpdate
from app.periods.models import AcademicPeriod
from app.subjects.models import Subject
from app.users.models import User


# services.py
from app.enrollments.schemas import EnrollmentResponse

def create_enrollment(db: Session, data: EnrollmentCreate, actor: User) -> EnrollmentResponse:
    enrollment = Enrollment(
        user_id=data.user_id,
        subject_id=data.subject_id,
        period_id=data.period_id,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return EnrollmentResponse.from_orm(enrollment)


from sqlalchemy import select
from app.enrollments.schemas import EnrollmentResponse

def list_enrollments(db: Session, user: User) -> list[EnrollmentResponse]:
    """Lista inscripciones respetando ownership."""
    stmt = select(Enrollment).order_by(Enrollment.id)
    
    # Si es estudiante, filtra solo sus inscripciones
    if any(role.name == "Estudiante" for role in user.roles):
        stmt = stmt.where(Enrollment.user_id == user.id)
    
    # Ejecuta la consulta
    enrollments = db.scalars(stmt).all()
    
    # Convierte a Pydantic para que coincida con response_model
    return [EnrollmentResponse.from_orm(e) for e in enrollments]


def get_enrollment(db: Session, enrollment_id: int, user: User) -> EnrollmentResponse:
    enrollment = db.get(Enrollment, enrollment_id)
    return EnrollmentResponse.from_orm(enrollment)



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

    db.commit()
    db.refresh(enrollment)

    # Retorna Pydantic
    return EnrollmentResponse.from_orm(enrollment)


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

    # Retorna Pydantic
    return EnrollmentResponse.from_orm(enrollment)