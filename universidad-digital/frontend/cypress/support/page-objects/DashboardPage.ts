// ===========================================================================
// Page Object — DashboardPage (Admin)
// Encapsula selectores e interacciones del dashboard
// ===========================================================================

import { SEL, ROUTES } from "../helpers/constants";

export class DashboardPage {
  visit(): void {
    cy.visit(ROUTES.ADMIN_DASHBOARD);
  }

  // --- Aserciones de contenido ---

  assertTitle(title: string): void {
    cy.get(SEL.DASHBOARD_TITLE).should("contain.text", title);
  }

  assertGreeting(name: string): void {
    cy.get(SEL.USER_GREETING).should("contain.text", name);
  }

  assertMetricsVisible(): void {
    cy.get(SEL.METRICS_GRID).should("be.visible");
    cy.get(SEL.METRIC_CARD).should("have.length.greaterThan", 0);
  }

  assertMetricValue(label: string, value: string | number): void {
    cy.get(SEL.METRICS_GRID)
      .contains(".metric-card", label)
      .find("strong")
      .should("contain.text", String(value));
  }

  // --- Navegación sidebar ---

  assertSidebarVisible(): void {
    cy.get(SEL.SIDEBAR_NAV).should("exist");
  }

  navigateToSidebarLink(linkText: string): void {
    cy.get(SEL.SIDEBAR_NAV)
      .contains(SEL.SIDEBAR_LINK, linkText)
      .click({ force: true });
  }

  toggleMenu(): void {
    cy.get(SEL.MENU_TOGGLE).click();
  }

  logout(): void {
    cy.get(SEL.LOGOUT_BUTTON).click();
  }
}
