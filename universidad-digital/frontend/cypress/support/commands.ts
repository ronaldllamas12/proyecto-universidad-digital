import { LoginPage } from "./pageObjects/LoginPage";

type UserRole = "Administrador" | "Docente" | "Estudiante";

type MockAuthOptions = {
  meRole?: UserRole;
  meStatus?: number;
  meStatusSequence?: number[];
  loginStatus?: number;
  loginDelayMs?: number;
  forceLoginNetworkError?: boolean;
};

type MockTaskApiOptions = {
  initialTasks?: Array<{ id: string; title: string; completed: boolean }>;
  getDelayMs?: number;
  forceGetNetworkError?: boolean;
};

const defaultUserByRole: Record<
  UserRole,
  { id: number; full_name: string; roles: string[] }
> = {
  Administrador: { id: 1, full_name: "Admin QA", roles: ["Administrador"] },
  Docente: { id: 2, full_name: "Docente QA", roles: ["Docente"] },
  Estudiante: { id: 3, full_name: "Estudiante QA", roles: ["Estudiante"] },
};

Cypress.Commands.add("resetBrowserState", () => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

Cypress.Commands.add("mockAuthApi", (options: MockAuthOptions = {}) => {
  const {
    meRole = "Administrador",
    meStatus = 200,
    meStatusSequence,
    loginStatus = 200,
    loginDelayMs = 0,
    forceLoginNetworkError = false,
  } = options;

  const user = defaultUserByRole[meRole];

  if (forceLoginNetworkError) {
    cy.intercept("POST", "**/auth/login", { forceNetworkError: true }).as(
      "loginRequest",
    );
  } else {
    cy.intercept("POST", "**/auth/login", (request) => {
      request.reply({
        statusCode: loginStatus,
        delay: loginDelayMs,
        body:
          loginStatus >= 400
            ? { detail: "Credenciales inválidas." }
            : { access_token: "qa-token", token_type: "bearer" },
      });
    }).as("loginRequest");
  }

  let meCallCount = 0;

  cy.intercept("GET", "**/auth/me", (request) => {
    const sequenceStatus =
      meStatusSequence && meStatusSequence.length > 0
        ? meStatusSequence[Math.min(meCallCount, meStatusSequence.length - 1)]
        : meStatus;

    meCallCount += 1;

    request.reply({
      statusCode: sequenceStatus,
      body:
        sequenceStatus >= 400
          ? { detail: "No autenticado" }
          : {
              email: "qa@universidad.com",
              is_active: true,
              created_at: new Date().toISOString(),
              ...user,
            },
    });
  }).as("getMe");

  cy.intercept("POST", "**/auth/logout", { statusCode: 204, body: {} }).as(
    "logoutRequest",
  );
  cy.intercept("GET", "**/dashboard/admin", {
    statusCode: 200,
    body: {
      total_users: 10,
      total_students: 7,
      total_teachers: 2,
      total_subjects: 6,
      active_periods: 2,
      total_enrollments: 12,
    },
  }).as("adminDashboard");
});

Cypress.Commands.add("loginAsAdminSession", () => {
  const loginPage = new LoginPage();

  cy.session("admin-ui-session", () => {
    cy.mockAuthApi({
      meStatusSequence: [401, 200],
      loginStatus: 200,
      meRole: "Administrador",
    });
    cy.visit("/login");
    loginPage.fillEmail(Cypress.env("adminEmail"));
    loginPage.fillPassword(Cypress.env("adminPassword"));
    loginPage.submit();
    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
  });
});

Cypress.Commands.add("mockTaskApi", (options: MockTaskApiOptions = {}) => {
  const {
    initialTasks = [],
    getDelayMs = 0,
    forceGetNetworkError = false,
  } = options;
  const apiUrl = String(Cypress.env("apiUrl") ?? "http://127.0.0.1:8000");
  const getTasksRoute = `${apiUrl}/tasks`;
  const createTaskRoute = `${apiUrl}/tasks`;
  const patchTaskRoute = `${apiUrl}/tasks/*`;
  const deleteTaskRoute = `${apiUrl}/tasks/*`;

  let taskStore = [...initialTasks];

  if (forceGetNetworkError) {
    cy.intercept("GET", getTasksRoute, { forceNetworkError: true }).as(
      "getTasks",
    );
  } else {
    cy.intercept("GET", getTasksRoute, (request) => {
      request.reply({ statusCode: 200, delay: getDelayMs, body: taskStore });
    }).as("getTasks");
  }

  cy.intercept("POST", createTaskRoute, (request) => {
    const title = String(request.body?.title ?? "").trim();
    if (!title) {
      request.reply({ statusCode: 422, body: { detail: "Title requerido" } });
      return;
    }

    const createdTask = {
      id: `${Date.now()}-${taskStore.length + 1}`,
      title,
      completed: false,
    };
    taskStore = [...taskStore, createdTask];

    request.reply({ statusCode: 201, body: createdTask });
  }).as("createTask");

  cy.intercept("PATCH", patchTaskRoute, (request) => {
    const id = String(request.url.split("/").pop());
    const completed = Boolean(request.body?.completed);

    const currentTask = taskStore.find((task) => task.id === id);
    if (!currentTask) {
      request.reply({
        statusCode: 404,
        body: { detail: "Task no encontrada" },
      });
      return;
    }

    const updatedTask = { ...currentTask, completed };
    taskStore = taskStore.map((task) => (task.id === id ? updatedTask : task));

    request.reply({ statusCode: 200, body: updatedTask });
  }).as("patchTask");

  cy.intercept("DELETE", deleteTaskRoute, (request) => {
    const id = String(request.url.split("/").pop());
    taskStore = taskStore.filter((task) => task.id !== id);
    request.reply({ statusCode: 204, body: {} });
  }).as("deleteTask");
});
