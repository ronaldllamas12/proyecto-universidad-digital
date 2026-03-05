// ===========================================================================
// E2E — Login con fallos
// Valida: credenciales inválidas, vacías, password corta, backend caído
// ===========================================================================

import { LoginPage } from "../../support/page-objects/LoginPage";

const loginPage = new LoginPage();

describe("Autenticación — Login con fallos", () => {
  beforeEach(() => {
    // Configurar mocks por defecto; tests individuales pueden sobreescribir
    cy.mockAuthApi({ initialMeUnauthorized: true });
    loginPage.visit();
    cy.wait("@meRequest"); // Esperar ciclo inicial AuthContext (401)
  });

  it("muestra error con credenciales inválidas (401)", () => {
    // Sobreescribir solo el interceptor de login para devolver 401
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: { detail: "Credenciales inválidas" },
      headers: { "content-type": "application/json" },
    }).as("loginRequest");

    cy.fixture("users").then((users) => {
      loginPage.fillAndSubmit(users.invalid.email, users.invalid.password);

      cy.wait("@loginRequest").then((interception) => {
        expect(interception.response?.statusCode).to.eq(401);
        expect(interception.response?.body).to.have.property("detail");
      });

      loginPage.assertErrorVisible("Credenciales inválidas");
      loginPage.assertStillOnLogin();
    });
  });

  it("no envía request con campos vacíos — validación frontend", () => {
    // Intentar submit sin llenar nada
    loginPage.submit();

    // Validación zod impide el envío: no debe haber request HTTP
    cy.get("@loginRequest.all").should("have.length", 0);

    // Deben aparecer mensajes de validación del formulario
    loginPage.assertValidationError("Ingresa un email válido");
    loginPage.assertStillOnLogin();
  });

  it("muestra error de validación con password menor a 8 caracteres", () => {
    cy.fixture("users").then((users) => {
      loginPage.fillEmail(users.shortPassword.email);
      loginPage.fillPassword(users.shortPassword.password);
      loginPage.submit();

      // Validación zod: password < 8 chars
      cy.get("@loginRequest.all").should("have.length", 0);
      loginPage.assertValidationError("al menos 8 caracteres");
    });
  });

  it("muestra error de conexión cuando el backend está caído", () => {
    // Sobreescribir interceptor de login con error de red
    cy.intercept("POST", "**/auth/login", { forceNetworkError: true }).as(
      "loginRequest",
    );

    cy.fixture("users").then((users) => {
      loginPage.fillAndSubmit(users.admin.email, users.admin.password);

      // El interceptor de axios detecta la ausencia de response
      loginPage.assertErrorVisible("No se pudo conectar con el servidor");
      loginPage.assertStillOnLogin();
    });
  });

  it("maneja múltiples intentos fallidos sin corromperse", () => {
    // Sobreescribir interceptor de login con 401
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: { detail: "Credenciales inválidas" },
      headers: { "content-type": "application/json" },
    }).as("loginRequest");

    cy.fixture("users").then((users) => {
      // Primer intento fallido
      loginPage.fillAndSubmit(users.invalid.email, users.invalid.password);
      cy.wait("@loginRequest");
      loginPage.assertErrorVisible("Credenciales inválidas");

      // Segundo intento fallido
      loginPage.fillAndSubmit(users.invalid.email, users.invalid.password);
      cy.wait("@loginRequest");
      loginPage.assertErrorVisible("Credenciales inválidas");

      // La UI sigue funcional
      cy.get('input[type="email"]').should("be.visible").and("be.enabled");
      cy.get('input[type="password"]').should("be.visible").and("be.enabled");
    });
  });
});
