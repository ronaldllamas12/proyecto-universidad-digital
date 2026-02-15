from sqlalchemy.orm import Session
from sqlalchemy import func, true

from app.users.models import User
from app.subjects.models import Subject
from app.periods.models import AcademicPeriod
from app.roles.models import Role
from app.enrollments.models import Enrollment
from app.grades.models import Grade 
#===========================
# DASHBOARD  ADMINISTRADOR
#===========================
def get_admin_dashboard(db: Session):

    # Total usuarios activos
    total_users = (
        db.query(func.count(User.id))
        .filter(User.is_active == True)
        .scalar()
    )

    #  Total estudiantes activos
    total_students = (
        db.query(func.count(User.id))
        .join(User.roles)
        .filter(
            Role.description.ilike("%estudiante%"),
            User.is_active == True
        ).scalar()
    )

    # Total docentes activos
    total_teachers = (
        db.query(func.count(User.id.distinct()))
        .join(User.roles)
        .filter(
            Role.description.ilike("%docente%"),
            User.is_active == True
        )
        .scalar()
    )

    # Total materias
    total_subjects = db.query(func.count(Subject.id)).scalar()

    # Materias inactivas
    inactive_subjects = (
        db.query(func.count(Subject.id))
        .filter(Subject.is_active == False)
        .scalar()
    )

    #  Periodos activos
    active_periods = (
        db.query(func.count(AcademicPeriod.id))
        .filter(AcademicPeriod.is_active == True)
        .scalar()
    )

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_subjects": total_subjects,
        "inactive_subjects": inactive_subjects,
        "active_periods": active_periods,
    }

#===========================
# DASHBOARD  DOCENTE
#===========================

def get_teacher_dashboard(db: Session, current_user):

    # Materias del docente
    subjects = db.query(Subject).filter(
        Subject.id == current_user.id
    ).all()

    subject_ids = [s.id for s in subjects]

    # Inscripciones
    enrollments = db.query(Enrollment).filter(
        Enrollment.id.in_(subject_ids)
    ).all()

    # Calificaciones
    grades = db.query(Grade).filter(
        Grade.id.in_([e.id for e in enrollments])
    ).all()

    return {
        "teacher": current_user.full_name,
        "total_subjects": len(subjects),
        "total_students": len(enrollments),
        "total_grades": len(grades),
    }


#===========================
# DASHBOARD  ESTUDIANTE
#===========================

def get_student_dashboard(db: Session, current_user):

    # Materias del estudiante
    subjects = db.query(Subject).filter(
        Subject.id == current_user.id
    ).all()

    subject_ids = [s.id for s in subjects]

    # Inscripciones
    enrollments = db.query(Enrollment).filter(
        Enrollment.id.in_(subject_ids)
    ).all()

    # Calificaciones
    grades = db.query(Grade).filter(
        Grade.id.in_([e.id for e in enrollments])
    ).all()

    return {
        "student": current_user.full_name,
        "total_subjects": len(subjects),
        "total_students": len(enrollments),
        "total_grades": len(grades),
    }