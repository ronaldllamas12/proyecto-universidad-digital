from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
import pytest_asyncio
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.enrollments.models import Enrollment
from app.grades.models import Grade
from app.periods.models import AcademicPeriod
from app.roles.models import Role
from app.subjects.models import Subject
from app.users.models import User
from tests.factories import UserFactory


pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


def _get_or_create_role(db: Session, name: str) -> Role:
    role = db.query(Role).filter_by(name=name).one_or_none()
    if role:
        return role
    role = Role(name=name, description=name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _create_user_with_role(db: Session, role_name: str, email: str) -> User:
    user = UserFactory(email=email)
    role = _get_or_create_role(db, role_name)
    user.roles.append(role)
    db.commit()
    db.refresh(user)
    user.raw_password = "testpassword"
    return user


def _create_enrollment_graph(db: Session, teacher: User, student: User) -> Enrollment:
    subject = Subject(code="API-GRAD", name="API Grades", credits=4)
    period = AcademicPeriod(
        code="2026-API",
        name="Periodo API",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
    )
    db.add_all([subject, period])
    db.commit()
    db.refresh(subject)
    db.refresh(period)

    enrollment = Enrollment(
        user_id=student.id,
        subject_id=subject.id,
        period_id=period.id,
        teacher_id=teacher.id,
        is_active=True,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


async def _login(client: AsyncClient, user: User) -> str:
    response = await client.post(
        "/auth/login",
        json={"email": user.email, "password": user.raw_password},
    )
    assert response.status_code == status.HTTP_200_OK
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def teacher_client(api_client: AsyncClient, db: Session) -> tuple[AsyncClient, User]:
    teacher = _create_user_with_role(db, "Docente", "teacher.api@uni.com")
    token = await _login(api_client, teacher)
    api_client.headers.update({"Authorization": f"Bearer {token}"})
    return api_client, teacher


@pytest_asyncio.fixture
async def admin_client(api_client: AsyncClient, db: Session) -> tuple[AsyncClient, User]:
    admin = _create_user_with_role(db, "Administrador", "admin.api@uni.com")
    token = await _login(api_client, admin)
    api_client.headers.update({"Authorization": f"Bearer {token}"})
    return api_client, admin


async def test_teacher_can_create_update_and_delete_grade_endpoint(
    teacher_client: tuple[AsyncClient, User],
    db: Session,
):
    client, teacher = teacher_client
    student = _create_user_with_role(db, "Estudiante", "student.api@uni.com")
    enrollment = _create_enrollment_graph(db, teacher=teacher, student=student)

    create_response = await client.post(
        "/grades/",
        json={"enrollment_id": enrollment.id, "value": "91.50", "notes": "Inicial"},
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    grade_id = create_response.json()["id"]

    update_response = await client.put(
        f"/grades/{grade_id}",
        json={"value": "95.00", "notes": "Ajustada"},
    )
    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.json()["notes"] == "Ajustada"

    delete_response = await client.delete(f"/grades/{grade_id}")
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT


async def test_student_can_list_grades_endpoint(
    api_client: AsyncClient,
    db: Session,
):
    teacher = _create_user_with_role(db, "Docente", "teacher.list@uni.com")
    student = _create_user_with_role(db, "Estudiante", "student.list@uni.com")
    enrollment = _create_enrollment_graph(db, teacher=teacher, student=student)

    grade = Grade(enrollment_id=enrollment.id, value=Decimal("88.00"), notes="Bien")
    db.add(grade)
    db.commit()

    token = await _login(api_client, student)
    api_client.headers.update({"Authorization": f"Bearer {token}"})

    response = await api_client.get("/grades/")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) >= 1


async def test_admin_get_grade_endpoint_masks_value(
    admin_client: tuple[AsyncClient, User],
    db: Session,
):
    client, _admin = admin_client
    teacher = _create_user_with_role(db, "Docente", "teacher.get@uni.com")
    student = _create_user_with_role(db, "Estudiante", "student.get@uni.com")
    enrollment = _create_enrollment_graph(db, teacher=teacher, student=student)

    grade = Grade(enrollment_id=enrollment.id, value=Decimal("77.00"), notes="Parcial")
    db.add(grade)
    db.commit()
    db.refresh(grade)

    response = await client.get(f"/grades/{grade.id}")
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["id"] == grade.id
    assert payload["value"] is None
