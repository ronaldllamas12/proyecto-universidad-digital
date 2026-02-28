import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { TaskForm } from "../../src/components/TaskForm";

describe("TaskForm (unit behavior)", () => {
  it("renderiza el formulario con input y botón accesibles", () => {
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const textbox = screen.getByRole("textbox", { name: /nueva tarea/i });
    const button = screen.getByRole("button", { name: /añadir tarea/i });

    expect(textbox).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("no muestra error inicialmente", () => {
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

