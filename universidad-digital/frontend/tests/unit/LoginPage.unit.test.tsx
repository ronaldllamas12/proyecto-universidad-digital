import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../../src/pages/LoginPage";

const navigateMock = vi.fn();
const loginMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../src/hooks/useAuth";
const mockedUseAuth = vi.mocked(useAuth);

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue(true);

    mockedUseAuth.mockReturnValue({
      login: loginMock,
      error: null,
      isAuthenticated: false,
    } as any);
  });

  it("renderiza formulario de login con campos requeridos", () => {
    renderPage();

    expect(
      screen.getByRole("textbox", { name: /correo electrónico/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/contraseña/i, { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
  });

  it("muestra alerta cuando existe error de autenticación", () => {
    mockedUseAuth.mockReturnValue({
      login: loginMock,
      error: "Credenciales inválidas",
      isAuthenticated: false,
    } as any);

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Credenciales inválidas",
    );
  });

  it("envía credenciales sanitizadas al login", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByRole("textbox", { name: /correo electrónico/i }),
      "   admin@uni.com   ",
    );
    await user.type(
      screen.getByLabelText(/contraseña/i, { selector: "input" }),
      "  Password123  ",
    );
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("admin@uni.com", "Password123");
    });
  });

  it("redirige a / cuando ya está autenticado", () => {
    mockedUseAuth.mockReturnValue({
      login: loginMock,
      error: null,
      isAuthenticated: true,
    } as any);

    renderPage();

    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
  });

  it("valida formato de email antes de enviar", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByRole("textbox", { name: /correo electrónico/i }),
      "correo-invalido",
    );
    await user.type(
      screen.getByLabelText(/contraseña/i, { selector: "input" }),
      "Password123",
    );
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(loginMock).not.toHaveBeenCalled();
    });
  });
});
