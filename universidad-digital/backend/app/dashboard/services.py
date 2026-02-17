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
            Role.name == "Estudiante",
            User.is_active == True
        ).scalar()
    )

    # Total docentes activos
    total_teachers = (
        db.query(func.count(User.id.distinct()))
        .join(User.roles)
        .filter(
            Role.name == "Docente",
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
    # Inscripciones donde el docente está asignado (teacher_id)
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.teacher_id == current_user.id, Enrollment.is_active == True)
        .all()
    )
    enrollment_ids = [e.id for e in enrollments]
    subject_ids = list({e.subject_id for e in enrollments})
    period_ids = list({e.period_id for e in enrollments})
    active_periods = (
        db.query(func.count(AcademicPeriod.id))
        .filter(AcademicPeriod.id.in_(period_ids), AcademicPeriod.is_active == True)
        .scalar()
    ) if period_ids else 0
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()

    grades_count = (
        db.query(func.count(Grade.id)).filter(Grade.enrollment_id.in_(enrollment_ids)).scalar()
    ) if enrollment_ids else 0

    return {
        "teacher": current_user.full_name,
        "total_subjects": len(subject_ids),
        "total_students": len(enrollments),
        "active_periods": active_periods or 0,
        "total_users": total_users or 0,
    }


#===========================
# DASHBOARD  ESTUDIANTE
#===========================

def get_student_dashboard(db: Session, current_user):
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.is_active == True)
        .all()
    )
    enrollment_ids = [e.id for e in enrollments]
    period_ids = list({e.period_id for e in enrollments})
    active_periods = (
        db.query(func.count(AcademicPeriod.id))
        .filter(AcademicPeriod.id.in_(period_ids), AcademicPeriod.is_active == True)
        .scalar()
    ) if period_ids else 0
    grades_count = (
        db.query(func.count(Grade.id)).filter(Grade.enrollment_id.in_(enrollment_ids)).scalar()
    ) if enrollment_ids else 0

    return {
        "name": current_user.full_name,
        "enrolled_subjects": len(enrollments),
        "active_periods": active_periods or 0,
        "grades_count": grades_count or 0,
    }