import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "../../src/components/Alert";

describe("Alert", () => {
  it("renderiza mensaje con role alert", () => {
    render(<Alert message="Operación exitosa" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Operación exitosa");
  });

  it("usa variante error por defecto", () => {
    render(<Alert message="Error inesperado" />);

    expect(screen.getByRole("alert")).toHaveClass("error");
  });

  it("aplica variante success cuando se especifica", () => {
    render(<Alert message="Guardado" variant="success" />);

    expect(screen.getByRole("alert")).toHaveClass("success");
  });

  it("mantiene aria-live polite", () => {
    render(<Alert message="Mensaje" />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "polite");
  });
});
