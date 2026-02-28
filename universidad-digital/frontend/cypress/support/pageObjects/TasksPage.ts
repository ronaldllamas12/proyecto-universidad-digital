export class TasksPage {
  visit() {
    cy.visit("/admin/tasks");
  }

  openFromSidebar() {
    cy.contains("a", "Tareas QA").click();
  }

  fillNewTask(title: string) {
    cy.get("#task-title").clear().type(title);
  }

  submitNewTask() {
    cy.contains("button", "Añadir tarea").click();
  }

  assertTaskVisible(title: string) {
    cy.contains(title).should("be.visible");
  }

  toggleTask(title: string) {
    cy.contains("label", title).find("input[type='checkbox']").click();
  }

  deleteTask(title: string) {
    cy.contains("li", title).within(() => {
      cy.contains("button", "Eliminar").click();
    });
  }
}
