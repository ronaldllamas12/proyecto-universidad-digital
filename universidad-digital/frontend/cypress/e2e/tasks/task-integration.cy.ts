// ===========================================================================
// E2E — Integración real (solo con API real)
// Se ejecuta solo con: CYPRESS_RUN_REAL_API=true
// Valida el flujo completo contra el backend real
// ===========================================================================

import { LoginPage } from "../../support/page-objects/LoginPage";
import { TasksPage } from "../../support/page-objects/TasksPage";
import { ROUTES } from "../../support/helpers/constants";

const loginPage = new LoginPage();
const tasksPage = new TasksPage();

const isRealApi = Cypress.env("runAgainstRealApi") === true;

(isRealApi ? describe : describe.skip)(
  "Tareas — Integración con API real",
  () => {
    const uniqueTitle = `E2E-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let createdTaskId: string | null = null;

    before(() => {
      // Login real
      const apiUrl = Cypress.env("apiUrl");
      cy.request("POST", `${apiUrl}/auth/login`, {
        email: Cypress.env("adminEmail"),
        password: Cypress.env("adminPassword"),
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property("access_token");
      });
    });

    after(() => {
      // Cleanup: eliminar la tarea creada
      if (createdTaskId) {
        const apiUrl = Cypress.env("apiUrl");
        cy.request({
          method: "DELETE",
          url: `${apiUrl}/tasks/${createdTaskId}`,
          failOnStatusCode: false,
        });
      }
    });

    it("flujo completo: login → crear tarea → persistencia → visualización", () => {
      const apiUrl = Cypress.env("apiUrl");

      // Interceptar para observar requests reales
      cy.intercept("POST", "**/tasks").as("realCreateTask");
      cy.intercept("GET", "**/tasks").as("realGetTasks");

      // 1) Login por UI
      loginPage.visit();
      loginPage.fillAndSubmit(
        Cypress.env("adminEmail"),
        Cypress.env("adminPassword"),
      );
      cy.url().should("not.include", "/login");

      // 2) Navegar a tareas
      cy.visit(ROUTES.ADMIN_TASKS);
      cy.wait("@realGetTasks");
      tasksPage.assertPageTitle();

      // 3) Crear tarea
      tasksPage.createTask(uniqueTitle);

      cy.wait("@realCreateTask").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);
        expect(interception.response?.body).to.have.property("id");
        expect(interception.response?.body).to.have.property(
          "title",
          uniqueTitle,
        );
        createdTaskId = interception.response?.body.id;
      });

      // 4) Validar en UI
      tasksPage.assertTaskVisible(uniqueTitle);

      // 5) Validar por API directa
      cy.request(`${apiUrl}/tasks`).then((resp) => {
        expect(resp.status).to.eq(200);
        const found = resp.body.find(
          (t: { title: string }) => t.title === uniqueTitle,
        );
        expect(found, "tarea encontrada en API").to.exist;
        expect(found.completed).to.eq(false);
      });

      // 6) Validar persistencia: recargar
      cy.reload();
      cy.wait("@realGetTasks");
      tasksPage.assertTaskVisible(uniqueTitle);
    });
  },
);
