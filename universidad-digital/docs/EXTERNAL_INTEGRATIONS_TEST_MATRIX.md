# Matriz de pruebas de integraciones externas criticas

## Alcance

Esta matriz documenta integraciones externas relevantes y su cobertura sistematica en testing.

| Integracion externa                 | Riesgo principal                               | Cobertura actual                                | Evidencia                                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API desplegada en staging (Render)  | Drift contrato / endpoints caidos              | Contrato OpenAPI + smoke remoto                 | `backend/tests/integration/test_api_contract_compatibility.py`, `backend/tests/data/openapi_contract_baseline.json`, `.github/workflows/staging-equivalence-smoke.yml` |
| Frontend desplegado (Vercel/Render) | UI no disponible / mala configuracion base URL | Smoke de disponibilidad HTML                    | `.github/workflows/staging-equivalence-smoke.yml`, `docs/STAGING_EQUIVALENCE_SMOKE.md`                                                                                 |
| CORS y cookies cross-origin         | Bloqueo de auth/rutas protegidas               | Check de headers en staging y seguridad backend | `backend/scripts/staging_equivalence_smoke.py`, `backend/tests/integration/test_security_api.py`                                                                       |
| Dependencia de base de datos        | Fallo de autenticacion/CRUD por conectividad   | Integracion backend + smoke funcional           | `backend/tests/integration/**`, `docs/GO_NO_GO_RELEASE.md`                                                                                                             |

## Nota

La matriz se considera vigente si los workflows asociados ejecutan en verde y los artefactos estan disponibles para auditoria.
