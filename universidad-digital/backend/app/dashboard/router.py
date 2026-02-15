from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles_dep
from app.dashboard.services import get_admin_dashboard, get_teacher_dashboard, get_student_dashboard
from app.dashboard.schemas import AdminDashboardResponse



router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/admin", response_model=AdminDashboardResponse)
def admin_dashboard(
    db: Session = Depends(get_db),
    _admin=Depends(require_roles_dep("Administrador")),
):
    return get_admin_dashboard(db)


@router.get("/teacher")
def teacher_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles_dep("Docente")),
):
    return get_teacher_dashboard(db, current_user)

@router.get("/student")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles_dep("Estudiante")),
):
    return get_student_dashboard(db, current_user)


