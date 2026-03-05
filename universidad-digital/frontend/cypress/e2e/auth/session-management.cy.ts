// ===========================================================================
// E2E — Gestión de sesiones y tokens
// Valida: token expirado, logout, sesión inválida en navegación
// ===========================================================================

import { LoginPage } from "../../support/page-objects/LoginPage";
import { ROUTES } from "../../support/helpers/constants";

const loginPage = new LoginPage();

describe("Autenticación — Gestión de sesiones", () => {
  it("redirige al login cuando el token expira durante navegación", () => {
    cy.mockAuthApi({ initialMeUnauthorized: true });

    loginPage.visit();
    cy.wait("@meRequest"); // Esperar ciclo inicial AuthContext

    cy.fixture("users").then((users) => {
      loginPage.fillAndSubmit(users.admin.email, users.admin.password);
      cy.wait("@loginRequest");

      // Llega al dashboard
      cy.url().should("include", "/admin");

      // Simular expiración de token: sobreescribir interceptor de /auth/me
      cy.intercept("GET", "**/auth/me", {
        statusCode: 401,
        body: { detail: "No autenticado" },
        headers: { "content-type": "application/json" },
      }).as("meRequest");

      // Navegar a otra ruta provoca un nuevo GET /auth/me → 401
      cy.visit(ROUTES.ADMIN_TASKS);

      // El handler de 401 ejecuta logout automático
      cy.url().should("include", "/login");
    });
  });

  it("ejecuta logout correctamente desde el sidebar", () => {
    cy.mockAuthApi({ initialMeUnauthorized: true });

    loginPage.visit();
    cy.wait("@meRequest"); // Esperar ciclo inicial AuthContext
    cy.fixture("users").then((users) => {
      loginPage.fillAndSubmit(users.admin.email, users.admin.password);
      cy.wait("@loginRequest");
      cy.url().should("include", "/admin");

      // Hacer logout — el botón puede estar oculto en sidebar colapsado
      cy.get('button[aria-label="Cerrar sesión"]').click({ force: true });
      cy.wait("@logoutRequest").then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });

      // Debe redirigir al login
      cy.url().should("include", "/login");
    });
  });

  it("mantiene la sesión al recargar la página", () => {
    // me retorna 200 desde el inicio (sesión activa persistente)
    cy.mockAuthApi({ initialMeUnauthorized: false });

    cy.visit(ROUTES.ADMIN_DASHBOARD);

    // Verificar que estamos autenticados
    cy.contains("Panel Administrador").should("be.visible");

    // Recargar
    cy.reload();

    // Sigue autenticado
    cy.contains("Panel Administrador").should("be.visible");
    cy.url().should("include", "/admin");
  });
});
