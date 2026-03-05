# Dashboard histórico de observabilidad de tests

## Objetivo

Consolidar tendencias históricas de calidad de pruebas en un único reporte auditable por ejecución de CI.

## Fuente automática

- Workflow: `.github/workflows/test-observability-metrics.yml`
- Frecuencia: semanal (`cron`) y bajo demanda (`workflow_dispatch`).

## Artefactos generados

- `observability-report.md`
  - Duración por suite (backend/frontend/total).
  - Cobertura por dominio backend (`app/*`) y frontend (`src/components/*`).
- `observability-metrics.json`
  - Snapshot estructurado por ejecución para análisis posterior.
- `observability-dashboard.md`
  - Tablero histórico consolidado (últimas 15 ejecuciones por workflow crítico).
- `observability-trends.json`
  - Resumen machine-readable de tendencias (success rate y duración promedio).

## Workflows incluidos en el histórico

1. `test-observability-metrics.yml`
2. `test-stability-slo.yml`
3. `performance-smoke.yml`

## KPI de seguimiento sugeridos

- Tasa de éxito por workflow (objetivo: >= 98%).
- Duración promedio por workflow (objetivo: estable o descendente).
- Cobertura por dominio sin regresiones sostenidas.

## Uso operativo

1. En incidentes de calidad, revisar primero `observability-dashboard.md`.
2. Correlacionar con `CI_LOCAL_REPRO_GUIDE.md` para réplica local exacta.
3. En PR de remediación, adjuntar referencia a artefactos del run afectado.
