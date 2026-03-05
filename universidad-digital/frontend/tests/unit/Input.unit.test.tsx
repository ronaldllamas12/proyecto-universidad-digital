import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "../../src/components/Input";

describe("Input", () => {
  it("renderiza label e input asociado", () => {
    render(<Input label="Correo" name="email" type="email" />);

    const input = screen.getByRole("textbox", { name: /correo/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "email");
  });

  it("usa id generado desde el label cuando no se provee name", () => {
    render(<Input label="Nombre completo" />);

    const input = screen.getByRole("textbox", { name: /nombre completo/i });
    expect(input).toHaveAttribute("id", "nombre-completo");
  });

  it("muestra estado de error accesible", () => {
    render(<Input label="Correo" name="email" error="Email inválido" />);

    const input = screen.getByRole("textbox", { name: /correo/i });
    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Email inválido");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
  });

  it("no renderiza alerta cuando no hay error", () => {
    render(<Input label="Correo" name="email" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
