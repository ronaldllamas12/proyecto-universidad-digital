import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "../../src/components/Table";

type Row = {
  name: string;
  email: string;
};

const columns = [
  {
    header: "Nombre",
    render: (row: Row) => row.name,
  },
  {
    header: "Email",
    render: (row: Row) => row.email,
  },
];

describe("Table", () => {
  it("renderiza caption y encabezados", () => {
    render(<Table caption="Tabla de usuarios" columns={columns} data={[]} />);

    expect(screen.getByText("Tabla de usuarios")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Nombre" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Email" }),
    ).toBeInTheDocument();
  });

  it("renderiza filas con datos", () => {
    const data: Row[] = [
      { name: "Ana", email: "ana@uni.com" },
      { name: "Luis", email: "luis@uni.com" },
    ];

    render(<Table caption="Tabla de usuarios" columns={columns} data={data} />);

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@uni.com")).toBeInTheDocument();
    expect(screen.getByText("Luis")).toBeInTheDocument();
    expect(screen.getByText("luis@uni.com")).toBeInTheDocument();
  });

  it("mantiene tbody sin filas cuando no hay datos", () => {
    render(<Table caption="Tabla vacía" columns={columns} data={[]} />);

    const tbody = document.querySelector("tbody");
    expect(tbody).not.toBeNull();
    expect(within(tbody as HTMLElement).queryAllByRole("row")).toHaveLength(0);
  });
});
