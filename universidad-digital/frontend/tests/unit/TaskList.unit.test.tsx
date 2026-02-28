import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { TaskList } from "../../src/components/TaskList";
import { multipleTasks } from "../fixtures/tasks.fixtures";

describe("TaskList (unit behavior)", () => {
  it("muestra estado vacío cuando no hay tareas", () => {
    render(
      <TaskList
        tasks={[]}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />
    );

    expect(screen.getByText(/no hay tareas todavía/i)).toBeInTheDocument();
  });

  it("renderiza múltiples tareas con checkbox y botón de eliminar", () => {
    render(
      <TaskList
        tasks={multipleTasks}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />
    );

    const list = screen.getByRole("list", { name: /lista de tareas/i });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(multipleTasks.length);

    const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });
    expect(deleteButtons).toHaveLength(multipleTasks.length);
  });

  it("aplica estilo de texto tachado a tareas completadas", () => {
    render(
      <TaskList
        tasks={multipleTasks}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />
    );

    const completedTask = screen.getByText(/tests de integración/i);
    expect(completedTask).toHaveStyle({ textDecoration: "line-through" });

    const incompleteTask = screen.getByText(/aprender testing library/i);
    expect(incompleteTask).not.toHaveStyle({ textDecoration: "line-through" });
  });
});

