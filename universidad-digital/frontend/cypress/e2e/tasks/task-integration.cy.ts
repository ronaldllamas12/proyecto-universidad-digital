import { LoginPage } from "../../support/pageObjects/LoginPage";
import { TasksPage } from "../../support/pageObjects/TasksPage";

describe("Tareas - integración real (UI + API + persistencia)", () => {
  const loginPage = new LoginPage();
  const tasksPage = new TasksPage();
  const apiUrl = String(Cypress.env("apiUrl") ?? "http://127.0.0.1:8000");

  beforeEach(function () {
    if (!Cypress.env("runAgainstRealApi")) {
      this.skip();
    }
  });

  it("login + creación + validación API + persistencia tras refresh", () => {
    const taskTitle = `E2E integración ${Date.now()}`;

    cy.intercept("POST", "**/auth/login").as("loginLive");
    cy.intercept("GET", `${apiUrl}/tasks`).as("getTasksLive");
    cy.intercept("POST", `${apiUrl}/tasks`).as("createTaskLive");

    loginPage.visit();
    loginPage.fillEmail(String(Cypress.env("adminEmail")));
    loginPage.fillPassword(String(Cypress.env("adminPassword")));
    loginPage.submit();

    let authToken = "";

    cy.wait("@loginLive").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body).to.have.property("access_token");
      authToken = String(response?.body?.access_token ?? "");
      expect(authToken).to.not.equal("");
    });

    tasksPage.visit();
    cy.wait("@getTasksLive").then(({ response, duration }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.headers["content-type"]).to.include("application/json");
      expect(response?.body).to.be.an("array");
      expect(duration ?? 0).to.be.lessThan(5000);
    });

    tasksPage.fillNewTask(taskTitle);
    tasksPage.submitNewTask();

    cy.wait("@createTaskLive").then(({ request, response, duration }) => {
      expect(request.body).to.have.property("title", taskTitle);
      expect(response?.statusCode).to.eq(201);
      expect(response?.headers["content-type"]).to.include("application/json");
      expect(response?.body).to.include({ title: taskTitle, completed: false });
      expect(duration ?? 0).to.be.lessThan(5000);
    });

    tasksPage.assertTaskVisible(taskTitle);

    cy.request({
      method: "GET",
      url: `${apiUrl}/tasks`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then(({ status, body, duration }) => {
      expect(status).to.eq(200);
      expect(duration).to.be.lessThan(5000);
      expect(body).to.be.an("array");
      expect(
        body.some((task: { title?: string }) => task.title === taskTitle),
      ).to.equal(true);
    });

    cy.reload();
    cy.wait("@getTasksLive");
    tasksPage.assertTaskVisible(taskTitle);

    cy.request({
      method: "GET",
      url: `${apiUrl}/tasks`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then(({ body }) => {
      const createdTask = (body as Array<{ id: string; title: string }>).find(
        (task) => task.title === taskTitle,
      );
      if (!createdTask) {
        throw new Error("No se encontró la tarea creada para cleanup");
      }

      cy.request({
        method: "DELETE",
        url: `${apiUrl}/tasks/${createdTask.id}`,
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .its("status")
        .should("be.oneOf", [200, 204]);
    });
  });
});
