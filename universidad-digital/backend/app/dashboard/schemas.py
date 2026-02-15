from pydantic import BaseModel


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_students: int
    total_teachers: int
    total_subjects: int
    inactive_subjects: int
    active_periods: int
