import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "../../src/components/Select";

const options = [
  { value: "", label: "Selecciona" },
  { value: "1", label: "Administrador" },
  { value: "2", label: "Docente" },
];

describe("Select", () => {
  it("renderiza opciones y label", () => {
    render(<Select label="Rol" name="role_id" options={options} />);

    const select = screen.getByRole("combobox", { name: /rol/i });
    expect(select).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("permite cambiar valor", () => {
    render(<Select label="Rol" name="role_id" options={options} />);

    const select = screen.getByRole("combobox", { name: /rol/i });
    fireEvent.change(select, { target: { value: "2" } });

    expect(select).toHaveValue("2");
  });

  it("muestra error accesible", () => {
    render(
      <Select
        label="Rol"
        name="role_id"
        options={options}
        error="Debes seleccionar un rol"
      />,
    );

    const select = screen.getByRole("combobox", { name: /rol/i });
    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Debes seleccionar un rol");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", "role_id-error");
  });

  it("usa id generado desde label si no hay name", () => {
    render(<Select label="Tipo de usuario" options={options} />);

    const select = screen.getByRole("combobox", { name: /tipo de usuario/i });
    expect(select).toHaveAttribute("id", "tipo-de-usuario");
  });
});
