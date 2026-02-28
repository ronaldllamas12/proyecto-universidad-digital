import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestTasksContainer } from "./TestTasksContainer";

describe("Gestión de tareas (functional UI)", () => {
  it("muestra la tarea agregada en la lista tras un submit válido", async () => {
    const user = userEvent.setup();

    render(<TestTasksContainer />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "Escribir documentación");
    await user.click(submitButton);

    const listItem = await screen.findByText(/escribir documentación/i);
    expect(listItem).toBeInTheDocument();
  });

  it("marca una tarea como completada y cambia el estilo", async () => {
    const user = userEvent.setup();

    render(<TestTasksContainer />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "Tarea completada");
    await user.click(submitButton);

    const checkbox = await screen.findByRole("checkbox", {
      name: /tarea completada/i
    });

    await user.click(checkbox);

    const label = screen.getByText(/tarea completada/i);
    expect(label).toHaveStyle({ textDecoration: "line-through" });
  });

  it("elimina una tarea y la lista se re-renderiza sin ella", async () => {
    const user = userEvent.setup();

    render(<TestTasksContainer />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });

    await user.type(input, "Tarea a eliminar");
    await user.click(submitButton);

    const listItem = await screen.findByText(/tarea a eliminar/i);
    expect(listItem).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: /eliminar/i });
    await user.click(deleteButton);

    expect(screen.queryByText(/tarea a eliminar/i)).not.toBeInTheDocument();
  });

  it("navegación por teclado: permite enviar el formulario usando Tab y Enter", async () => {
    const user = userEvent.setup();

    render(<TestTasksContainer />);

    const input = screen.getByRole("textbox", { name: /nueva tarea/i });

    await user.tab();
    expect(input).toHaveFocus();

    await user.keyboard("Tarea accesible");
    await user.keyboard("{Tab}");
    const submitButton = screen.getByRole("button", { name: /añadir tarea/i });
    expect(submitButton).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(await screen.findByText(/tarea accesible/i)).toBeInTheDocument();
  });
});

