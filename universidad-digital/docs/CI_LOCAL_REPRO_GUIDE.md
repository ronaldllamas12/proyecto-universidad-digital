# Guía de reproducción CI → local

## Objetivo

Estandarizar la reproducción local de fallas observadas en CI para reducir tiempo de diagnóstico y evitar divergencias de entorno.

## Equivalencia de workflows a comandos locales

### Backend CI (`.github/workflows/backend-ci.yml`)

1. `cd backend`
2. `python -m pip install --upgrade pip`
3. `pip install -r requirements.txt`
4. `pip install ruff`
5. `ruff check app tests`
6. `python -m pytest -q`

### Frontend CI (`.github/workflows/frontend-ci.yml`)

1. `cd frontend`
2. `npm ci`
3. `npx vitest run --coverage`

### Stability SLO (`.github/workflows/test-stability-slo.yml`)

Backend:

1. `cd backend`
2. Ejecutar 3 veces: `python -m pytest -q`

Frontend:

1. `cd frontend`
2. Ejecutar 3 veces: `npx vitest run --coverage`

Cálculo manual de flake rate:

- Fórmula: `failed_runs / total_runs * 100`
- SLO objetivo: `<= 2%`

### Observability Metrics (`.github/workflows/test-observability-metrics.yml`)

1. `cd backend && python -m pytest -q --durations=20`
2. `cd frontend && npx vitest run --coverage`
3. Verificar cobertura por dominio:
   - Backend: `backend/coverage.xml`
   - Frontend: `frontend/coverage/lcov.info`

## Checklist de diagnóstico rápido

1. Confirmar versión de Python/Node usadas en CI.
2. Reinstalar dependencias limpias (`pip install -r ...`, `npm ci`).
3. Ejecutar el comando exacto del workflow fallido.
4. Capturar salida completa y comparar con artefactos de CI.
5. Si hay flakiness, repetir al menos 3 veces y reportar tasa.

## Evidencia esperada en PR de corrección

- Comando reproducido localmente.
- Resultado antes/después.
- Referencia al workflow/artefacto afectado.
- Impacto en gates (`coverage`, `stability`, `observability`).
