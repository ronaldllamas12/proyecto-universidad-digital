describe("Navegación y protección de rutas", () => {
  it("permite acceso al dashboard autenticado", () => {
    cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });

    cy.visit("/admin");

    cy.wait("@getMe").its("response.statusCode").should("eq", 200);
    cy.wait("@adminDashboard").then(({ response, duration }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.headers["content-type"]).to.include("application/json");
      expect(response?.body).to.have.property("total_users");
      expect(duration ?? 0).to.be.lessThan(2500);
    });

    cy.contains("Panel Administrador").should("be.visible");
    cy.url().should("include", "/admin");
  });

  it("bloquea acceso al dashboard sin autenticación", () => {
    cy.mockAuthApi({ meStatus: 401 });

    cy.visit("/admin");

    cy.wait("@getMe").its("response.statusCode").should("eq", 401);

    cy.url().should("include", "/login");
    cy.contains("Iniciar sesión").should("be.visible");
  });
});
