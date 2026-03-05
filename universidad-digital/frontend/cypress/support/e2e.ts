// ===========================================================================
// Cypress E2E Support — Universidad Digital
// Carga comandos personalizados, configura hooks globales e interceptores
// ===========================================================================

import "./commands/auth.commands";
import "./commands/task.commands";
import "./commands/common.commands";

// ---------------------------------------------------------------------------
// Limpieza de estado entre pruebas
// ---------------------------------------------------------------------------
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

// ---------------------------------------------------------------------------
// Supresión controlada de errores de la aplicación que no son defectos
// del suite (ej. errores de red simulados intencionalmente)
// ---------------------------------------------------------------------------
Cypress.on("uncaught:exception", (_err, _runnable) => {
  // Evita que errores no capturados por la SPA rompan el test runner.
  // Cada test valida individualmente los errores que espera.
  return false;
});
