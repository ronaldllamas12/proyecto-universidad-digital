// ===========================================================================
// E2E — Protección de rutas
// Valida: bloqueo sin autenticación, acceso denegado por rol, 404
// ===========================================================================

import { ROUTES } from "../../support/helpers/constants";

describe("Navegación — Protección de rutas", () => {
  it("redirige al login cuando se accede sin autenticación", () => {
    // me retorna 401 siempre (no hay sesión)
    cy.mockAuthApi({
      initialMeUnauthorized: true,
      meSequence: [401, 401, 401],
    });

    cy.visit(ROUTES.ADMIN_DASHBOARD);

    // ProtectedRoute redirige a /login
    cy.url().should("include", "/login");
  });

  it("redirige al login al intentar acceder a tareas sin sesión", () => {
    cy.mockAuthApi({
      initialMeUnauthorized: true,
      meSequence: [401, 401, 401],
    });

    cy.visit(ROUTES.ADMIN_TASKS);
    cy.url().should("include", "/login");
  });

  it("redirige a /denied cuando un estudiante intenta acceder a /admin", () => {
    // Autenticado como estudiante
    cy.mockAuthApi({
      roles: ["Estudiante"],
      initialMeUnauthorized: false,
    });

    cy.visit(ROUTES.ADMIN_DASHBOARD);

    // ProtectedRoute detecta que no tiene rol Administrador
    cy.url().should("include", "/denied");
    cy.contains("Acceso denegado").should("be.visible");
  });

  it("redirige a /denied cuando un docente intenta acceder a /admin", () => {
    cy.mockAuthApi({
      roles: ["Docente"],
      initialMeUnauthorized: false,
    });

    cy.visit(ROUTES.ADMIN_DASHBOARD);
    cy.url().should("include", "/denied");
  });

  it("muestra página 404 para rutas inexistentes", () => {
    cy.mockAuthApi({ initialMeUnauthorized: false });

    cy.visit("/ruta-que-no-existe");
    cy.contains("404").should("be.visible");
  });

  it("permite acceso al estudiante a sus propias rutas", () => {
    cy.mockAuthApi({
      roles: ["Estudiante"],
      initialMeUnauthorized: false,
    });

    // Interceptar API de estudiante
    cy.intercept("GET", "**/dashboard/student", {
      statusCode: 200,
      body: { enrolled_subjects: 3, active_periods: 1, grades_count: 5 },
      headers: { "content-type": "application/json" },
    }).as("studentMetrics");

    cy.visit(ROUTES.STUDENT_DASHBOARD);

    cy.url().should("include", "/student");
    cy.get(".dashboard-page__title").should("contain.text", "Panel Estudiante");
  });
});
