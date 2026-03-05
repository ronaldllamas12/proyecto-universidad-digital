// ===========================================================================
// E2E — Visualización de tareas
// Valida: lista correcta, datos renderizados, refresco mantiene estado
// ===========================================================================

import { TasksPage } from "../../support/page-objects/TasksPage";

const tasksPage = new TasksPage();

describe("Tareas — Visualización", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });
  });

  it("muestra estado vacío cuando no hay tareas", () => {
    cy.mockTaskApi({ initialTasks: [] });
    tasksPage.visit();
    cy.wait("@getTasks");

    tasksPage.assertEmptyState();
    cy.get('ul[aria-label="Lista de tareas"]').should("not.exist");
  });

  it("renderiza la lista con tareas precargadas del backend", () => {
    cy.fixture("tasks").then((tasksData) => {
      cy.mockTaskApi({ initialTasks: tasksData.initialTasks });
      tasksPage.visit();
      cy.wait("@getTasks");

      // Verificar título de página
      tasksPage.assertPageTitle();

      // Verificar cantidad de tareas
      tasksPage.assertTaskCount(tasksData.initialTasks.length);

      // Verificar que cada tarea tiene título visible
      tasksData.initialTasks.forEach(
        (task: { title: string; completed: boolean }) => {
          tasksPage.assertTaskVisible(task.title);
        },
      );
    });
  });

  it("muestra indicador de carga mientras se obtienen las tareas", () => {
    cy.mockTaskApi({ initialTasks: [], getDelay: 1500 });
    tasksPage.visit();

    // Debe mostrar "Cargando tareas..." mientras espera
    tasksPage.assertLoadingState();

    // Al resolver, desaparece el indicador
    cy.wait("@getTasks");
    cy.contains("Cargando tareas...").should("not.exist");
  });

  it("cada tarea tiene checkbox, título y botón eliminar", () => {
    const task = {
      id: "task-ui-1",
      title: "Tarea de prueba UI",
      completed: false,
    };
    cy.mockTaskApi({ initialTasks: [task] });
    tasksPage.visit();
    cy.wait("@getTasks");

    tasksPage.getTaskByText(task.title).within(() => {
      // Checkbox
      cy.get('input[type="checkbox"]').should("exist").and("not.be.checked");
      // Título visible
      cy.contains(task.title).should("be.visible");
      // Botón eliminar
      cy.contains("button", "Eliminar").should("be.visible");
    });
  });

  it("diferencia visualmente tareas completadas de pendientes", () => {
    const tasks = [
      { id: "t-1", title: "Tarea pendiente", completed: false },
      { id: "t-2", title: "Tarea completada", completed: true },
    ];

    cy.mockTaskApi({ initialTasks: tasks });
    tasksPage.visit();
    cy.wait("@getTasks");

    // Pendiente: sin line-through
    tasksPage.assertTaskNotCompleted("Tarea pendiente");
    tasksPage
      .getTaskByText("Tarea pendiente")
      .find('input[type="checkbox"]')
      .should("not.be.checked");

    // Completada: con line-through
    tasksPage.assertTaskCompleted("Tarea completada");
    tasksPage
      .getTaskByText("Tarea completada")
      .find('input[type="checkbox"]')
      .should("be.checked");
  });

  it("refresco de página mantiene el estado de las tareas", () => {
    const tasks = [
      { id: "r-1", title: "Tarea persistente A", completed: false },
      { id: "r-2", title: "Tarea persistente B", completed: true },
    ];

    cy.mockTaskApi({ initialTasks: tasks });
    tasksPage.visit();
    cy.wait("@getTasks");

    // Verificar estado inicial
    tasksPage.assertTaskCount(2);
    tasksPage.assertTaskNotCompleted("Tarea persistente A");
    tasksPage.assertTaskCompleted("Tarea persistente B");

    // Recargar con los mismos datos
    cy.mockTaskApi({ initialTasks: tasks });
    cy.reload();
    cy.wait("@getTasks");

    // Estado preservado
    tasksPage.assertTaskCount(2);
    tasksPage.assertTaskNotCompleted("Tarea persistente A");
    tasksPage.assertTaskCompleted("Tarea persistente B");
  });

  it("muestra el formulario de creación siempre visible", () => {
    cy.mockTaskApi({ initialTasks: [] });
    tasksPage.visit();
    cy.wait("@getTasks");

    // El formulario existe y es funcional
    cy.get('[aria-label="Formulario de tareas"]').should("be.visible");
    cy.get("#task-title").should("be.visible").and("be.enabled");
    cy.get("#task-title").should(
      "have.attr",
      "placeholder",
      "Escribe una tarea...",
    );
    cy.contains("button", "Añadir tarea").should("be.visible");
  });
});
