import { TasksPage } from "../../support/pageObjects/TasksPage";

describe("Tareas - resiliencia y fallos reales", () => {
  const tasksPage = new TasksPage();
  const apiUrl = String(Cypress.env("apiUrl") ?? "http://127.0.0.1:8000");

  beforeEach(() => {
    cy.mockAuthApi({ meStatus: 200, meRole: "Administrador" });
  });

  it("backend retorna 500 al crear tarea", () => {
    cy.mockTaskApi({ initialTasks: [] });
    cy.intercept("POST", `${apiUrl}/tasks`, {
      statusCode: 500,
      body: { detail: "Error interno al crear tarea" },
    }).as("createTask500");

    tasksPage.visit();
    tasksPage.fillNewTask("Tarea con backend 500");
    tasksPage.submitNewTask();

    cy.wait("@createTask500").its("response.statusCode").should("eq", 500);
    cy.url().should("include", "/500");
  });

  it("backend lento: respeta espera inteligente y muestra lista cargada", () => {
    cy.mockTaskApi({
      initialTasks: [{ id: "slow-1", title: "Carga lenta", completed: false }],
      getDelayMs: 2000,
    });

    tasksPage.visit();
    cy.contains("Cargando tareas...").should("be.visible");
    cy.wait("@getTasks").its("response.statusCode").should("eq", 200);
    tasksPage.assertTaskVisible("Carga lenta");
  });

  it("pérdida de conexión al listar tareas", () => {
    cy.mockTaskApi({ forceGetNetworkError: true });

    tasksPage.visit();

    cy.wait("@getTasks").then(({ error }) => {
      expect(error).to.exist;
    });
    cy.get('[role="alert"]').should(
      "contain.text",
      "No se pudo conectar con el servidor",
    );
  });

  it("respuesta parcial/corrupta de API no rompe la aplicación", () => {
    cy.intercept("GET", `${apiUrl}/tasks`, {
      statusCode: 200,
      body: [{ id: "broken-1", completed: false }],
    }).as("getTasksCorrupted");

    tasksPage.visit();
    cy.wait("@getTasksCorrupted").its("response.statusCode").should("eq", 200);

    cy.get("body").should("be.visible");
  });
});
