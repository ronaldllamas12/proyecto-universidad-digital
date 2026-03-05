// ===========================================================================
// E2E — Resiliencia de tareas
// Simula: backend caído, respuesta corrupta, timeout, errores HTTP,
//         validaciones inconsistentes, respuesta parcial
// ===========================================================================

import { TasksPage } from "../../support/page-objects/TasksPage";
import { ROUTES } from "../../support/helpers/constants";

const tasksPage = new TasksPage();

describe("Tareas — Resiliencia y detección de fallos", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });
  });

  // -----------------------------------------------------------------------
  // Backend caído
  // -----------------------------------------------------------------------
  describe("Backend caído", () => {
    it("muestra error cuando GET /tasks falla por network error", () => {
      cy.mockTaskApi({ getNetworkError: true });
      tasksPage.visit();

      tasksPage.assertErrorMessage("No se pudo conectar con el servidor");
    });

    it("muestra error cuando POST /tasks falla por network error", () => {
      cy.mockTaskApi({ initialTasks: [], postNetworkError: true });
      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.createTask("Tarea que no llegará");

      tasksPage.assertErrorMessage("No se pudo conectar con el servidor");
    });
  });

  // -----------------------------------------------------------------------
  // Error HTTP 500
  // -----------------------------------------------------------------------
  describe("Error 500 del servidor", () => {
    it("redirige a /500 cuando el backend retorna error 500 en POST", () => {
      cy.mockTaskApi({
        initialTasks: [],
        postStatus: 500,
        postErrorBody: { detail: "Error interno del servidor" },
      });

      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.createTask("Tarea que causa 500");

      // El interceptor de axios redirige a /500
      cy.url().should("include", "/500");
      cy.contains("Error del servidor").should("be.visible");
    });

    it("redirige a /500 cuando GET /tasks retorna 500", () => {
      cy.intercept(
        { method: "GET", pathname: "/tasks" },
        {
          statusCode: 500,
          body: { detail: "Error interno" },
          headers: { "content-type": "application/json" },
        },
      ).as("getTasks500");

      tasksPage.visit();

      cy.url().should("include", "/500");
    });
  });

  // -----------------------------------------------------------------------
  // Backend lento (timeout)
  // -----------------------------------------------------------------------
  describe("Backend lento", () => {
    it("maneja respuesta lenta en GET sin romperse (2.5s)", () => {
      cy.mockTaskApi({
        initialTasks: [
          { id: "slow-1", title: "Tarea lenta", completed: false },
        ],
        getDelay: 2500,
      });

      tasksPage.visit();

      // Muestra loading mientras espera
      tasksPage.assertLoadingState();

      // Eventualmente carga
      cy.wait("@getTasks");
      tasksPage.assertTaskVisible("Tarea lenta");
      cy.contains("Cargando tareas...").should("not.exist");
    });

    it("maneja respuesta lenta en POST sin romperse (2.5s)", () => {
      cy.mockTaskApi({ initialTasks: [], postDelay: 2500 });
      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.createTask("Tarea con latencia");

      // El botón debería estar deshabilitado durante el envío
      cy.contains("button", "Añadir tarea").should("be.disabled");

      cy.wait("@createTask").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);
      });

      // Tarea aparece tras la espera
      tasksPage.assertTaskVisible("Tarea con latencia");
    });
  });

  // -----------------------------------------------------------------------
  // Respuesta corrupta / parcial
  // -----------------------------------------------------------------------
  describe("Respuesta corrupta", () => {
    it("la app no crashea con respuesta JSON corrupta en GET", () => {
      cy.mockTaskApi({ corruptGetResponse: true });
      tasksPage.visit();

      // La app no debería mostrar un crash total — debe manejar el error
      // Puede mostrar error o estado vacío, pero no pantalla blanca
      cy.get("body").should("be.visible");
      cy.get('[aria-label="Gestión de tareas"]').should("exist");
    });

    it("maneja respuesta parcial sin campos esperados", () => {
      cy.intercept(
        { method: "GET", pathname: "/tasks" },
        {
          statusCode: 200,
          body: [{ id: "partial-1" }, { title: "Sin ID ni completed" }],
          headers: { "content-type": "application/json" },
        },
      ).as("getPartialTasks");

      cy.mockAuthApi({ initialMeUnauthorized: false });
      tasksPage.visit();

      // Debe renderizar sin crashear
      cy.get("body").should("be.visible");
    });
  });

  // -----------------------------------------------------------------------
  // Error de validación 422
  // -----------------------------------------------------------------------
  describe("Validación del backend (422)", () => {
    it("muestra error de validación cuando el backend rechaza datos", () => {
      cy.mockTaskApi({
        initialTasks: [],
        postStatus: 422,
        postErrorBody: {
          detail: [
            {
              msg: "El título excede la longitud permitida",
              type: "value_error",
            },
          ],
        },
      });

      tasksPage.visit();
      cy.wait("@getTasks");

      cy.fixture("tasks").then((tasksData) => {
        tasksPage.createTask(tasksData.longTitle.title);

        cy.wait("@createTask").then((interception) => {
          expect(interception.response?.statusCode).to.eq(422);
        });

        // La app muestra el mensaje de error del backend
        tasksPage.assertErrorMessage("El título excede la longitud permitida");
      });
    });
  });

  // -----------------------------------------------------------------------
  // Consistencia entre requests
  // -----------------------------------------------------------------------
  describe("Consistencia de datos", () => {
    it("crear y luego eliminar — la lista queda consistente", () => {
      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");

      // Crear
      tasksPage.createTask("Tarea temporal");
      cy.wait("@createTask");
      tasksPage.assertTaskVisible("Tarea temporal");
      tasksPage.assertTaskCount(1);

      // Eliminar
      tasksPage.deleteTask("Tarea temporal");
      cy.wait("@deleteTask");
      tasksPage.assertEmptyState();
    });

    it("crear, completar y recargar — todo persiste", () => {
      const task = {
        id: "task-1",
        title: "Tarea persistente",
        completed: true,
      };

      cy.mockTaskApi({ initialTasks: [] });
      tasksPage.visit();
      cy.wait("@getTasks");

      tasksPage.createTask("Tarea persistente");
      cy.wait("@createTask");

      tasksPage.toggleTask("Tarea persistente");
      cy.wait("@toggleTask");
      tasksPage.assertTaskCompleted("Tarea persistente");

      // Simular persistencia
      cy.mockTaskApi({ initialTasks: [task] });
      cy.reload();
      cy.wait("@getTasks");

      tasksPage.assertTaskCompleted("Tarea persistente");
    });
  });
});
