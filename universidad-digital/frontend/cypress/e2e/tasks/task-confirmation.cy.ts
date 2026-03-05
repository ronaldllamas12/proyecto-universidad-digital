// ===========================================================================
// E2E — Confirmación de tareas
// Valida: visual, por API, persistencia (refresco mantiene estado)
// ===========================================================================

import { TasksPage } from "../../support/page-objects/TasksPage";

const tasksPage = new TasksPage();

describe("Tareas — Confirmación y persistencia", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });
  });

  it("confirma la creación visual: tarea aparece con datos correctos", () => {
    cy.fixture("tasks").then((tasksData) => {
      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.createTask(tasksData.newTask.title);
      cy.wait("@createTask");

      // Confirmación visual
      tasksPage.assertTaskVisible(tasksData.newTask.title);
      tasksPage.assertTaskCount(1);

      // El checkbox no está marcado (tarea nueva = no completada)
      tasksPage
        .getTaskByText(tasksData.newTask.title)
        .find('input[type="checkbox"]')
        .should("not.be.checked");
    });
  });

  it("confirma por API: la respuesta del POST coincide con los datos renderizados", () => {
    cy.fixture("tasks").then((tasksData) => {
      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.createTask(tasksData.newTask.title);

      cy.wait("@createTask").then((interception) => {
        const responseBody = interception.response?.body;

        // Asegurar que la API retornó los datos esperados
        expect(responseBody.title).to.eq(tasksData.newTask.title);
        expect(responseBody.completed).to.eq(false);
        expect(responseBody.id).to.be.a("string");

        // Y que la UI muestra exactamente lo que retornó la API
        tasksPage.assertTaskVisible(responseBody.title);
      });
    });
  });

  it("persiste la tarea tras recargar la página (simulación)", () => {
    cy.fixture("tasks").then((tasksData) => {
      const createdTask = {
        id: "task-persist-1",
        title: tasksData.newTask.title,
        completed: false,
      };

      // Primera carga: lista vacía
      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");
      tasksPage.assertEmptyState();

      // Crear tarea
      tasksPage.createTask(tasksData.newTask.title);
      cy.wait("@createTask");
      tasksPage.assertTaskVisible(tasksData.newTask.title);

      // Simular persistencia: al recargar, el backend retorna la tarea
      cy.mockTaskApi({ initialTasks: [createdTask] });
      cy.reload();
      cy.wait("@getTasks");

      // La tarea persiste
      tasksPage.assertTaskVisible(createdTask.title);
      tasksPage.assertTaskCount(1);
    });
  });

  it("persiste el estado completado tras recargar", () => {
    const completedTask = {
      id: "task-comp-1",
      title: "Tarea ya completada",
      completed: true,
    };

    cy.mockTaskApi({ initialTasks: [completedTask] });
    tasksPage.visit();
    cy.wait("@getTasks");

    // Verificar que se renderiza como completada
    tasksPage.assertTaskCompleted(completedTask.title);
    tasksPage
      .getTaskByText(completedTask.title)
      .find('input[type="checkbox"]')
      .should("be.checked");

    // Recargar
    cy.mockTaskApi({ initialTasks: [completedTask] });
    cy.reload();
    cy.wait("@getTasks");

    // Sigue completada
    tasksPage.assertTaskCompleted(completedTask.title);
  });

  it("la lista muestra múltiples tareas con datos correctos", () => {
    cy.fixture("tasks").then((tasksData) => {
      cy.mockTaskApi({ initialTasks: tasksData.initialTasks });
      tasksPage.visit();
      cy.wait("@getTasks");

      // Verificar que cada tarea tiene los datos correctos
      tasksData.initialTasks.forEach(
        (task: { title: string; completed: boolean }) => {
          tasksPage.assertTaskVisible(task.title);

          if (task.completed) {
            tasksPage.assertTaskCompleted(task.title);
          } else {
            tasksPage.assertTaskNotCompleted(task.title);
          }
        },
      );

      tasksPage.assertTaskCount(tasksData.initialTasks.length);
    });
  });
});
