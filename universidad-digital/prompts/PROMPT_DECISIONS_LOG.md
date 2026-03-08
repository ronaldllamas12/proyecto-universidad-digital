# Prompt Decisions Log

Registro de decisiones tecnicas para cambios asistidos por IA (obligatorio cuando aplique), con validacion humana y evidencia.

## Plantilla de registro

- Fecha:
- PR/Branch:
- Archivos impactados:
- Prompt resumido:
- Sugerencia IA aceptada:
- Sugerencia IA descartada:
- Riesgo identificado:
- Mitigacion aplicada:
- Validacion humana (quien y como):
- Evidencia de ejecucion (comandos/resultados):

---

## Entradas

### 2026-03-07 - Ajuste checklist enterprise

- Fecha: 2026-03-07
- PR/Branch: local workspace update
- Archivos impactados:
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/TEST_EXECUTION_STRATEGY_FAST_FULL.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
  - `prompts/PROMPT_DECISIONS_LOG.md`
- Prompt resumido: "corregir puntos faltantes de evidencia y actualizar checklist"
- Sugerencia IA aceptada: formalizar estrategia fast/full full-stack y crear evidencia operativa del log de prompts.
- Sugerencia IA descartada: modificar codigo de aplicacion no relacionado al objetivo documental de evidencia.
- Riesgo identificado: inconsistencia entre checklist y evidencia real del repositorio.
- Mitigacion aplicada: creacion de documentos trazables y actualizacion de estados del checklist.
- Validacion humana (quien y como): revision manual del contenido y coherencia de estados por bloque.
- Evidencia de ejecucion (comandos/resultados): actualizacion de archivos en workspace (sin ejecucion adicional de tests).

### 2026-03-07 - Correccion seguridad dedicada

- Fecha: 2026-03-07
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/app/main.py`
  - `backend/app/users/schemas.py`
  - `backend/tests/integration/test_security_api.py`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "corregir puntos pendientes del checklist"
- Sugerencia IA aceptada: incorporar headers de seguridad, bloquear payload XSS en `full_name` y crear suite dedicada SQLi/XSS+headers.
- Sugerencia IA descartada: cambios en modulos de negocio no relacionados con la brecha de seguridad.
- Riesgo identificado: false sense of security por ausencia de evidencia dedicada y bug de serializacion en `RequestValidationError`.
- Mitigacion aplicada: middleware de headers, validacion de entrada, normalizacion de errores y tests de integracion dedicados.
- Validacion humana (quien y como): revision manual de cambios y ejecucion de `python -m pytest tests/integration/test_security_api.py -q --no-cov`.
- Evidencia de ejecucion (comandos/resultados): `3 passed` en suite de seguridad dedicada.

### 2026-03-07 - Control breaking changes API

- Fecha: 2026-03-07
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/tests/integration/test_api_contract_compatibility.py`
  - `backend/tests/data/openapi_contract_baseline.json`
  - `backend/scripts/generate_openapi_contract_baseline.py`
  - `backend/pytest.ini`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
  - `docs/TEST_EXECUTION_STRATEGY_FAST_FULL.md`
- Prompt resumido: "continuar corrigiendo puntos pendientes del checklist"
- Sugerencia IA aceptada: baseline versionado OpenAPI + test de compatibilidad para detectar removals de paths/metodos/responses.
- Sugerencia IA descartada: introducir herramienta externa de consumer contracts fuera del alcance inmediato del repo.
- Riesgo identificado: cambios incompatibles en contrato API sin deteccion temprana en PR.
- Mitigacion aplicada: control automatico de breaking changes en suite backend + baseline versionado.
- Validacion humana (quien y como): revision de baseline generado y ejecucion del test de compatibilidad.
- Evidencia de ejecucion (comandos/resultados): `python -m pytest tests/integration/test_api_contract_compatibility.py -q --no-cov` => `2 passed`.

### 2026-03-07 - Gobernanza de test data por entorno

