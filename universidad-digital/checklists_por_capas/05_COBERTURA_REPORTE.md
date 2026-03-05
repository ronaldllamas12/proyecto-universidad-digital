# Reporte consolidado — Capa 5 (Cobertura)

Fecha de ejecución: 2026-03-04

## Backend

- Fuente: `backend/coverage.xml`
- Evidencia: `line-rate="0.9003"`
- Cobertura backend: **90.03%**
- Gate activo: `--cov-fail-under=90` en `backend/pytest.ini`

## Frontend

- Comando: `npx vitest run --coverage`
- Resultado: **100%** (statements/branches/functions/lines) para los componentes incluidos en cobertura.
- Artefactos: `frontend/coverage/index.html` y `frontend/coverage/lcov.info`
- Gate activo: umbrales en `frontend/vitest.config.ts`
  - lines: 85
  - branches: 75
  - functions: 80
  - statements: 85

## Consolidado full-stack

- Cobertura global (promedio backend+frontend): **95.02%**
  - Cálculo: (90.03 + 100.00) / 2

## CI

- Backend: `.github/workflows/backend-ci.yml`
- Frontend: `.github/workflows/frontend-ci.yml`
- Ambos pipelines ejecutan tests con gate de cobertura.
