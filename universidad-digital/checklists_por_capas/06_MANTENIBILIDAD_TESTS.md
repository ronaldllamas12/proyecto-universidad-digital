# Capa 6 — Mantenibilidad del código de pruebas

## Legibilidad

- [✅] Los nombres son autoexplicativos
  - Evidencia: nombres de tests orientados a comportamiento en backend/frontend.
- [✅] No hay duplicación significativa
  - Evidencia: uso de fixtures, page objects y comandos Cypress reutilizables.
- [✅] Existe refactorización
  - Evidencia: arquitectura de pruebas documentada con separación por capas.
- [✅] Existe reutilización
  - Evidencia: `tests/fixtures`, `tests/setup`, `cypress/support/page-objects`, `cypress/support/commands`.

## Escalabilidad

- [✅] Se pueden agregar pruebas sin romper otras
  - Evidencia: aislamiento por fixtures/rollback y limpieza de estado global.
- [✅] Existe estructura reutilizable
  - Evidencia: backend y frontend con carpetas por nivel.
- [✅] Existen helpers o fixtures
  - Evidencia: `backend/tests/conftest.py`, `backend/tests/factories.py`, `frontend/tests/fixtures`, `cypress/support/*`.

## Ampliación (mantenibilidad)

- [✅] Se controlan métricas de deuda técnica del test suite (duplicación, complejidad) de forma automatizada
  - Evidencia: workflow `.github/workflows/test-maintainability.yml` ejecuta `radon` (complejidad en `backend/tests`) y `jscpd` (duplicación en `frontend/tests` y `frontend/cypress`) con configuración en `.jscpd.json`.

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **7 ✅ / 0 ❌ / 0 ⚠️**
