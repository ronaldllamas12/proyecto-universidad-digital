import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessDeniedPage } from "../../src/pages/AccessDeniedPage";
import { NotFoundPage } from "../../src/pages/NotFoundPage";
import { ServerErrorPage } from "../../src/pages/ServerErrorPage";

describe("Páginas de error", () => {
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
      render(<NotFoundPage />);

      expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
      expect(
        screen.getByText(/la página solicitada no existe/i),
      ).toBeInTheDocument();
    });

    it("renderiza layout con card", () => {
      const { container } = render(<NotFoundPage />);
      expect(container.querySelector("main .card")).toBeInTheDocument();
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
