# Capa 4 — Pruebas End-to-End (Cypress)

## Flujo real

- [✅] Existe flujo completo login → operación → confirmación
  - Evidencia: `frontend/cypress/e2e/auth/login-success.cy.ts` y `tasks/task-crud.cy.ts`.
- [✅] Se valida persistencia de datos
  - Evidencia: recarga/verificación y flujo integración real (`task-integration.cy.ts`).
- [✅] Se valida comunicación con API
  - Evidencia: `cy.intercept(...)` + `cy.wait(@alias)`.
- [✅] Se validan errores del backend
  - Evidencia: escenarios de fallos y mensajes de conectividad/resiliencia.
- [✅] Se validan permisos de acceso
  - Evidencia: `navigation/route-protection.cy.ts`.

## Calidad técnica

- [✅] No se usan waits fijos
  - Evidencia: búsqueda sin `cy.wait(<ms>)` en `frontend/cypress/e2e/**`.
- [✅] Se usan intercepts
  - Evidencia: uso extendido en auth/tasks/navigation.
- [✅] Se validan status codes
  - Evidencia: `200`, `201`, `204`, `401` en múltiples specs.
- [✅] Se validan respuestas JSON
  - Evidencia: validación de payload y `content-type`.
- [✅] Se valida UI + API
  - Evidencia: assertions sobre DOM y contrato HTTP en el mismo flujo.

## Realismo

- [✅] Detecta fallos reales
  - Evidencia: suite de resiliencia y rutas protegidas.
- [✅] No solo verifica textos visibles
  - Evidencia: valida request/response body y headers.
- [✅] Puede fallar si backend cambia
  - Evidencia: `task-integration.cy.ts` con API real opcional.

## Ampliación (e2e)

- [✅] Limpieza de sesión entre tests
  - Evidencia: `frontend/cypress/support/e2e.ts` limpia cookies/storage.
- [✅] Timeouts/retries definidos explícitamente
  - Evidencia: `cypress.config.ts` (`retries`, `defaultCommandTimeout`, etc.).

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **15 ✅ / 0 ❌ / 0 ⚠️**
