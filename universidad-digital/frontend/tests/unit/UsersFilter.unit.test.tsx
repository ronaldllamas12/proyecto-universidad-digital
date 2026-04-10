import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersPageFilter } from "../../src/pages/admin/UsersFilter";

const mockReload = vi.fn().mockResolvedValue(undefined);

const mockUsers = [
  {
    id: 1,
    email: "ana@uni.com",
    full_name: "Ana",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    roles: ["Administrador"],
  },
  {
    id: 2,
    email: "luis@uni.com",
    full_name: "Luis",
    is_active: false,
    created_at: "2026-01-01T00:00:00Z",
    roles: ["Docente"],
  },
];

vi.mock("../../src/hooks/useFetch", () => ({
  useFetch: vi.fn(),
}));

vi.mock("../../src/services/usersService", () => ({
  usersService: {
    list: vi.fn(),
    update: vi.fn(),
  },
}));

import { useFetch } from "../../src/hooks/useFetch";
import { usersService } from "../../src/services/usersService";

const mockedUseFetch = vi.mocked(useFetch);
const mockedUpdate = vi.mocked(usersService.update);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/users/list"]}>
      <UsersPageFilter />
    </MemoryRouter>,
  );
}

describe("UsersPageFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseFetch.mockReturnValue({
      data: mockUsers,
      error: null,
      isLoading: false,
      reload: mockReload,
    } as never);

    mockedUpdate.mockResolvedValue({
      ...mockUsers[0],
      full_name: "Ana Maria",
      is_active: false,
    } as never);
  });

  it("filtra usuarios por texto (id, nombre o email)", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Luis")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/buscar usuario/i), "ana@uni.com");

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("Luis")).not.toBeInTheDocument();
  });

  it("permite editar en linea y guardar cambios", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    const nameInput = screen.getByLabelText("Nombre de ana@uni.com");
    await user.clear(nameInput);
    await user.type(nameInput, "Ana Maria");

    await user.selectOptions(screen.getByLabelText("Estado de ana@uni.com"), "false");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith(1, {
        full_name: "Ana Maria",
        is_active: false,
      });
    });

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled();
    });

    expect(
      screen.getByText("Usuario actualizado correctamente."),
    ).toBeInTheDocument();
  });
});
