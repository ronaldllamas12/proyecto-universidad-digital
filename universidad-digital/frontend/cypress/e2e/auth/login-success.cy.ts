// ===========================================================================
// E2E — Login exitoso
// Valida: flujo completo de autenticación, contrato de API, redirect
// ===========================================================================

import { LoginPage } from "../../support/page-objects/LoginPage";
import { DashboardPage } from "../../support/page-objects/DashboardPage";

const loginPage = new LoginPage();
const dashboardPage = new DashboardPage();

describe("Autenticación — Login exitoso", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: true });
  });

  it("completa el flujo login → dashboard con validación de contrato API", () => {
    cy.fixture("users").then((users) => {
      loginPage.visit();

      // Esperar a que el AuthContext termine su ciclo inicial (GET /auth/me → 401)
      // para que React no haga re-render mientras Cypress escribe en el formulario
      cy.wait("@meRequest");

      loginPage.fillAndSubmit(users.admin.email, users.admin.password);

      // Validar contrato del endpoint POST /auth/login
      cy.wait("@loginRequest").then((interception) => {
        // Request: payload correcto
        expect(interception.request.body).to.have.property(
          "email",
          users.admin.email,
        );
        expect(interception.request.body).to.have.property(
          "password",
          users.admin.password,
        );

        // Response: status 200 + estructura correcta
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.response?.body).to.have.property("access_token");
        expect(interception.response?.body).to.have.property(
          "token_type",
          "bearer",
        );

        const ct = interception.response?.headers?.["content-type"] ?? "";
        expect(ct).to.include("application/json");
      });

      // Validar redirect y renderización del dashboard
      // (el rendado del greeting "Admin QA" implícitamente valida que
      //  GET /auth/me post-login devolvió el usuario correcto con rol Admin)
      loginPage.assertRedirectedAway();
      cy.url().should("include", "/admin");
      dashboardPage.assertTitle("Panel Administrador");
      dashboardPage.assertGreeting("Admin QA");
    });
  });

  it("redirige al home si ya está autenticado", () => {
    // Simular sesión activa: me retorna 200 desde el inicio
    cy.mockAuthApi({ initialMeUnauthorized: false });
    loginPage.visit();

    // El AuthContext detecta que ya hay sesión y redirige
    cy.url().should("not.include", "/login");
  });
});
