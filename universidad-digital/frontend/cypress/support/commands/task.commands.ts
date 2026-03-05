// ===========================================================================
// Comandos personalizados — Tareas (CRUD)
// ===========================================================================

import { API, SEL } from "../helpers/constants";

/**
 * Configura interceptores mock para la API de Tareas.
 *
 * Mantiene un store en memoria que simula la persistencia del backend.
 * Soporta: delays, errores de red, status forzados, respuestas corruptas.
 */
Cypress.Commands.add("mockTaskApi", (options: MockTaskApiOptions = {}) => {
  const {
    initialTasks = [],
    getDelay = 0,
    postDelay = 0,
    getNetworkError = false,
    postNetworkError = false,
    postStatus,
    postErrorBody,
    corruptGetResponse = false,
  } = options;

  // Store mutable en memoria
  const store = [...initialTasks];
  let nextId = store.length + 1;

  // --- GET /tasks ---
  // Usamos pathname en lugar de glob para evitar interceptar URLs como /admin/tasks
  if (getNetworkError) {
    cy.intercept(
      { method: "GET", pathname: API.TASKS },
      { forceNetworkError: true },
    ).as("getTasks");
  } else if (corruptGetResponse) {
    cy.intercept({ method: "GET", pathname: API.TASKS }, (req) => {
      req.reply({
        statusCode: 200,
        body: "<<<not-json>>>",
        headers: { "content-type": "application/json" },
      });
    }).as("getTasks");
  } else {
    cy.intercept({ method: "GET", pathname: API.TASKS }, (req) => {
      req.reply({
        statusCode: 200,
        body: store,
        headers: { "content-type": "application/json" },
        delay: getDelay,
      });
    }).as("getTasks");
  }

  // --- POST /tasks ---
  if (postNetworkError) {
    cy.intercept(
      { method: "POST", pathname: API.TASKS },
      { forceNetworkError: true },
    ).as("createTask");
  } else if (postStatus && postStatus >= 400) {
    cy.intercept({ method: "POST", pathname: API.TASKS }, (req) => {
      req.reply({
        statusCode: postStatus,
        body: postErrorBody ?? { detail: "Error del servidor" },
        headers: { "content-type": "application/json" },
        delay: postDelay,
      });
    }).as("createTask");
  } else {
    cy.intercept({ method: "POST", pathname: API.TASKS }, (req) => {
      const body = req.body as { title?: string };
      const newTask = {
        id: `task-${nextId++}`,
        title: body.title ?? "",
        completed: false,
      };
      store.push(newTask);
      req.reply({
        statusCode: 201,
        body: newTask,
        headers: { "content-type": "application/json" },
        delay: postDelay,
      });
    }).as("createTask");
  }

  // --- PATCH /tasks/:id ---
  cy.intercept({ method: "PATCH", pathname: API.TASK_BY_ID }, (req) => {
    const urlParts = req.url.split("/");
    const taskId = urlParts[urlParts.length - 1];
    const task = store.find((t) => t.id === taskId);

    if (!task) {
      req.reply({ statusCode: 404, body: { detail: "Tarea no encontrada" } });
      return;
    }

    const updates = req.body as Partial<{ completed: boolean; title: string }>;
    Object.assign(task, updates);

    req.reply({
      statusCode: 200,
      body: task,
      headers: { "content-type": "application/json" },
    });
  }).as("toggleTask");

  // --- DELETE /tasks/:id ---
  cy.intercept({ method: "DELETE", pathname: API.TASK_BY_ID }, (req) => {
    const urlParts = req.url.split("/");
    const taskId = urlParts[urlParts.length - 1];
    const idx = store.findIndex((t) => t.id === taskId);

    if (idx === -1) {
      req.reply({ statusCode: 404, body: { detail: "Tarea no encontrada" } });
      return;
    }

    store.splice(idx, 1);
    req.reply({
      statusCode: 204,
      body: null,
      headers: { "content-type": "application/json" },
    });
  }).as("deleteTask");
});

/**
 * Crea una tarea a través de la interfaz gráfica.
 */
Cypress.Commands.add("createTaskViaUI", (title: string) => {
  cy.get(SEL.TASK_INPUT).clear().type(title);
  cy.get(SEL.TASK_FORM).find('button[type="submit"]').click();
});

/**
 * Espera a que la lista de tareas se haya renderizado.
 */
Cypress.Commands.add("waitForTaskList", () => {
  cy.get(SEL.TASK_LOADING).should("not.exist");
  // La página ya cargó: o hay lista o hay mensaje vacío
  cy.get("body").then(($body) => {
    if ($body.find(SEL.TASK_LIST).length === 0) {
      cy.contains("No hay tareas todavía").should("be.visible");
    } else {
      cy.get(SEL.TASK_LIST).should("be.visible");
    }
  });
});
