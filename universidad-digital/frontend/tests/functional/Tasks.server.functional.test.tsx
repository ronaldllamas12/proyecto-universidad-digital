import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { fetchTasksFromServer } from "../../src/services/taskService";
import { serverTasksFixture } from "../fixtures/tasks.fixtures";
import { TestTasksFromServerContainer } from "./TestTasksFromServerContainer";

vi.mock("../../src/services/taskService", () => ({
  fetchTasksFromServer: vi.fn(),
}));

describe("TaskList (functional server state)", () => {
  it("renderiza tareas simuladas de servidor usando vi.mock", async () => {
    vi.mocked(fetchTasksFromServer).mockResolvedValueOnce(serverTasksFixture);

    render(<TestTasksFromServerContainer />);

    expect(
      await screen.findByText(/sincronizar tareas del servidor/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/verificar estado inicial cargado/i),
    ).toBeInTheDocument();
  });
});
