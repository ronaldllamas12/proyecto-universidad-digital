import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TasksPage } from "../../src/pages/admin/TasksPage";
import {
  createTask,
  deleteTask,
  fetchTasksFromServer,
  toggleTask,
} from "../../src/services/taskService";

vi.mock("../../src/services/taskService", () => ({
  fetchTasksFromServer: vi.fn(),
  createTask: vi.fn(),
  toggleTask: vi.fn(),
  deleteTask: vi.fn(),
}));

describe("TasksPage (functional)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toggleTask).mockResolvedValue({
      id: "1",
      title: "Base",
      completed: true,
    });
    vi.mocked(deleteTask).mockResolvedValue();
  });

  it("carga tareas iniciales y las muestra en pantalla", async () => {
    vi.mocked(fetchTasksFromServer).mockResolvedValueOnce([
      { id: "1", title: "Planificar sprint", completed: false },
    ]);

    render(<TasksPage />);

    expect(screen.getByText(/cargando tareas/i)).toBeInTheDocument();
    expect(await screen.findByText(/planificar sprint/i)).toBeInTheDocument();
  });

  it("muestra mensaje de conectividad cuando falla la carga", async () => {
    vi.mocked(fetchTasksFromServer).mockRejectedValueOnce(new Error("network"));

    render(<TasksPage />);

    expect(
      await screen.findByText(/no se pudo conectar con el servidor/i),
    ).toBeInTheDocument();
  });

  it("crea tarea correctamente y muestra alerta de éxito", async () => {
    const user = userEvent.setup();

    vi.mocked(fetchTasksFromServer).mockResolvedValueOnce([]);
    vi.mocked(createTask).mockResolvedValueOnce({
      id: "new-1",
      title: "Nueva tarea funcional",
      completed: false,
    });

    render(<TasksPage />);

    const input = await screen.findByRole("textbox", { name: /nueva tarea/i });
    await user.type(input, "Nueva tarea funcional");
    await user.click(screen.getByRole("button", { name: /añadir tarea/i }));

    expect(createTask).toHaveBeenCalledWith("Nueva tarea funcional");
    expect(
      await screen.findByText(/tarea creada correctamente/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/nueva tarea funcional/i)).toBeInTheDocument();
  });

  it("muestra error cuando falla la creación de tarea", async () => {
    const user = userEvent.setup();

    vi.mocked(fetchTasksFromServer).mockResolvedValueOnce([]);
    vi.mocked(createTask).mockRejectedValueOnce(new Error("network"));

    render(<TasksPage />);

    const input = await screen.findByRole("textbox", { name: /nueva tarea/i });
    await user.type(input, "Crear con error");
    await user.click(screen.getByRole("button", { name: /añadir tarea/i }));

    expect(
      await screen.findByText(/no se pudo conectar con el servidor/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/tarea creada correctamente/i),
    ).not.toBeInTheDocument();
  });

  it("muestra error cuando falla el toggle y no altera el estado local", async () => {
    const user = userEvent.setup();

    vi.mocked(fetchTasksFromServer).mockResolvedValueOnce([
      { id: "1", title: "Toggle task", completed: false },
    ]);
    vi.mocked(toggleTask).mockRejectedValueOnce(new Error("network"));

    render(<TasksPage />);

    const checkbox = await screen.findByRole("checkbox", {
      name: /toggle task/i,
    });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(
      await screen.findByText(/no se pudo conectar con el servidor/i),
    ).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("muestra error cuando falla la eliminación y mantiene la tarea", async () => {
    const user = userEvent.setup();

    vi.mocked(fetchTasksFromServer).mockResolvedValueOnce([
      { id: "1", title: "Delete task", completed: false },
    ]);
    vi.mocked(deleteTask).mockRejectedValueOnce(new Error("network"));

    render(<TasksPage />);

    expect(await screen.findByText(/delete task/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(
      await screen.findByText(/no se pudo conectar con el servidor/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/delete task/i)).toBeInTheDocument();
  });
});
