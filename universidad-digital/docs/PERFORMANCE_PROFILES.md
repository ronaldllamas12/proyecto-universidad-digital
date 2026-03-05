# Perfiles de performance (fast vs full)

## Objetivo

Formalizar una estrategia dual de performance para CI:

- Perfil rápido en PR (latencia nominal sin estrés alto).
- Perfil completo en push/manual (incluye escenario de estrés sostenido).

## Workflow

- Archivo: `.github/workflows/performance-smoke.yml`.
- Nombre del workflow: `Performance Profiles`.

## Perfiles

### Fast profile (PR)

- Selector: `-m "performance and not stress"`
- Evidencia: `backend/performance-fast-report.txt`
- Uso: feedback rápido durante revisión de código.

### Full profile (push/manual)

- Selector: `-m performance`
- Incluye tests marcados con `@pytest.mark.stress`.
- Evidencia: `backend/performance-full-report.txt`
- Uso: detección de regresión bajo carga sostenida.

## Escenario de estrés implementado

- Test: `backend/tests/performance/test_api_latency_smoke.py::test_auth_me_sustained_high_stress_profile`
- Patrón: `20` olas × `20` requests (`n=400`) sobre `/auth/me`.
- Métricas: percentiles `p50`, `p95`, `p99`.

## Criterio

- Se considera apto si se cumplen umbrales de percentiles y no hay fallos HTTP en el perfil correspondiente.
