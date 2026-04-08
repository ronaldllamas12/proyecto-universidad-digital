import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedPage } from "../../src/pages/AccessDeniedPage";
import { NotFoundPage } from "../../src/pages/NotFoundPage";
import { ServerErrorPage } from "../../src/pages/ServerErrorPage";

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth()
}));

describe("Páginas de error", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseAuth.mockReturnValue({
      user: null
    });
    window.history.replaceState({ idx: 0 }, "");
  });

  describe("AccessDeniedPage", () => {
    it("renderiza título y mensaje de acceso denegado", () => {
      render(<AccessDeniedPage />);

      expect(
        screen.getByRole("heading", { name: /acceso denegado/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/no tienes permisos para acceder a esta sección/i),
      ).toBeInTheDocument();
    });

    it("renderiza contenedor principal semántico", () => {
      const { container } = render(<AccessDeniedPage />);
      expect(container.querySelector("main.container")).toBeInTheDocument();
    });
  });

  describe("NotFoundPage", () => {
    it("renderiza código 404 y mensaje", () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
      expect(
        screen.getByText(/la p[aá]gina solicitada no existe/i),
      ).toBeInTheDocument();
    });

    it("muestra enlace para regresar al dashboard del usuario logueado", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: "admin@test.com",
          full_name: "Admin Test",
          roles: ["Administrador"],
          is_active: true
        }
      });

      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("link", { name: /regresar al inicio/i }),
      ).toHaveAttribute("href", "/admin");
    });

    it("usa login como destino cuando no hay sesión", () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("link", { name: /regresar al inicio/i }),
      ).toHaveAttribute("href", "/login");
    });

    it("vuelve a la pantalla anterior cuando hay historial", () => {
      window.history.replaceState({ idx: 2 }, "");

      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      fireEvent.click(
        screen.getByRole("button", { name: /volver a la pantalla anterior/i }),
      );

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("usa el dashboard como respaldo si no hay historial previo", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 2,
          email: "teacher@test.com",
          full_name: "Docente Test",
          roles: ["Docente"],
          is_active: true
        }
      });

      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      fireEvent.click(
        screen.getByRole("button", { name: /volver a la pantalla anterior/i }),
      );

      expect(mockNavigate).toHaveBeenCalledWith("/teacher", { replace: true });
    });
  });

  describe("ServerErrorPage", () => {
    it("renderiza título de error de servidor y descripción", () => {
      render(<ServerErrorPage />);

      expect(
        screen.getByRole("heading", { name: /error del servidor/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ocurrió un problema inesperado\. intenta más tarde/i),
      ).toBeInTheDocument();
    });

    it("renderiza contenedor principal", () => {
      const { container } = render(<ServerErrorPage />);
      expect(container.querySelector("main.container")).toBeInTheDocument();
    });
  });
});
