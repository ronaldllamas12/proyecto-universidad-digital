describe("Navegación y protección de rutas", () => {
  it("permite acceso al dashboard autenticado", () => {
    cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });

    cy.visit("/admin");

    cy.contains("Panel Administrador").should("be.visible");
    cy.url().should("include", "/admin");
  });

  it("bloquea acceso al dashboard sin autenticación", () => {
    cy.mockAuthApi({ meStatus: 401 });

    cy.visit("/admin");

    cy.url().should("include", "/login");
    cy.contains("Iniciar sesión").should("be.visible");
  });
});
