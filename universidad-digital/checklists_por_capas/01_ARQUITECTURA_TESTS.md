# Capa 1 — Arquitectura del sistema de pruebas

## Estructura

- [✅] El proyecto separa claramente backend / frontend / e2e
  - Evidencia: `backend/`, `frontend/`, `frontend/cypress/e2e/`.
- [✅] Existe carpeta exclusiva tests/ o equivalente
  - Evidencia: `backend/tests/`, `frontend/tests/`.
- [✅] No hay tests mezclados con código de producción
  - Evidencia: sin coincidencias de `test*` en `backend/app/**` ni `frontend/src/**`.
- [✅] Los nombres de carpetas reflejan el nivel de prueba
  - Evidencia: `unit`, `integration`, `e2e`, `interaction`, `functional`.
- [✅] No existen archivos monolíticos gigantes
  - Evidencia: mayores fuentes de test ~227 líneas (`backend/tests/integration/test_grades_services.py`).

## Independencia

- [✅] Los tests pueden ejecutarse sin depender de orden manual
  - Evidencia: `backend/pytest.ini` con descubrimiento estándar; sin plugins de orden.
- [✅] No existen dependencias implícitas entre tests
  - Evidencia: no se detectan marcas `pytest-order`/`pytest-dependency`.
- [✅] Cada test prepara su propio estado
  - Evidencia: fixture `db` con transacción y rollback por función en `backend/tests/conftest.py`.
- [✅] No se usan datos persistentes compartidos
  - Evidencia: SQLite memoria + rollback backend; limpieza `cookies/localStorage/sessionStorage` en `frontend/cypress/support/e2e.ts`.

## Ampliación (arquitectura)

- [✅] Hay documentación de arquitectura de pruebas por capa
  - Evidencia: `backend/tests/TESTING_ARCHITECTURE.md`, `frontend/tests/FRONTEND_TESTING_ARCHITECTURE.md`.
- [✅] Existe matriz de trazabilidad requisito→test formalizada
  - Evidencia: `docs/TEST_TRACEABILITY_MATRIX.md` con IDs de requisito, criterio de entrada/salida y evidencia de suites.

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **9 ✅ / 0 ❌ / 0 ⚠️**