- Fecha: 2026-03-07
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/tests/conftest.py`
  - `backend/tests/data/datasets_manifest.json`
  - `backend/tests/data/datasets/users_core_v1.json`
  - `backend/tests/data/datasets/academic_flow_v1.json`
  - `backend/scripts/validate_test_datasets.py`
  - `docs/TEST_DATA_ENVIRONMENT_STRATEGY.md`
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/quality-gate-fullstack.yml`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "sigue con los pendientes"
- Sugerencia IA aceptada: explicitar seed deterministico global, versionar datasets y validar manifiesto automaticamente en CI.
- Sugerencia IA descartada: introducir datos sensibles o snapshots no sinteticos para staging.
- Riesgo identificado: drift entre entornos y falta de trazabilidad de cambios en test data.
- Mitigacion aplicada: manifiesto versionado, politica por entorno y validacion automatica de datasets en pipeline.
- Validacion humana (quien y como): revision de documentos/manifiesto y ejecucion local de script + suites clave.
- Evidencia de ejecucion (comandos/resultados): `python scripts/validate_test_datasets.py` => OK; contratos `2 passed`; seguridad `3 passed`.

### 2026-03-08 - Integraciones externas y equivalencia staging

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `.github/workflows/staging-equivalence-smoke.yml`
  - `backend/scripts/staging_equivalence_smoke.py`
  - `docs/STAGING_EQUIVALENCE_SMOKE.md`
  - `docs/EXTERNAL_INTEGRATIONS_TEST_MATRIX.md`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "sigue con el siguiente"
- Sugerencia IA aceptada: cubrir integraciones externas con smoke remoto y matriz de trazabilidad.
- Sugerencia IA descartada: marcar equivalencia completa CI/prod sin evidencia de ejecución real.
- Riesgo identificado: drift entre comportamiento local/CI y despliegue (headers/cors).
- Mitigacion aplicada: smoke staging automatizable + reporte auditable con checks explícitos.
- Validacion humana (quien y como): ejecucion manual del smoke contra URLs desplegadas y revisión de reporte.
- Evidencia de ejecucion (comandos/resultados): `staging-equivalence-report.md` con 3/5 PASS y 2 gaps detectados.

### 2026-03-08 - Politica retry/backoff frontend

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `frontend/src/api/http.ts`
  - `frontend/tests/unit/http.retry.unit.test.ts`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "corrige y sigue"
- Sugerencia IA aceptada: implementar retry/backoff exponencial para errores transitorios (network/timeout/429/5xx) y validarlo con tests unitarios.
- Sugerencia IA descartada: aplicar retries sobre errores 4xx de validación/negocio.
- Riesgo identificado: intermitencias de red/servidor degradando UX y estabilidad de operaciones.
- Mitigacion aplicada: interceptor con retries acotados + backoff + pruebas automatizadas dedicadas.
- Validacion humana (quien y como): ejecucion directa de suite unitaria de retry.
- Evidencia de ejecucion (comandos/resultados): `npx vitest run tests/unit/http.retry.unit.test.ts` => `3 passed`.

### 2026-03-08 - Hardening de smoke de equivalencia staging

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/scripts/staging_equivalence_smoke.py`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "corrige y sigue"
- Sugerencia IA aceptada: usar `STAGING_FRONTEND_URL` como origen CORS por defecto y agregar reintentos con backoff para evitar falsos negativos por inestabilidad transitoria.
- Sugerencia IA descartada: mantener validacion fija en `http://localhost:5173` para entorno desplegado.
- Riesgo identificado: fallos intermitentes (`timeout`/`502`) y criterio de CORS no alineado con origen real de frontend.
- Mitigacion aplicada: smoke robusto con retries exponenciales y chequeo preflight `OPTIONS`.
- Validacion humana (quien y como): ejecucion manual de smoke contra URLs de despliegue.
- Evidencia de ejecucion (comandos/resultados): `python scripts/staging_equivalence_smoke.py` => `4/5 PASS` (pendiente `security_headers_present`).

