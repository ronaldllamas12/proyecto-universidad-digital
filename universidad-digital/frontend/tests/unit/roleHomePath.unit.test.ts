import { describe, expect, it } from "vitest";
import {
  getHomePathForRoles,
  hasAppRole,
  normalizeRoleName,
} from "../../src/auth/roleHomePath";

describe("roleHomePath", () => {
  it("normaliza variantes conocidas de roles", () => {
    expect(normalizeRoleName("Docente Temporal")).toBe("Docente");
    expect(normalizeRoleName(" estudiante invitado ")).toBe("Estudiante");
  });

  it("detecta roles derivados al validar acceso", () => {
    expect(hasAppRole(["Docente Temporal"], ["Docente"])).toBe(true);
    expect(hasAppRole(["Coordinador"], ["Docente"])).toBe(false);
  });

  it("resuelve la ruta de inicio segun el rol normalizado", () => {
    expect(getHomePathForRoles(["Administrador General"])).toBe("/admin");
    expect(getHomePathForRoles(["Docente Temporal"])).toBe("/teacher");
    expect(getHomePathForRoles(["Estudiante Invitado"])).toBe("/student");
    expect(getHomePathForRoles(["Coordinador"])).toBeNull();
  });
});
