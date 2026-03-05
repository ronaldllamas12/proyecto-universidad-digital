import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/Button";

describe("Button", () => {
  it("renderiza con clase base", () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole("button", { name: /guardar/i });
    expect(button).toHaveClass("button");
  });

  it("aplica variante secondary", () => {
    render(<Button variant="secondary">Cancelar</Button>);

    expect(screen.getByRole("button", { name: /cancelar/i })).toHaveClass(
      "secondary",
    );
  });

  it("aplica variante danger", () => {
    render(<Button variant="danger">Eliminar</Button>);

    expect(screen.getByRole("button", { name: /eliminar/i })).toHaveClass(
      "danger",
    );
  });

  it("acepta className adicional", () => {
    render(<Button className="w-full">Acción</Button>);

    expect(screen.getByRole("button", { name: /acción/i })).toHaveClass(
      "w-full",
    );
  });

  it("hace fallback seguro cuando recibe variant inválida", () => {
    render(<Button variant={"invalid-variant" as any}>Fallback</Button>);

    const button = screen.getByRole("button", { name: /fallback/i });
    expect(button).toHaveClass("button");
    expect(button).not.toHaveClass("secondary");
    expect(button).not.toHaveClass("danger");
  });
});
