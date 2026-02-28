import { TasksPage } from "../../support/pageObjects/TasksPage";

describe("Tareas - flujo funcional completo", () => {
  const tasksPage = new TasksPage();

  it("crea tarea válida, confirma por API y mantiene estado tras refresco", () => {
    cy.fixture("tasks").then((tasksFixture) => {
      cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });
      cy.mockTaskApi({ initialTasks: tasksFixture.initialTasks });

      tasksPage.visit();
      cy.wait("@getTasks").its("response.statusCode").should("eq", 200);

      tasksPage.fillNewTask(tasksFixture.newTask.title);
      tasksPage.submitNewTask();

      cy.wait("@createTask").then((interception: any) => {
        const { request, response, duration } = interception;
        expect(response?.statusCode).to.eq(201);
        expect(response?.headers["content-type"]).to.include(
          "application/json",
        );
        expect(duration ?? 0).to.be.lessThan(2500);
        expect(request.body).to.have.property(
          "title",
          tasksFixture.newTask.title,
        );
        expect(response?.body).to.include({
          title: tasksFixture.newTask.title,
          completed: false,
        });
      });

      tasksPage.assertTaskVisible(tasksFixture.newTask.title);

      cy.reload();
      cy.wait("@getTasks");
      tasksPage.assertTaskVisible(tasksFixture.newTask.title);
    });
  });

  it("valida consistencia UI + API para toggle y eliminación", () => {
    cy.fixture("tasks").then((tasksFixture) => {
      cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });
      cy.mockTaskApi({ initialTasks: tasksFixture.initialTasks });

      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.toggleTask("Preparar informe QA");
      cy.wait("@patchTask").then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body).to.have.property("completed", true);
        expect(response?.body).to.have.property("completed", true);
      });

      cy.contains("label", "Preparar informe QA").should(
        "have.css",
        "text-decoration-line",
        "line-through",
      );

      tasksPage.deleteTask("Preparar informe QA");
      cy.wait("@deleteTask").its("response.statusCode").should("eq", 204);
      cy.contains("Preparar informe QA").should("not.exist");
    });
  });

  it("rechaza creación inválida en frontend sin llamada HTTP", () => {
    cy.fixture("tasks").then((tasksFixture) => {
      cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });
      cy.mockTaskApi({ initialTasks: tasksFixture.initialTasks });

      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.fillNewTask("     ");
      tasksPage.submitNewTask();

      cy.get('[role="alert"]').should(
        "contain.text",
        "La tarea no puede estar vacía",
      );
      cy.get("@createTask.all").should("have.length", 0);
    });
  });

  it("redirige a /500 cuando el backend falla al crear tarea", () => {
    cy.fixture("tasks").then((tasksFixture) => {
      cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });
      cy.mockTaskApi({ initialTasks: tasksFixture.initialTasks });

      const apiUrl = String(Cypress.env("apiUrl") ?? "http://127.0.0.1:8000");
      cy.intercept("POST", `${apiUrl}/tasks`, {
        statusCode: 500,
        body: { detail: "Error inesperado en creación" },
      }).as("createTaskError");

      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.fillNewTask("Tarea con fallo API");
      tasksPage.submitNewTask();

      cy.wait("@createTaskError").its("response.statusCode").should("eq", 500);
      cy.url().should("include", "/500");
    });
  });
});
