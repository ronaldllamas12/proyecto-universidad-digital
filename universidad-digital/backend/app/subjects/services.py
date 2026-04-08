from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.subjects.models import Subject
from app.subjects.schemas import SubjectCreate, SubjectUpdate
from app.enrollments.models import Enrollment


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    """Crea una materia."""
    if db.scalar(select(Subject).where(Subject.code == data.code)):
        raise ConflictError("El código de materia ya existe.")
    subject = Subject(code=data.code, name=data.name, credits=data.credits)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def list_subjects(db: Session) -> list[Subject]:
    """Lista materias con cantidad de estudiantes inscritos."""

    stmt = (
        select(
            Subject,
            func.count(Enrollment.id).label("students_count"),
        )
        .outerjoin(
            Enrollment,
            (Enrollment.subject_id == Subject.id) & Enrollment.is_active,
        )
        .group_by(Subject.id)
        .order_by(Subject.id)
    )

    results = db.execute(stmt).all()

    subjects: list[Subject] = []

    for subject, students_count in results:
        # 👇 agregamos atributo dinámico
        subject.students_count = students_count
        subjects.append(subject)

    return subjects


def get_subject(db: Session, subject_id: int) -> Subject:
    """Obtiene una materia por ID."""
    subject = db.get(Subject, subject_id)
    if not subject:
        raise NotFoundError("Materia no encontrada.")
    return subject


def update_subject(db: Session, subject_id: int, data: SubjectUpdate) -> Subject:
    """Actualiza una materia."""
    subject = get_subject(db, subject_id)
    if data.name is not None:
        subject.name = data.name
    if data.credits is not None:
        subject.credits = data.credits
    if data.is_active is not None:
        subject.is_active = data.is_active
    db.commit()
    db.refresh(subject)
    return subject


def deactivate_subject(db: Session, subject_id: int) -> Subject:
    """Desactiva una materia (eliminación lógica)."""
    subject = get_subject(db, subject_id)
    subject.is_active = False
    db.commit()
    db.refresh(subject)
    return subject
