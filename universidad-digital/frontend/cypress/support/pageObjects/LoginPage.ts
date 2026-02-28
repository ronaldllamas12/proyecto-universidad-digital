export class LoginPage {
  visit() {
    cy.visit("/login");
  }

  fillEmail(email: string) {
    cy.get('input[type="email"]').should("be.enabled").clear().type(email);
  }

  fillPassword(password: string) {
    cy.get('input[type="password"]')
      .should("be.enabled")
      .clear()
      .type(password);
  }

  submit() {
    cy.contains("button", "Iniciar sesión").should("be.enabled").click();
  }

  assertValidationError(message: string) {
    cy.get('[role="alert"]').should("contain.text", message);
  }
}
