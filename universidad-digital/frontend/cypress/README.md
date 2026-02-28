# Cypress E2E Suite - Universidad Digital

## Estructura

- `cypress/e2e/auth`: escenarios de autenticación.
- `cypress/e2e/navigation`: protección de rutas y navegación.
- `cypress/e2e/tasks`: flujo completo de tareas + resiliencia.
- `cypress/fixtures`: datos reutilizables.
- `cypress/support/commands.ts`: comandos personalizados.
- `cypress/support/pageObjects`: objetos de página.
- `cypress/support/helpers`: aserciones reutilizables de API.

## Configuración

- `cypress.config.ts` define `baseUrl`, `env`, `timeouts`, `retries`, y `specPattern`.
- `baseUrl` configurable por `CYPRESS_BASE_URL`.
- API configurable por `CYPRESS_API_URL` o `cypress.env.json`.
- Credenciales por entorno: `adminEmail`, `adminPassword`.

## Ejecución

1. Instalar dependencias:
   - `npm install`
2. Iniciar frontend:
   - `npm run dev`
3. Ejecutar suite E2E:
   - Headless: `npm run cy:run`
   - Interactivo: `npm run cy:open`

## Cobertura de escenarios

- Autenticación: login correcto, inválido, vacío, token expirado, backend caído.
- Navegación: acceso autorizado y bloqueo sin autenticación.
- Tareas: creación válida, validación inválida, error 500, latencia, pérdida de conexión, respuesta parcial.
- Validaciones: UI + API + consistencia de datos renderizados y persistencia tras refresh.

## Notas técnicas

- Sin `cy.wait(5000)`; solo waits por alias/intercept.
- `cy.session` disponible para acelerar autenticación reutilizable.
- Limpieza de estado entre pruebas con `resetBrowserState`.
