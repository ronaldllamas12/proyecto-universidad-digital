const ROLE_PREFIXES: ReadonlyArray<[string, string]> = [
  ["administrador", "Administrador"],
  ["docente", "Docente"],
  ["estudiante", "Estudiante"],
];

export function normalizeRoleName(roleName: string) {
  const normalized = roleName.trim().replace(/\s+/g, " ").toLowerCase();

  for (const [prefix, canonical] of ROLE_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix} `)) {
      return canonical;
    }
  }

  return roleName.trim();
}

export function hasAppRole(
  currentRoles: string[],
  expectedRoles: string[],
) {
  const normalizedCurrentRoles = new Set(currentRoles.map(normalizeRoleName));
  return expectedRoles
    .map(normalizeRoleName)
    .some((role) => normalizedCurrentRoles.has(role));
}

export function getHomePathForRoles(roles: string[]): string | null {
  if (hasAppRole(roles, ["Administrador"])) {
    return "/admin";
  }
  if (hasAppRole(roles, ["Docente"])) {
    return "/teacher";
  }
  if (hasAppRole(roles, ["Estudiante"])) {
    return "/student";
  }
  return null;
}
