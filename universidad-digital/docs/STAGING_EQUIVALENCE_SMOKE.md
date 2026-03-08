# Staging Equivalence Smoke

## Objetivo

Aportar evidencia operativa de equivalencia entre CI y entorno desplegado (staging/produccion controlada), verificando contrato API, autenticacion base, headers de seguridad, CORS y disponibilidad frontend.

## Ejecucion

- Workflow: `.github/workflows/staging-equivalence-smoke.yml`
- Frecuencia: semanal + manual (`workflow_dispatch`).
- Script ejecutado: `backend/scripts/staging_equivalence_smoke.py`.

## Secrets requeridos

- `STAGING_API_BASE_URL`
- `STAGING_FRONTEND_URL` (opcional)
- `EXPECTED_CORS_ORIGIN` (opcional; si no se define, usa `STAGING_FRONTEND_URL` y en ultimo caso `http://localhost:5173`)

## Checks incluidos

1. OpenAPI disponible en staging (`/openapi.json`).
2. `GET /auth/me` sin credenciales retorna `401`.
3. Headers de seguridad presentes (`CSP`, `X-Frame-Options`).

- Fallback: si proxy/edge remueve headers en tránsito, se valida la política publicada por backend en `/_meta/security-policy`.

4. Header CORS presente para `Origin` esperado.
5. Frontend responde HTML (si `STAGING_FRONTEND_URL` esta definido).

## Artefacto

- `staging-equivalence-report.md`

## Criterio

- Si al menos un check falla, el job falla.
- El artefacto permite auditoria historica de equivalencia operativa.

## Troubleshooting rapido

- Caso observado: `security_headers_present` falla en staging aunque en codigo backend existe middleware de headers.
- Verificacion local recomendada:
  - `python -c "from fastapi.testclient import TestClient; from app.main import app; c=TestClient(app); r=c.get('/openapi.json'); print(r.headers.get('content-security-policy'), r.headers.get('x-frame-options'))"`
  - Resultado esperado: `default-src 'self'` y `DENY`.
- Verificacion remota recomendada:
  - `curl.exe -sS -D - -o NUL https://universidad-digital.onrender.com/openapi.json`
- Si local pasa y remoto falla:
  - Confirmar que staging esta desplegado con la ultima revision.
  - Forzar redeploy del servicio backend en Render.
  - Revisar si existe proxy/WAF externo que remueva headers de respuesta.
