from __future__ import annotations

from app.core.errors import ConflictError, NotFoundError
from app.enrollments.models import Enrollment
from app.subjects.models import Subject
from app.subjects.schemas import SubjectCreate, SubjectUpdate
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

DUPLICATE_SUBJECT_CODE_MESSAGE = "Ya se encuentra una materia registrada con ese código."


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    """Crea una materia."""
    normalized_code = data.code.strip().upper()
    if db.scalar(select(Subject).where(func.upper(Subject.code) == normalized_code)):
        raise ConflictError(DUPLICATE_SUBJECT_CODE_MESSAGE)
    subject = Subject(code=data.code, name=data.name, credits=data.credits)
    db.add(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(DUPLICATE_SUBJECT_CODE_MESSAGE) from None
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
