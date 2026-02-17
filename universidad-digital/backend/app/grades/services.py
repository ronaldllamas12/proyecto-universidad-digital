from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.grades.models import Grade
from app.grades.schemas import GradeCreate, GradeResponse, GradeUpdate
from app.users.models import User
from app.subjects.services import get_subject


def create_grade(db: Session, data: GradeCreate, user: User | None = None) -> Grade:
    """Registra una calificación. Si user es Docente, solo puede calificar sus asignaciones."""
    enrollment = db.get(Enrollment, data.enrollment_id)
    if not enrollment:
        raise NotFoundError("Inscripción no encontrada.")
    if not enrollment.is_active:
        raise ConflictError("Inscripción inactiva.")
    if user and any(role.name == "Docente" for role in user.roles):
        if enrollment.teacher_id != user.id:
            raise ConflictError("Solo puedes calificar estudiantes de tus materias asignadas.")
    grade = Grade(
        enrollment_id=data.enrollment_id,
        value=data.value,
        notes=data.notes,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


def list_grades(db: Session, user: User) -> list[GradeResponse]:
    """Lista calificaciones respetando ownership. Admin no ve el valor de la nota."""
    stmt = select(Grade).join(Enrollment).order_by(Grade.id)
    if any(role.name == "Estudiante" for role in user.roles):
        stmt = stmt.where(Enrollment.user_id == user.id)
    elif any(role.name == "Docente" for role in user.roles):
        stmt = stmt.where(Enrollment.teacher_id == user.id)
    grades = list(db.scalars(stmt).all())
    is_admin = any(role.name == "Administrador" for role in user.roles)
    
    
    result = []
    for g in grades:
        enrollment = db.get(Enrollment, g.enrollment_id)
        user_name = enrollment.user.full_name if enrollment and enrollment.user else None
        result.append(
            GradeResponse(
                id=g.id,
                enrollment_id=g.enrollment_id,
                value=None if is_admin else g.value,
                notes=g.notes,
                created_at=g.created_at,
                user_name=user_name,
               
            )
        )
    return result


def get_grade(db: Session, grade_id: int, user: User) -> Grade:
    """Obtiene una calificación por ID respetando ownership."""
    grade = db.get(Grade, grade_id)
    if not grade:
        raise NotFoundError("Calificación no encontrada.")
    enrollment = db.get(Enrollment, grade.enrollment_id)
    if any(role.name == "Estudiante" for role in user.roles):
        if not enrollment or enrollment.user_id != user.id:
            raise ConflictError("Acceso no permitido.")
    elif any(role.name == "Docente" for role in user.roles):
        if not enrollment or enrollment.teacher_id != user.id:
            raise ConflictError("Solo puedes ver o editar calificaciones de tus materias.")
    return grade


def update_grade(db: Session, grade_id: int, data: GradeUpdate, user: User) -> Grade:
    """Actualiza una calificación."""
    grade = get_grade(db, grade_id, user)
    if data.value is not None:
        grade.value = data.value
    if data.notes is not None:
        grade.notes = data.notes
    db.commit()
    db.refresh(grade)
    return grade


def delete_grade(db: Session, grade_id: int, user: User) -> None:
    """Elimina una calificación."""
    grade = get_grade(db, grade_id, user)
    db.delete(grade)
    db.commit()