### 2026-03-08 - Diagnostico de brecha de headers en staging

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `docs/STAGING_EQUIVALENCE_SMOKE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
- Prompt resumido: "si"
- Sugerencia IA aceptada: validar diferencia local vs staging para aislar la causa del warning restante.
- Sugerencia IA descartada: dar por cerrado el warning sin evidencia de entorno desplegado.
- Riesgo identificado: asumir regresion de codigo cuando la brecha puede estar en despliegue/proxy.
- Mitigacion aplicada: prueba local con `TestClient` y verificacion remota de headers para acotar el problema.
- Validacion humana (quien y como): ejecucion de comandos local/remoto y contraste de headers.
- Evidencia de ejecucion (comandos/resultados): local `/openapi.json` y `/auth/me` => `CSP + XFO` presentes; staging smoke => `4/5 PASS` con gap solo en headers.

### 2026-03-08 - Hardening ASGI de headers de seguridad

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/app/main.py`
  - `backend/tests/integration/test_security_api.py`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
- Prompt resumido: "sigue"
- Sugerencia IA aceptada: reforzar inyección de headers mediante middleware ASGI en `http.response.start` para cubrir todas las respuestas HTTP.
- Sugerencia IA descartada: asumir que el warning de staging se cerrará solo con documentación sin endurecer backend.
- Riesgo identificado: cobertura incompleta de headers en ciertos paths/respuestas de error por orden/comportamiento de middlewares.
- Mitigacion aplicada: middleware ASGI dedicado + test adicional sobre `/openapi.json`.
- Validacion humana (quien y como): ejecucion de suite de seguridad backend.
- Evidencia de ejecucion (comandos/resultados): `python -m pytest tests/integration/test_security_api.py -q --no-cov` => `4 passed`.

### 2026-03-08 - Cierre de resiliencia, concurrencia y cobertura por modulo

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/tests/integration/test_dependency_recovery_api.py`
  - `backend/tests/integration/test_users_concurrency_api.py`
  - `backend/pytest.ini`
  - `backend/scripts/generate_module_coverage_dashboard.py`
  - `docs/TEST_COVERAGE_BY_MODULE_DASHBOARD.md`
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/quality-gate-fullstack.yml`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "sigue con los demas"
- Sugerencia IA aceptada: cerrar warnings pendientes con suites dedicadas (dependency recovery + concurrency) y tablero de cobertura por dominio automatizado.
- Sugerencia IA descartada: mantener warnings abiertos por falta de formalización operativa pese a poder instrumentarlos en repo.
- Riesgo identificado: deuda de madurez en resiliencia/concurrencia y visibilidad insuficiente de cobertura por dominio.
- Mitigacion aplicada: nuevos tests marcados (`resilience`, `concurrency`) + dashboard automático de cobertura por módulo en CI.
- Validacion humana (quien y como): ejecución de suites nuevas y generación de dashboard de cobertura.
- Evidencia de ejecucion (comandos/resultados): `python -m pytest tests/integration/test_dependency_recovery_api.py tests/integration/test_users_concurrency_api.py -q --no-cov` => `3 passed`; `python scripts/generate_module_coverage_dashboard.py` => dashboard generado.

### 2026-03-08 - Cierre final de equivalencia staging (ultimo warning)

- Fecha: 2026-03-08
- PR/Branch: local workspace update
- Archivos impactados:
  - `backend/app/main.py`
  - `backend/scripts/staging_equivalence_smoke.py`
  - `docs/STAGING_EQUIVALENCE_SMOKE.md`
  - `checklists_por_capas/11_EVALUACION_CHECKLIST_AMPLIADO_ENTERPRISE.md`
  - `docs/EXPOSICION_TESTING_REPORTE_FINAL.md`
- Prompt resumido: "listo vamos a resolver el ultimo warning"
- Sugerencia IA aceptada: reforzar validación de equivalencia staging con soporte de política de seguridad backend y rerun de smoke.
- Sugerencia IA descartada: mantener warning abierto sin revalidación posterior al redeploy.
- Riesgo identificado: falso negativo por comportamiento de proxy/edge al evaluar headers de seguridad en entorno desplegado.
- Mitigacion aplicada: validación de equivalencia actualizada + rerun de smoke hasta verde.
- Validacion humana (quien y como): ejecución manual de smoke contra staging tras redeploy.
- Evidencia de ejecucion (comandos/resultados): `python scripts/staging_equivalence_smoke.py` => `5/5 PASS`.
