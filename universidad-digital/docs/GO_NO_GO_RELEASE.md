# GO/NO-GO Release Readiness

## Objetivo

Definir un criterio operativo y auditable para decidir liberación a producción con base en calidad de pruebas, riesgo y capacidad de recuperación.

## Decisión de salida

La release es `GO` solo si **todos** los criterios obligatorios cumplen.

### Criterios obligatorios (GO)

1. CI full-stack en verde:
   - `.github/workflows/quality-gate-fullstack.yml`
   - `.github/workflows/performance-smoke.yml`
   - `.github/workflows/test-stability-slo.yml`
2. Cobertura mínima vigente:
   - Backend `>= 90%` (gate en `backend/pytest.ini`).
   - Frontend umbrales activos en `frontend/vitest.config.ts`.
3. Defectos bloqueantes abiertos: `0`.
4. Riesgos críticos identificados con mitigación explícita y dueño.
5. Smoke post-deploy completado sin fallos críticos.
6. Plan de rollback validado y observabilidad mínima activa.

Si **uno** falla, la release queda en `NO-GO`.

## Registro de defectos bloqueantes

- Fuente: issue tracker o tablero de defects.
- Criterio: cualquier bug Sev1/Sev2 sin mitigación aprobada bloquea salida.
- Evidencia mínima en release ticket:
  - Conteo de blockers en corte.
  - Enlace a defectos y estado.

## Registro de riesgos y mitigación

| Riesgo                   | Severidad  | Mitigación                                                 | Dueño        | Estado          |
| ------------------------ | ---------- | ---------------------------------------------------------- | ------------ | --------------- |
| Regresión en auth/rbac   | Alta       | Re-ejecutar suites auth/navigation + smoke manual de login | QA Lead      | Abierto/Cerrado |
| Regresión de rendimiento | Media/Alta | Ejecutar `performance-smoke` y validar umbrales p95/p99    | Backend Lead | Abierto/Cerrado |
| Inestabilidad de tests   | Media      | Verificar `test-stability-slo` <= 2%                       | QA Lead      | Abierto/Cerrado |

## Smoke post-deploy (obligatorio)

1. Login admin correcto.
2. Acceso a rutas protegidas por rol (admin/docente/estudiante).
3. CRUD mínimo de una entidad crítica (ej. tareas o usuarios).
4. Dashboard carga sin errores.
5. Logout y expiración de sesión funcional.

### Comandos sugeridos

- Backend smoke: `python -m pytest backend/tests/integration/test_auth_api.py -q`
- Frontend smoke: `npx vitest run frontend/tests/functional/TasksPage.functional.test.tsx`
- E2E smoke: `npm run cy:run -- --spec cypress/e2e/auth/login-success.cy.ts`

## Plan de rollback

### Triggers de rollback

- Error crítico en login/autorización.
- Degradación severa de performance fuera de umbral acordado.
- Fallo de smoke post-deploy sin workaround seguro.

### Pasos de rollback

1. Revertir despliegue a versión estable previa.
2. Verificar salud mínima (auth + dashboard + ruta crítica).
3. Comunicar incidente y estado a stakeholders.
4. Abrir análisis RCA y plan de corrección.

## Observabilidad mínima para GO

- Error rate 5xx bajo umbral operativo.
- Latencia p95/p99 dentro de umbral de `performance-smoke`.
- Logs de errores críticos disponibles y trazables.
- Evidencia de último `stability-report.md` con SLO <= 2%.

## Evidencia mínima de aprobación

Adjuntar en release ticket:

- Capturas o links de workflows en verde.
- Resultado de smoke post-deploy.
- Estado de blockers (0).
- Riesgos y mitigaciones.
- Confirmación de rollback plan disponible.
