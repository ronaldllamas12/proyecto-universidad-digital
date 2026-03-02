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

  it("backend lento al crear tarea: mantiene consistencia y confirma respuesta", () => {
    cy.mockTaskApi({ initialTasks: [] });
    cy.intercept("POST", `${apiUrl}/tasks`, (request) => {
      request.reply({
        statusCode: 201,
        delay: 2500,
        body: {
          id: "slow-create-1",
          title: String(request.body?.title ?? ""),
          completed: false,
        },
      });
    }).as("createTaskSlow");

    tasksPage.visit();
    tasksPage.fillNewTask("Tarea backend lento");
    tasksPage.submitNewTask();

    cy.wait("@createTaskSlow").then(({ response, duration }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.include({
        title: "Tarea backend lento",
        completed: false,
      });
      expect(duration ?? 0).to.be.greaterThan(2400);
      expect(duration ?? 0).to.be.lessThan(6000);
    });

    tasksPage.assertTaskVisible("Tarea backend lento");
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

  it("pérdida de conexión al crear tarea", () => {
    cy.mockTaskApi({ initialTasks: [] });
    cy.intercept("POST", `${apiUrl}/tasks`, { forceNetworkError: true }).as(
      "createTaskNetworkError",
    );

    tasksPage.visit();
    tasksPage.fillNewTask("Tarea sin conexión");
    tasksPage.submitNewTask();

    cy.wait("@createTaskNetworkError").then(({ error }) => {
      expect(error).to.exist;
    });
    cy.get('[role="alert"]').should(
      "contain.text",
      "No se pudo conectar con el servidor",
    );
  });

  it("validación inconsistente (422) expone error serializado del backend", () => {
    cy.mockTaskApi({ initialTasks: [] });
    cy.intercept("POST", `${apiUrl}/tasks`, {
      statusCode: 422,
      body: {
        detail: [{ msg: "El título excede la longitud permitida" }],
      },
    }).as("createTask422");

    tasksPage.visit();
    tasksPage.fillNewTask("T".repeat(300));
    tasksPage.submitNewTask();

    cy.wait("@createTask422").its("response.statusCode").should("eq", 422);
    cy.get('[role="alert"]').should(
      "contain.text",
      "El título excede la longitud permitida",
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
