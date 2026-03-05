# Exposición — Reporte final de testing

Fecha: 2026-03-04  
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

## Gobernanza y release readiness

- Se formalizó criterio GO/NO-GO:
  - `docs/GO_NO_GO_RELEASE.md`
- Se formalizó trazabilidad requisito→test:
  - `docs/TEST_TRACEABILITY_MATRIX.md`

## 4) Resultados obtenidos

## Resultado global de checklist enterprise

- Estado actual: **73 ✅ / 0 ❌ / 17 ⚠️**
- Puntaje actual: **81%**
- Mejoras destacadas:
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
   - “Enterprise en 81% (73✅/0❌/17⚠️), capas 1–8 en 100/100, performance con stress validado.”

6. **Cierre (30s):**
   - “Las brechas restantes son de madurez avanzada (integraciones externas, complejidad automática y fast/full full-stack).”

## 6) Próximos pasos recomendados

- P1: reforzar cobertura sistemática de integraciones externas críticas.
- P1: formalizar estrategia fast/full para todo el stack (más allá de performance backend).
- P2: incorporar métrica automática de complejidad en tests largos.
