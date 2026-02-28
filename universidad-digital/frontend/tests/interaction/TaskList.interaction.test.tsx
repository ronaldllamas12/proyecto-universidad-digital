import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TaskList } from "../../src/components/TaskList";
import { multipleTasks } from "../fixtures/tasks.fixtures";

describe("TaskList (interaction)", () => {
  it("llama a onToggleTask cuando se hace click en el checkbox", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskList
        tasks={multipleTasks}
        onToggleTask={handleToggle}
        onDeleteTask={handleDelete}
      />
    );

    const firstCheckbox = screen.getAllByRole("checkbox")[0];

    await user.click(firstCheckbox);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(multipleTasks[0].id);
  });

  it("llama a onDeleteTask al pulsar el botón Eliminar", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskList
        tasks={multipleTasks}
        onToggleTask={handleToggle}
        onDeleteTask={handleDelete}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });

    await user.click(deleteButtons[1]);

    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledWith(multipleTasks[1].id);
  });
});

