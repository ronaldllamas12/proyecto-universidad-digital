# Capa 2 — Pruebas unitarias (Backend)

## Cobertura funcional

- [✅] Todas las funciones de negocio tienen tests
  - Evidencia: existen tests unitarios para `auth`, `users`, `roles`, `subjects`, `periods`, `enrollments`, `grades` y `dashboard` en `backend/tests/unit/`.
- [✅] Se prueban valores límite
  - Evidencia: tokens inválidos, inputs vacíos/espacios, casos de borde en `test_auth_services.py`.
- [✅] Se prueban valores inválidos
  - Evidencia: token inválido, claims faltantes, password incorrecto.
- [✅] Se prueban excepciones
  - Evidencia: `pytest.raises(...)` en `test_auth_services.py` y `test_security.py`.
- [✅] Se prueban casos normales
  - Evidencia: creación/decodificación JWT y validaciones de flujo normal.

## Calidad del test

- [✅] Un test valida un comportamiento
  - Evidencia: nombres y objetivos específicos por caso.
- [✅] No existen asserts múltiples sin relación
  - Evidencia: asserts agrupados por mismo comportamiento.
- [✅] Los nombres describen comportamiento, no implementación
  - Evidencia: `test_get_token_from_request_prefers_authorization_header`, etc.
- [✅] No se prueba base de datos en unit tests
  - Evidencia: uso de `Mock` y `monkeypatch`, sin fixture de BD en unit.
- [✅] Se usan mocks correctamente
  - Evidencia: `Mock`, `monkeypatch.setattr(...)`.

## Robustez

- [✅] Los tests fallan si cambia la lógica
  - Evidencia: validan contratos concretos (claims, errores, permisos).
- [✅] No hay asserts triviales (assert True)
  - Evidencia: búsqueda sin coincidencias.
- [✅] No se prueban getters/setters simples
  - Evidencia: no se observan tests triviales de acceso.
- [✅] No hay sleeps ni tiempos fijos
  - Evidencia: búsqueda sin coincidencias de `sleep()` o esperas fijas en `backend/tests/**`.

## Ampliación (unit backend)

- [✅] Existe cobertura unitaria por dominio (users, roles, subjects, periods, grades, enrollments, dashboard)
  - Evidencia: se agregaron `test_unit_users_services.py`, `test_unit_roles_services.py`, `test_unit_subjects_services.py`, `test_unit_periods_services.py`, `test_unit_enrollments_services.py`, `test_unit_grades_services.py` y `test_unit_dashboard_services.py`.
- [✅] Existe umbral de cobertura unit backend ≥ 90%
  - Evidencia: ejecución completa reporta `TOTAL 1144 / miss 114 / Cover 90%` y `coverage.xml` actualizado.

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **12 ✅ / 0 ❌ / 0 ⚠️**
