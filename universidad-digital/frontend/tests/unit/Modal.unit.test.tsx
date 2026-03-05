import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "../../src/components/Modal";

describe("Modal", () => {
  it("no renderiza contenido cuando está cerrado", () => {
    render(
      <Modal title="Modal Test" isOpen={false} onClose={vi.fn()}>
        <p>Contenido interno</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Contenido interno")).not.toBeInTheDocument();
  });

  it("renderiza título y contenido cuando está abierto", () => {
    render(
      <Modal title="Modal Test" isOpen={true} onClose={vi.fn()}>
        <p>Contenido interno</p>
      </Modal>,
    );

    expect(
      screen.getByRole("dialog", { name: "Modal Test" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Modal Test")).toBeInTheDocument();
    expect(screen.getByText("Contenido interno")).toBeInTheDocument();
  });

  it("llama onClose al hacer click en cerrar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal title="Modal Test" isOpen={true} onClose={onClose}>
        <p>Contenido interno</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: /cerrar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
