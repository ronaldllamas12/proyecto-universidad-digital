// ===========================================================================
// E2E — Acceso autenticado a rutas protegidas
// Valida: dashboard admin, navegación sidebar, elementos visibles por rol
// ===========================================================================

import { DashboardPage } from "../../support/page-objects/DashboardPage";
import { ROUTES } from "../../support/helpers/constants";

const dashboard = new DashboardPage();

describe("Navegación — Acceso autenticado", () => {
  beforeEach(() => {
    // Sesión activa como admin
    cy.mockAuthApi({ initialMeUnauthorized: false });
    cy.mockTaskApi();

    // Mock endpoints adicionales que cargan las páginas admin al montar
    cy.intercept("GET", "**/roles", {
      statusCode: 200,
      body: [
        { id: 1, name: "Administrador" },
        { id: 2, name: "Docente" },
        { id: 3, name: "Estudiante" },
      ],
    }).as("getRoles");
    cy.intercept("GET", "**/periods", {
      statusCode: 200,
      body: [],
    }).as("getPeriods");
    cy.intercept("GET", "**/subjects", {
      statusCode: 200,
      body: [],
    }).as("getSubjects");
  });

  it("muestra el dashboard de administrador con métricas correctas", () => {
    dashboard.visit();

    // Titulo y saludo
    dashboard.assertTitle("Panel Administrador");
    dashboard.assertGreeting("Admin QA");

    // Métricas renderizadas
    dashboard.assertMetricsVisible();

    // Validar datos del fixture contra lo renderizado
    cy.fixture("dashboard-metrics").then((data) => {
      dashboard.assertMetricValue("Usuarios", data.adminMetrics.total_users);
      dashboard.assertMetricValue(
        "Estudiantes activos",
        data.adminMetrics.total_students,
      );
      dashboard.assertMetricValue(
        "Docentes activos",
        data.adminMetrics.total_teachers,
      );
    });

    // Validar respuesta API
    cy.wait("@dashboardMetrics").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      const body = interception.response?.body;
      expect(body).to.have.property("total_users");
      expect(body).to.have.property("total_students");
      expect(body).to.have.property("total_subjects");
    });
  });

  it("navega entre secciones del sidebar sin perder sesión", () => {
    dashboard.visit();
    // Esperar a que AuthContext resuelva el usuario antes de buscar sidebar
    cy.wait("@meRequest");
    dashboard.assertSidebarVisible();

    // Navegar a Crear Usuarios
    dashboard.navigateToSidebarLink("Crear Usuarios");
    cy.url().should("include", "/admin/users");

    // Navegar a Crear Materias
    dashboard.navigateToSidebarLink("Crear Materias");
    cy.url().should("include", "/admin/subjects");

    // Navegar a Crear Periodos
    dashboard.navigateToSidebarLink("Crear Periodos");
    cy.url().should("include", "/admin/periods");

    // Volver al dashboard
    dashboard.navigateToSidebarLink("Dashboard Admin");
    cy.location("pathname").should("eq", "/admin");
    dashboard.assertTitle("Panel Administrador");
  });

  it("accede a la página de tareas desde la URL directa", () => {
    cy.visit(ROUTES.ADMIN_TASKS);

    cy.contains("h1", "Gestión de tareas").should("be.visible");
    cy.get('[aria-label="Gestión de tareas"]').should("exist");
  });
});
