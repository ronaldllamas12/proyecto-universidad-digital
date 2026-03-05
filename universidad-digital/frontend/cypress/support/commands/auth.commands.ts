// ===========================================================================
// Comandos personalizados — Autenticación
// ===========================================================================

import { API } from "../helpers/constants";
import {
  buildMeResponse,
  buildAdminMetrics,
  interceptSequence,
  interceptNetworkError,
} from "../helpers/interceptors";

/**
 * Resetea el estado del navegador: cookies, localStorage, sessionStorage.
 */
Cypress.Commands.add("resetBrowserState", () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => win.sessionStorage.clear());
});

/**
 * Configura interceptores mock para toda la capa de autenticación.
 *
 * Soporta:
 * - respuestas estáticas
 * - secuencias de respuestas (ej. 401 → 200)
 * - delays
 * - errores de red
 * - roles configurables
 */
Cypress.Commands.add("mockAuthApi", (options: MockAuthApiOptions = {}) => {
  const {
    roles = ["Administrador"],
    loginStatus = 200,
    loginNetworkError = false,
    loginDelay = 0,
    meStatus = 200,
    initialMeUnauthorized = true,
    loginSequence,
    meSequence,
  } = options;

  const meBody = buildMeResponse({ roles });
  const loginBody = {
    access_token: "fake-jwt-token-e2e",
    token_type: "bearer",
  };

  // Flag compartido: GET /auth/me devolverá 401 hasta que POST /auth/login
  // responda con éxito. Esto es robusto ante React StrictMode (que ejecuta
  // los effects dos veces en dev) y evita que la secuencia se consuma
  // prematuramente.
  let loginHasSucceeded = false;

  // --- POST /auth/login ---
  if (loginNetworkError) {
    interceptNetworkError("POST", API.AUTH_LOGIN, "loginRequest");
  } else if (loginSequence) {
    const responses = loginSequence.map((status) => ({
      statusCode: status,
      body: status < 400 ? loginBody : { detail: "Credenciales inválidas" },
    }));
    interceptSequence("POST", API.AUTH_LOGIN, responses, "loginRequest");
  } else {
    cy.intercept("POST", `**${API.AUTH_LOGIN}`, (req) => {
      if (loginStatus < 400) {
        loginHasSucceeded = true;
      }
      req.reply({
        statusCode: loginStatus,
        body:
          loginStatus < 400 ? loginBody : { detail: "Credenciales inválidas" },
        headers: { "content-type": "application/json" },
        delay: loginDelay,
      });
    }).as("loginRequest");
  }

  // --- GET /auth/me ---
  if (meSequence) {
    const responses = meSequence.map((status) => ({
      statusCode: status,
      body: status < 400 ? meBody : { detail: "No autenticado" },
    }));
    interceptSequence("GET", API.AUTH_ME, responses, "meRequest");
  } else if (initialMeUnauthorized) {
    // Antes de login exitoso → 401; después → meStatus (por defecto 200)
    cy.intercept("GET", `**${API.AUTH_ME}`, (req) => {
      if (!loginHasSucceeded) {
        req.reply({
          statusCode: 401,
          body: { detail: "No autenticado" },
          headers: { "content-type": "application/json" },
        });
      } else {
        req.reply({
          statusCode: meStatus,
          body: meStatus < 400 ? meBody : { detail: "No autenticado" },
          headers: { "content-type": "application/json" },
        });
      }
    }).as("meRequest");
  } else {
    cy.intercept("GET", `**${API.AUTH_ME}`, {
      statusCode: meStatus,
      body: meStatus < 400 ? meBody : { detail: "No autenticado" },
      headers: { "content-type": "application/json" },
    }).as("meRequest");
  }

  // --- POST /auth/logout ---
  cy.intercept("POST", `**${API.AUTH_LOGOUT}`, {
    statusCode: 200,
    body: { message: "Logged out" },
    headers: { "content-type": "application/json" },
  }).as("logoutRequest");

  // --- GET /dashboard/admin ---
  cy.intercept("GET", `**${API.DASHBOARD_ADMIN}`, {
    statusCode: 200,
    body: buildAdminMetrics(),
    headers: { "content-type": "application/json" },
  }).as("dashboardMetrics");
});

/**
 * Inicia sesión como administrador mediante cy.session.
 * Reutiliza la sesión entre tests del mismo bloque.
 */
Cypress.Commands.add("loginAsAdminSession", () => {
  const adminEmail = Cypress.env("adminEmail") as string | undefined;
  const adminPassword = Cypress.env("adminPassword") as string | undefined;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Cypress env vars 'adminEmail' and 'adminPassword' are required for loginAsAdminSession.",
    );
  }

  cy.session(
    "admin-session",
    () => {
      cy.mockAuthApi({ initialMeUnauthorized: true });
      cy.visit("/login");
      cy.wait("@meRequest"); // Esperar ciclo inicial AuthContext
      cy.get('input[type="email"]')
        .should("be.visible")
        .and("not.be.disabled")
        .clear();
      cy.get('input[type="email"]').type(adminEmail);
      cy.get('input[type="password"]')
        .should("be.visible")
        .and("not.be.disabled")
        .clear();
      cy.get('input[type="password"]').type(adminPassword);
      cy.contains("button", "Iniciar sesión").click();
      cy.wait("@loginRequest");
      cy.url().should("not.include", "/login");
    },
    {
      validate() {
        cy.window().its("document.cookie").should("exist");
      },
    },
  );

  // Restaurar interceptores después de cy.session
  cy.mockAuthApi({ initialMeUnauthorized: false });
});
