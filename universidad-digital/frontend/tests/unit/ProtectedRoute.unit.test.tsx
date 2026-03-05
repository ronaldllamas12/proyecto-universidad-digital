import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../../src/routes/ProtectedRoute";

vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../src/hooks/useAuth";

const mockedUseAuth = vi.mocked(useAuth);

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["Administrador"]}>
              <div>Contenido protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Página Login</div>} />
        <Route path="/denied" element={<div>Acceso denegado page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProtectedRoute", () => {
  it("muestra loading cuando isLoading es true", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasRole: vi.fn(),
    } as never);

    renderProtectedRoute();

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("redirige a login cuando no está autenticado", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasRole: vi.fn(),
    } as never);

    renderProtectedRoute();

    expect(screen.getByText("Página Login")).toBeInTheDocument();
  });

  it("redirige a denied cuando no tiene rol requerido", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: vi.fn().mockReturnValue(false),
    } as never);

    renderProtectedRoute();

    expect(screen.getByText("Acceso denegado page")).toBeInTheDocument();
  });

  it("renderiza children cuando está autenticado y tiene rol", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: vi.fn().mockReturnValue(true),
    } as never);

    renderProtectedRoute();

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("llama hasRole con el array de roles requerido", () => {
    const hasRoleMock = vi.fn().mockReturnValue(true);

    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasRole: hasRoleMock,
    } as never);

    renderProtectedRoute();

    expect(hasRoleMock).toHaveBeenCalledWith(["Administrador"]);
  });
});
