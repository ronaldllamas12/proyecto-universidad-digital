# tests/e2e/test_enrollment_flow.py

import pytest
from datetime import date

from httpx import AsyncClient
from fastapi import status
from tests.factories import UserFactory, RoleFactory


# marcar todo el archivo como e2e + asyncio
pytestmark = [pytest.mark.e2e, pytest.mark.asyncio]


# =====================================================
# HELPER AUTENTICACIÓN (CORRECTO ✅)
# =====================================================
async def get_authenticated_client(
    user_email: str,
    user_pass: str,
    client: AsyncClient,
) -> AsyncClient:
    """
    Autentica el cliente y agrega el token JWT.
    NO usa deepcopy (rompe AsyncClient).
    """

    auth_response = await client.post(
        "/auth/login",
        json={
            "email": user_email,
            "password": user_pass,
        },
    )

    assert auth_response.status_code == status.HTTP_200_OK, "Fallo en login"

    token = auth_response.json()["access_token"]

    client.headers.update({"Authorization": f"Bearer {token}"})

    return client


# =====================================================
# TEST E2E FLOW
# =====================================================
class TestEnrollmentFlow:
    """
    Flujo End-to-End completo:

    Admin → crea asignatura →
    crea estudiante →
    estudiante login →
    estudiante se matricula →
    verifica matrícula.
    """

    async def test_student_enrollment_story(
        self,
        api_client: AsyncClient,
    ):
        # =================================================
        # ACTO 1 — PREPARACIÓN ADMIN
        # =================================================
        print("\n--- E2E Acto 1: Preparación Admin ---")

        # ⚠️ Para E2E usamos factories SOLO para bootstrap

        admin_role = RoleFactory(name="Administrador")
        student_role = RoleFactory(name="Estudiante")
        admin_user = UserFactory(roles=[admin_role])

        admin_email = admin_user.email
        admin_pass = "testpassword"

        # login admin
        admin_client = await get_authenticated_client(
            admin_email,
            admin_pass,
            api_client,
        )

        # -------------------------------------------------
        # Crear asignatura
        # -------------------------------------------------
        subject_data = {
            "code": "PRUEBA-E2E-01",
            "name": "Pruebas de Software Avanzado",
            "credits": 3,
        }

        subject_response = await admin_client.post(
            "/subjects/",
            json=subject_data,
        )

        assert subject_response.status_code == status.HTTP_201_CREATED

        subject_id = subject_response.json()["id"]

        print(f"Asignatura creada ID={subject_id}")

        period_data = {
            "code": "2026-1",
            "name": "Periodo 2026-1",
            "start_date": date(2026, 1, 1).isoformat(),
            "end_date": date(2026, 6, 30).isoformat(),
        }

        period_response = await admin_client.post(
            "/periods/",
            json=period_data,
        )

        assert period_response.status_code == status.HTTP_201_CREATED

        period_id = period_response.json()["id"]

        print(f"Periodo creado ID={period_id}")

        # -------------------------------------------------
        # Crear estudiante
        # -------------------------------------------------
        student_email = "carlos.student@university.com"
        student_pass = "student_secure_pass"

        student_data = {
            "full_name": "Carlos Estudiante",
            "email": student_email,
            "password": student_pass,
            "role_ids": [student_role.id],
        }

        student_response = await admin_client.post(
            "/users/",
            json=student_data,
        )

        assert student_response.status_code == status.HTTP_201_CREATED

        student_id = student_response.json()["id"]

        print(f"Estudiante creado ID={student_id}")

        # =================================================
        # ACTO 2 — ACCIONES DEL ESTUDIANTE
        # =================================================
        print("\n--- E2E Acto 2: Acciones Estudiante ---")

        enrollment_data = {
            "user_id": student_id,
            "subject_id": subject_id,
            "period_id": period_id,
            "teacher_id": admin_user.id,
        }

        enrollment_response = await admin_client.post(
            "/enrollments/",
            json=enrollment_data,
        )

        assert enrollment_response.status_code == status.HTTP_201_CREATED

        print("Estudiante matriculado correctamente")

        student_client = await get_authenticated_client(
            student_email,
            student_pass,
            api_client,
        )

        # =================================================
        # ACTO 3 — VERIFICACIÓN
        # =================================================
        print("\n--- E2E Acto 3: Verificación ---")

        my_enrollments_response = await student_client.get("/enrollments/")

        assert my_enrollments_response.status_code == status.HTTP_200_OK

        my_enrollments = my_enrollments_response.json()

        assert isinstance(my_enrollments, list)
        assert len(my_enrollments) > 0

        enrolled_in_course = any(
            enrollment["subject_id"] == subject_id for enrollment in my_enrollments
        )

        assert enrolled_in_course, "No se encontró la matrícula creada"

        print("✅ E2E completado correctamente")
