// ===========================================================================
// Page Object — TasksPage
// Encapsula selectores e interacciones de la página de gestión de tareas
// ===========================================================================

import { SEL, ROUTES } from "../helpers/constants";

export class TasksPage {
  visit(): void {
    cy.visit(ROUTES.ADMIN_TASKS);
  }

  // --- Formulario ---

  fillNewTask(title: string): void {
    cy.get(SEL.TASK_INPUT).clear().type(title);
  }

  submitNewTask(): void {
    cy.get(SEL.TASK_FORM).find('button[type="submit"]').click();
  }

  createTask(title: string): void {
    this.fillNewTask(title);
    this.submitNewTask();
  }

  clearTaskInput(): void {
    cy.get(SEL.TASK_INPUT).clear();
  }

  // --- Lista ---

  getTaskItems() {
    return cy.get(SEL.TASK_LIST).find("li");
  }

  getTaskByText(title: string) {
    return cy.get(SEL.TASK_LIST).contains("li", title);
  }

  toggleTask(title: string): void {
    this.getTaskByText(title).find(SEL.TASK_CHECKBOX).click();
  }

  deleteTask(title: string): void {
    this.getTaskByText(title).contains("button", "Eliminar").click();
  }

  // --- Aserciones ---

  assertPageTitle(): void {
    cy.get(SEL.TASKS_PAGE).should("exist");
    cy.contains("h1", "Gestión de tareas").should("be.visible");
  }

  assertTaskVisible(title: string): void {
    cy.get(SEL.TASK_LIST).should("contain.text", title);
  }

  assertTaskNotVisible(title: string): void {
    cy.get(SEL.TASK_LIST).should("not.contain.text", title);
  }

  assertTaskCompleted(title: string): void {
    this.getTaskByText(title)
      .find("label")
      .should("have.css", "text-decoration")
      .and("include", "line-through");
  }

  assertTaskNotCompleted(title: string): void {
    this.getTaskByText(title)
      .find("label")
      .should("have.css", "text-decoration")
      .and("not.include", "line-through");
  }

  assertTaskCount(count: number): void {
    cy.get(SEL.TASK_LIST).find("li").should("have.length", count);
  }

  assertEmptyState(): void {
    cy.contains("No hay tareas todavía").should("be.visible");
  }

  assertLoadingState(): void {
    cy.contains("Cargando tareas...").should("be.visible");
  }

  assertErrorMessage(text: string): void {
    cy.get('[role="alert"]').should("contain.text", text);
  }

  assertSuccessMessage(text: string): void {
    cy.get('[role="alert"]').should("contain.text", text);
  }

  assertFormValidationError(text: string): void {
    cy.get(SEL.TASK_FORM).find('[role="alert"]').should("contain.text", text);
  }
}
