# Estrategia de ejecucion de pruebas Fast/Full (Full-Stack)

## Objetivo

Formalizar una estrategia unica y auditable de ejecucion de pruebas para todo el stack (backend, frontend, e2e, performance y estabilidad), diferenciando perfiles rapidos para feedback en PR y perfiles completos para validacion de integracion/release.

## Perfiles

## Perfil Fast (PR)

En pull request se prioriza feedback rapido con gates de calidad obligatorios:

1. Backend quality: lint + tests con coverage gate.
2. Frontend quality: tests con coverage gate.
3. Maintainability: complejidad y duplicacion de tests.
4. Performance fast: pruebas de performance sin stress.
5. Contract compatibility: control de breaking changes contra baseline OpenAPI.

Workflows base:

- `.github/workflows/backend-ci.yml`
- `.github/workflows/frontend-ci.yml`
- `.github/workflows/quality-gate-fullstack.yml`
- `.github/workflows/performance-smoke.yml` (ramal fast para PR)

## Perfil Full (Push a main / release / manual)

En push a rama principal y/o ejecucion manual se ejecuta validacion amplia:

1. Backend + Frontend + Maintainability (quality gate full-stack).
2. Performance full (incluye stress cuando aplique por marker `performance`).
3. Estabilidad SLO (repeticiones para flaky rate).
4. Observabilidad y consolidacion historica de tendencias.
5. Contract compatibility + verificacion de baseline OpenAPI versionado.

Workflows base:

- `.github/workflows/quality-gate-fullstack.yml`
- `.github/workflows/performance-smoke.yml` (ramal full en push/manual)
- `.github/workflows/test-stability-slo.yml`
- `.github/workflows/test-observability-metrics.yml`

## Matriz de activacion

| Contexto                | Perfil        | Criterio de aprobacion                    |
| ----------------------- | ------------- | ----------------------------------------- |
| Pull Request            | Fast          | Todos los jobs de calidad en verde        |
| Push a main             | Full          | Quality gate + performance full en verde  |
| Release candidate       | Full          | Evidence GO/NO-GO + SLO estabilidad <= 2% |
| Investigacion incidente | Full (manual) | Artefactos observables y reproducibles    |

## Artefactos esperados

- `observability-report.md`
- `observability-metrics.json`
- `observability-dashboard.md`
- `observability-trends.json`
- `stability-report.md`
- `performance-fast-report.txt` o `performance-full-report.txt`
- `backend/tests/data/openapi_contract_baseline.json`

## Regla operativa

Si un gate Fast falla en PR, no se mergea. Si un gate Full falla en main/release, la salida queda en NO-GO hasta remediacion.
