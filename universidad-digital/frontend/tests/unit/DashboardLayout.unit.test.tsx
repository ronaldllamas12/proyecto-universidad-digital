import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "../../src/layouts/DashboardLayout";

const logoutMock = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../src/hooks/useAuth";
const mockedUseAuth = vi.mocked(useAuth);

function renderLayout() {
  return render(
    <MemoryRouter>
      <DashboardLayout>
        <div>Contenido principal</div>
      </DashboardLayout>
    </MemoryRouter>,
  );
}

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      user: { full_name: "Admin QA", roles: ["Administrador"] },
      logout: logoutMock,
    } as any);
  });

  it("muestra saludo con nombre del usuario", () => {
    renderLayout();
    expect(screen.getByText(/hola, admin qa/i)).toBeInTheDocument();
  });

  it("renderiza links del menú para Administrador", () => {
    renderLayout();

    expect(
      screen.getByRole("link", { name: /dashboard admin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crear usuarios/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crear materias/i }),
    ).toBeInTheDocument();
  });

  it("togglea el estado del menú lateral", async () => {
    const user = userEvent.setup();
    renderLayout();

    const menuButton = screen.getByRole("button", { name: /abrir menú/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);

    expect(
      screen.getByRole("button", { name: /cerrar menú/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("ejecuta logout al hacer click en Salir", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("renderiza el contenido principal en main", () => {
    renderLayout();
    expect(screen.getByText("Contenido principal")).toBeInTheDocument();
  });

  it("muestra menú de Docente cuando el rol cambia", () => {
    mockedUseAuth.mockReturnValue({
      user: { full_name: "Docente QA", roles: ["Docente"] },
      logout: logoutMock,
    } as any);

    renderLayout();

    expect(
      screen.getByRole("link", { name: /dashboard docente/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /crear usuarios/i }),
    ).not.toBeInTheDocument();
  });
});
