import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TaskForm } from "../../src/components/TaskForm";
import { longTaskTitle } from "../fixtures/tasks.fixtures";

describe("TaskForm (interaction)", () => {
  it("no permite enviar una tarea vacía y muestra error", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.click(submitButton);

    expect(handleCreateTask).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /no puede estar vacía/i,
    );
  });

  it("envía una tarea válida y limpia el campo", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "Comprar pan");
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(handleCreateTask).toHaveBeenCalledTimes(1);
    expect(handleCreateTask).toHaveBeenCalledWith("Comprar pan");
    expect(input).toHaveValue("");
  });

  it("trimea espacios en blanco antes de enviar", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "   tarea con espacios   ");
    await user.click(submitButton);

    expect(handleCreateTask).toHaveBeenCalledWith("tarea con espacios");
  });

  it("rechaza cadenas solo de espacios y muestra error", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "    ");
    await user.click(submitButton);

    expect(handleCreateTask).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /no puede estar vacía/i,
    );
  });

  it("permite múltiples submits válidos seguidos", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "Tarea 1");
    await user.click(submitButton);

    await user.type(input, "Tarea 2");
    await user.click(submitButton);

    expect(handleCreateTask).toHaveBeenCalledTimes(2);
    expect(handleCreateTask).toHaveBeenNthCalledWith(1, "Tarea 1");
    expect(handleCreateTask).toHaveBeenNthCalledWith(2, "Tarea 2");
  });

  it("permite enviar usando la tecla Enter", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });

    await user.type(input, "Tarea por enter{Enter}");

    expect(handleCreateTask).toHaveBeenCalledTimes(1);
    expect(handleCreateTask).toHaveBeenCalledWith("Tarea por enter");
  });

  it("acepta texto largo y lo envía completo", async () => {
    const user = userEvent.setup();
    const handleCreateTask = vi.fn();

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, longTaskTitle);
    await user.click(submitButton);

    expect(handleCreateTask).toHaveBeenCalledWith(longTaskTitle);
  });

  it("deshabilita el botón mientras el submit async está en curso", async () => {
    const user = userEvent.setup();

    let resolver: (() => void) | null = null;
    const handleCreateTask = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolver = resolve;
        }),
    );

    render(<TaskForm onCreateTask={handleCreateTask} />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "Tarea async");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    resolver?.();
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });
});
