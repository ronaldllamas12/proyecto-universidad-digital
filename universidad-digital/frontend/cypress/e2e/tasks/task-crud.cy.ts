// ===========================================================================
// E2E — CRUD de tareas
// Valida: crear, toggle, eliminar — con validación UI + API + datos
// ===========================================================================

import { TasksPage } from "../../support/page-objects/TasksPage";

const tasksPage = new TasksPage();

describe("Tareas — Operaciones CRUD", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });
  });

  describe("Crear tarea válida", () => {
    it("crea una tarea y valida contrato API + renderización", () => {
      cy.fixture("tasks").then((tasksData) => {
        cy.mockTaskApi({ initialTasks: [] });

        tasksPage.visit();
        cy.wait("@getTasks");
        tasksPage.assertEmptyState();

        // Crear tarea
        tasksPage.createTask(tasksData.newTask.title);

        // Validar contrato POST /tasks
        cy.wait("@createTask").then((interception) => {
          // Request
          expect(interception.request.body).to.have.property(
            "title",
            tasksData.newTask.title,
          );

          // Response: 201 + estructura correcta
          expect(interception.response?.statusCode).to.eq(201);
          expect(interception.response?.body).to.have.property("id");
          expect(interception.response?.body).to.have.property(
            "title",
            tasksData.newTask.title,
          );
          expect(interception.response?.body).to.have.property(
            "completed",
            false,
          );

          const ct = interception.response?.headers?.["content-type"] ?? "";
          expect(ct).to.include("application/json");
        });

        // Validar renderización en UI
        tasksPage.assertTaskVisible(tasksData.newTask.title);
        tasksPage.assertTaskNotCompleted(tasksData.newTask.title);

        // Validar mensaje de éxito
        tasksPage.assertSuccessMessage("Tarea creada correctamente");
      });
    });
  });

  describe("Crear tarea con datos inválidos", () => {
    it("rechaza tarea vacía con validación frontend — sin request HTTP", () => {
      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");

      // Intentar enviar tarea vacía
      tasksPage.submitNewTask();

      // No debe enviar request al backend
      cy.get("@createTask.all").should("have.length", 0);

      // Validación del componente TaskForm
      tasksPage.assertFormValidationError("La tarea no puede estar vacía");
    });

    it("rechaza tarea con solo espacios en blanco", () => {
      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");

      // Escribir solo espacios
      cy.get("#task-title").type("     ");
      tasksPage.submitNewTask();

      // El trim() del componente lo atrapa
      cy.get("@createTask.all").should("have.length", 0);
      tasksPage.assertFormValidationError("La tarea no puede estar vacía");
    });
  });

  describe("Toggle de tarea (completar/descompletar)", () => {
    it("cambia el estado visual y envía PATCH al backend", () => {
      cy.fixture("tasks").then((tasksData) => {
        cy.mockTaskApi({ initialTasks: tasksData.initialTasks });
        tasksPage.visit();
        cy.wait("@getTasks");

        const taskTitle = tasksData.initialTasks[0].title;

        // Marcar como completada
        tasksPage.toggleTask(taskTitle);

        // Validar PATCH enviado
        cy.wait("@toggleTask").then((interception) => {
          expect(interception.request.body).to.have.property("completed", true);
          expect(interception.response?.statusCode).to.eq(200);
          expect(interception.response?.body).to.have.property(
            "completed",
            true,
          );
        });

        // Validar estilo line-through
        tasksPage.assertTaskCompleted(taskTitle);

        // Desmarcar
        tasksPage.toggleTask(taskTitle);

        cy.wait("@toggleTask").then((interception) => {
          expect(interception.request.body).to.have.property(
            "completed",
            false,
          );
          expect(interception.response?.statusCode).to.eq(200);
        });

        tasksPage.assertTaskNotCompleted(taskTitle);
      });
    });
  });

  describe("Eliminar tarea", () => {
    it("elimina tarea del DOM y envía DELETE al backend", () => {
      cy.fixture("tasks").then((tasksData) => {
        cy.mockTaskApi({ initialTasks: tasksData.initialTasks });
        tasksPage.visit();
        cy.wait("@getTasks");

        const taskTitle = tasksData.initialTasks[0].title;
        const initialCount = tasksData.initialTasks.length;

        tasksPage.assertTaskCount(initialCount);
        tasksPage.deleteTask(taskTitle);

        cy.wait("@deleteTask").then((interception) => {
          expect(interception.response?.statusCode).to.eq(204);
        });

        // Tarea eliminada del DOM
        tasksPage.assertTaskNotVisible(taskTitle);
        tasksPage.assertTaskCount(initialCount - 1);
      });
    });
  });
});
