// ===========================================================================
// Page Object — LoginPage
// Encapsula selectores e interacciones de la página de login
// ===========================================================================

import { SEL, ROUTES } from "../helpers/constants";

export class LoginPage {
  visit(): void {
    cy.visit(ROUTES.LOGIN);
  }

  fillEmail(email: string): void {
    cy.get(SEL.EMAIL_INPUT).should("be.visible").and("not.be.disabled").clear();
    cy.get(SEL.EMAIL_INPUT).type(email);
  }

  fillPassword(password: string): void {
    cy.get(SEL.PASSWORD_INPUT)
      .should("be.visible")
      .and("not.be.disabled")
      .clear();
    cy.get(SEL.PASSWORD_INPUT).type(password);
  }

  submit(): void {
    cy.contains("button", "Iniciar sesión").click();
  }

  fillAndSubmit(email: string, password: string): void {
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
  }

  // --- Aserciones ---

  assertErrorVisible(message: string): void {
    cy.get(SEL.LOGIN_ALERT)
      .find('[role="alert"]')
      .should("contain.text", message);
  }

  assertNoAlert(): void {
    cy.get(SEL.LOGIN_ALERT).find('[role="alert"]').should("not.exist");
  }

  assertValidationError(text: string): void {
    cy.contains(text).should("be.visible");
  }

  assertRedirectedAway(): void {
    cy.url().should("not.include", "/login");
  }

  assertStillOnLogin(): void {
    cy.url().should("include", "/login");
  }

  assertSubmitDisabled(): void {
    cy.contains("button", "Iniciar sesión").should("be.disabled");
  }
}
