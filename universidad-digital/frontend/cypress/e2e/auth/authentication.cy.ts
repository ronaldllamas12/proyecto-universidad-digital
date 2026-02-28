import { LoginPage } from "../../support/pageObjects/LoginPage";

describe("Autenticación", () => {
  const loginPage = new LoginPage();

  it("login exitoso: autentica, redirige y valida contrato de API", () => {
    cy.mockAuthApi({
      meStatusSequence: [401, 200],
      loginStatus: 200,
      meRole: "Administrador",
    });

    cy.fixture("users").then((usersData) => {
      loginPage.visit();
      cy.wait("@getMe").its("response.statusCode").should("eq", 401);
      loginPage.fillEmail(usersData.admin.email);
      loginPage.fillPassword(usersData.admin.password);
      loginPage.submit();
    });

    cy.wait("@loginRequest").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body).to.have.property("access_token");
      expect(response?.body).to.have.property("token_type", "bearer");
    });

    cy.url().should("include", "/admin");
  });

  it("login inválido: muestra error backend con status 401", () => {
    cy.mockAuthApi({ meStatus: 401, loginStatus: 401 });

    cy.fixture("users").then((usersData) => {
      loginPage.visit();
      cy.wait("@getMe").its("response.statusCode").should("eq", 401);
      loginPage.fillEmail(usersData.invalid.email);
      loginPage.fillPassword(usersData.invalid.password);
      loginPage.submit();
    });

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 401);
    cy.get('[role="alert"]').should("contain.text", "Credenciales inválidas");
  });

  it("credenciales vacías: bloquea envío por validación del formulario", () => {
    cy.mockAuthApi({ meStatus: 401, loginStatus: 200 });

    loginPage.visit();
    loginPage.submit();

    cy.contains("Ingresa un email válido.").should("be.visible");
    cy.contains("La contraseña debe tener al menos 8 caracteres.").should(
      "be.visible",
    );
    cy.get("@loginRequest.all").should("have.length", 0);
  });

  it("token expirado: una respuesta 401 posterior redirige a login", () => {
    cy.mockAuthApi({
      meStatusSequence: [401, 200, 401],
      loginStatus: 200,
      meRole: "Administrador",
    });

    cy.fixture("users").then((usersData) => {
      loginPage.visit();
      cy.wait("@getMe").its("response.statusCode").should("eq", 401);
      loginPage.fillEmail(usersData.admin.email);
      loginPage.fillPassword(usersData.admin.password);
      loginPage.submit();
    });

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.visit("/admin/tasks");

    cy.url().should("include", "/login");
  });

  it("backend caído durante login: muestra mensaje de conectividad", () => {
    cy.mockAuthApi({ meStatus: 401, forceLoginNetworkError: true });

    cy.fixture("users").then((usersData) => {
      loginPage.visit();
      cy.wait("@getMe").its("response.statusCode").should("eq", 401);
      loginPage.fillEmail(usersData.admin.email);
      loginPage.fillPassword(usersData.admin.password);
      loginPage.submit();
    });

    cy.wait("@loginRequest").then(({ error }) => {
      expect(error).to.exist;
    });

    cy.get('[role="alert"]').should(
      "contain.text",
      "No se pudo conectar con el servidor",
    );
  });
});
