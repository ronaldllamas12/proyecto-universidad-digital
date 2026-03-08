# Exposición — Reporte final de testing

Fecha: 2026-03-07  
Proyecto: Universidad Digital  
Objetivo: explicar qué pruebas existen, qué se encontró en el checklist inicial, qué correcciones se aplicaron y qué resultados se obtuvieron.

## 1) ¿Qué pruebas tiene el proyecto y qué valida cada una?

## Backend

- **Unit tests** (`backend/tests/unit`):
  - Validan lógica de negocio aislada (usuarios, materias, periodos, matrículas, calificaciones, dashboard, auth).
  - Enfocados en reglas, validaciones, errores esperados y comportamiento de servicios.

- **Integration tests** (`backend/tests/integration`):
  - Validan interacción de servicios + persistencia + contratos API.
  - Cubren estados válidos/inválidos, conflictos de negocio y consistencia entre módulos.

- **E2E backend** (`backend/tests/e2e`):
  - Validan flujos completos por HTTP (autenticación, rutas protegidas, permisos).

- **Performance tests** (`backend/tests/performance`):
  - Miden latencia con percentiles `p50/p95/p99`.
  - Incluyen perfil nominal, burst liviano y estrés sostenido (`@pytest.mark.stress`, n=400).

## Frontend

- **Componentes unitarios** (`frontend/tests/unit`):
  - Renderizado, props, comportamiento de componentes y fallback seguro.

- **Interacción** (`frontend/tests/interaction`):
  - Eventos de usuario (click/input/submit) e interacciones de teclado.

- **Funcionales** (`frontend/tests/functional`):
  - Flujos de pantalla completos (loading/error/success, formularios, resiliencia UI).

- **E2E Cypress** (`frontend/cypress/e2e`):
  - Flujos reales de navegación, auth, permisos por rol, CRUD y resiliencia.

## 2) ¿Qué se encontró primero en el checklist?

Durante la evaluación inicial por capas y enterprise, los principales hallazgos fueron:

1. **Observabilidad insuficiente** (sin tablero histórico consolidado).
2. **Performance incompleta** (había smoke/burst, faltaba estrés sostenido formal).
3. **Riesgo de seguridad en tests E2E** (fallback de credenciales en Cypress).
4. **Falta de runbook operativo completo** para decisión de salida (GO/NO-GO) y reproducción CI→local.
5. **Trazabilidad requisito → test** incompleta o no formalizada centralmente.
6. **Estrategia fast/full no formalizada** en todos los flujos de calidad.

## 3) Correcciones aplicadas

## Observabilidad y diagnóstico

- Se creó workflow de métricas de observabilidad:
  - `.github/workflows/test-observability-metrics.yml`
- Se generan artefactos:
  - `observability-report.md`
  - `observability-metrics.json`
  - `observability-dashboard.md`
  - `observability-trends.json`
- Se documentó operación del dashboard:
  - `docs/TEST_OBSERVABILITY_DASHBOARD.md`

## Estabilidad y reproducibilidad

- Se formalizó SLO de estabilidad:
  - `.github/workflows/test-stability-slo.yml`
  - `docs/TEST_STABILITY_SLO.md`
- Se creó guía de reproducción CI→local:
  - `docs/CI_LOCAL_REPRO_GUIDE.md`

## Performance y escalabilidad

- Se creó escenario de **estrés sostenido**:
  - `backend/tests/performance/test_api_latency_smoke.py`
- Se agregó marker dedicado:
  - `backend/pytest.ini` (`stress`)
- Se separó estrategia de performance en CI:
  - `.github/workflows/performance-smoke.yml` (perfil **fast** para PR y **full** para push/manual)
  - `docs/PERFORMANCE_PROFILES.md`

## Seguridad en pruebas

- Se eliminó fallback de credenciales hardcodeadas en Cypress:
  - `frontend/cypress.config.ts`
  - `frontend/cypress.env.example.json`
  - `frontend/cypress/support/commands/auth.commands.ts`
- Se añadió middleware de headers de seguridad en backend:
  - `backend/app/main.py`
- Se reforzó el middleware de seguridad a nivel ASGI para asegurar propagación en toda respuesta HTTP (incluyendo errores/controladores internos):
  - `backend/app/main.py`
- Se añadió suite dedicada de seguridad (SQLi/XSS + headers):
  - `backend/tests/integration/test_security_api.py`

## Resiliencia avanzada

- Se implementó política de retry/backoff en cliente HTTP frontend para errores transitorios:
  - `frontend/src/api/http.ts`
- Se añadieron tests unitarios dedicados de retry/backoff:
  - `frontend/tests/unit/http.retry.unit.test.ts`
- Se formalizó suite dedicada de recuperación tras falla transitoria de dependencia:
  - `backend/tests/integration/test_dependency_recovery_api.py`
- Se formalizó suite dedicada de concurrencia en dominio de usuarios:
  - `backend/tests/integration/test_users_concurrency_api.py`

## Cobertura por dominio

- Se añadió dashboard automático de cobertura por módulo backend:
  - `backend/scripts/generate_module_coverage_dashboard.py`
  - `docs/TEST_COVERAGE_BY_MODULE_DASHBOARD.md`
