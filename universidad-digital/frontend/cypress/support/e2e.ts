import "./commands";

beforeEach(() => {
  cy.resetBrowserState();
});

Cypress.on("uncaught:exception", () => {
  return false;
});
