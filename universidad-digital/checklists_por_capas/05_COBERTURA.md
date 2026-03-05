# Capa 5 — Cobertura

## Métrica

- [✅] Cobertura global ≥ 90%
  - Evidencia: consolidado full-stack **95.02%** en `checklists_por_capas/05_COBERTURA_REPORTE.md`.
- [✅] Cobertura backend ≥ 90%
  - Evidencia: `backend/coverage.xml` con `line-rate="0.9003"` (**90.03%**).
- [✅] Cobertura frontend ≥ 85%
  - Evidencia: `npx vitest run --coverage` reporta **100%** y artefactos en `frontend/coverage/`.
- [✅] Existe gate mínimo de cobertura en backend
  - Evidencia: `--cov-fail-under=90` en `backend/pytest.ini`.

## Calidad de cobertura

- [✅] La cobertura corresponde a lógica real
  - Evidencia: tests de servicios, auth, permisos, integración de dominio.
- [✅] No se infló cobertura con tests triviales
  - Evidencia: sin `assert True` ni pruebas vacías detectadas.
- [✅] Las rutas críticas están cubiertas
  - Evidencia: autenticación, usuarios, materias, periodos, matrículas, calificaciones, dashboard (principalmente integración).
- [✅] Excepciones están cubiertas de forma homogénea en todas las capas
  - Evidencia: pruebas unitarias/integración por dominios backend + frontend unit/interaction/functional y E2E con escenarios de error.

## Ampliación (cobertura)

- [✅] Umbral unificado backend+frontend en CI
  - Evidencia: workflows `.github/workflows/backend-ci.yml` y `.github/workflows/frontend-ci.yml` con gate de cobertura.
- [✅] Cobertura por módulo/riesgo publicada como reporte consolidado
  - Evidencia: `checklists_por_capas/05_COBERTURA_REPORTE.md`.

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **10 ✅ / 0 ❌ / 0 ⚠️**