- Se integró generación/publicación del dashboard en CI:
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/quality-gate-fullstack.yml`

## Gobernanza y release readiness

- Se formalizó criterio GO/NO-GO:
  - `docs/GO_NO_GO_RELEASE.md`
- Se formalizó trazabilidad requisito→test:
  - `docs/TEST_TRACEABILITY_MATRIX.md`
- Se formalizó estrategia fast/full full-stack:
  - `docs/TEST_EXECUTION_STRATEGY_FAST_FULL.md`
- Se materializó registro de decisiones de prompts IA:
  - `prompts/PROMPT_DECISIONS_LOG.md`
- Se formalizó control de breaking changes de contrato API:
  - `backend/tests/integration/test_api_contract_compatibility.py`
  - `backend/tests/data/openapi_contract_baseline.json`
  - `backend/scripts/generate_openapi_contract_baseline.py`
- Se formalizó versionado de datasets críticos y estrategia de datos por entorno:
  - `backend/tests/data/datasets_manifest.json`
  - `backend/tests/data/datasets/*.json`
  - `docs/TEST_DATA_ENVIRONMENT_STRATEGY.md`
  - `backend/scripts/validate_test_datasets.py`
- Se agregó smoke de equivalencia en staging para integraciones externas:
  - `.github/workflows/staging-equivalence-smoke.yml`
  - `backend/scripts/staging_equivalence_smoke.py`
  - `docs/STAGING_EQUIVALENCE_SMOKE.md`
  - `docs/EXTERNAL_INTEGRATIONS_TEST_MATRIX.md`

## 4) Resultados obtenidos

## Resultado global de checklist enterprise

- Estado actual: **89 ✅ / 0 ❌ / 1 ⚠️**
- Puntaje actual: **99%**
- Mejoras destacadas:
  - Contratos API y compatibilidad: **100%** (bloque 2)
  - Seguridad de aplicación: **100%** (bloque 3)
  - Datos de prueba y consistencia: **100%** (bloque 6)
  - Cobertura de integraciones externas: **sistemática** (bloque 11)
  - Observabilidad: **100%** (bloque 9)
  - Performance y escalabilidad: **100%** (bloque 4)
  - Gobernanza IA: **100%** (bloque 14)
  - Release readiness: **100%** (bloque 15)

## Resultado por capas 1–8

- Rúbrica ejecutiva consolidada: **100/100**
- Estado profesional alcanzado en arquitectura, unit backend, componentes frontend, e2e, cobertura, mantenibilidad, gobernanza IA y calidad final.

## Evidencia de ejecución reciente

- Ejecución de performance backend (incluyendo estrés):
  - `python -m pytest tests/performance -m performance --no-cov -q -s`
  - Resultado: **4 passed**
- Ejecución de compatibilidad de contrato API:
  - `python -m pytest tests/integration/test_api_contract_compatibility.py -q --no-cov`
  - Resultado: **2 passed**
- Validación de datasets versionados:
  - `python scripts/validate_test_datasets.py`
  - Resultado: **validado correctamente**
- Smoke de equivalencia staging:
  - `python scripts/staging_equivalence_smoke.py`
  - Resultado actualizado: **4/5 PASS, 1 gap detectado (security headers en staging)**
  - Diagnóstico: en ejecución local del backend los headers de seguridad sí están presentes; la brecha queda acotada a despliegue/proxy de staging.
- Ejecución de tests de retry/backoff frontend:
  - `npx vitest run tests/unit/http.retry.unit.test.ts`
  - Resultado: **3 passed**
- Ejecución de seguridad backend tras hardening ASGI:
  - `python -m pytest tests/integration/test_security_api.py -q --no-cov`
  - Resultado: **4 passed**
- Ejecución de suites dedicadas de resiliencia/concurrencia backend:
  - `python -m pytest tests/integration/test_dependency_recovery_api.py tests/integration/test_users_concurrency_api.py -q --no-cov`
  - Resultado: **3 passed**
- Generación de dashboard de cobertura por módulo:
  - `python scripts/generate_module_coverage_dashboard.py`
  - Resultado: **`docs/TEST_COVERAGE_BY_MODULE_DASHBOARD.md` generado**

## 5) Qué decir en la exposición (guion sugerido)

1. **Arranque (30s):**
   - “Partimos de una auditoría por capas + checklist enterprise para medir madurez real de testing.”

2. **Qué testea el sistema (1–2 min):**
   - Explicar pirámide: unit, integration, e2e, performance (backend) + unit/interaction/functional/e2e (frontend).

3. **Hallazgos iniciales (1 min):**
   - Observabilidad histórica, estrés real, runbooks operativos, trazabilidad centralizada y hardcoded fallback en Cypress.

4. **Correcciones aplicadas (1–2 min):**
   - Mostrar workflows/documentos creados y por qué reducen riesgo técnico.

5. **Resultados (1 min):**

- “Enterprise en 99% (89✅/0❌/1⚠️), capas 1–8 en 100/100, seguridad dedicada validada, contrato API protegido, resiliencia y concurrencia formalizadas, cobertura por módulo automatizada, datasets versionados, integraciones externas cubiertas y performance con stress validado.”

6. **Cierre (30s):**

- “La brecha restante es de despliegue (equivalencia CI/producción por propagación de security headers en staging).”

## 6) Próximos pasos recomendados

- P1: cerrar gap remanente detectado por smoke en staging (`security headers`).
- P2: tras redeploy, re-ejecutar smoke para cerrar 5/5 y actualizar evidencia.
- P3: mantener tablero de cobertura por módulo como control de regresión por dominio.
