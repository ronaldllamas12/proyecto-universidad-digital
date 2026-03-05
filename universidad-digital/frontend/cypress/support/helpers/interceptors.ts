// ===========================================================================
// Fábricas de interceptores reutilizables — Universidad Digital
// ===========================================================================

import { API } from "./constants";

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

/**
 * Genera la respuesta estándar de un usuario autenticado.
 */
export function buildMeResponse(
  overrides: Partial<{
    roles: string[];
    full_name: string;
    email: string;
    id: number;
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    email: overrides.email ?? "admin@universidad.com",
    full_name: overrides.full_name ?? "Admin QA",
    is_active: true,
    created_at: "2025-01-01T00:00:00",
    roles: overrides.roles ?? ["Administrador"],
  };
}

/**
 * Genera métricas mock del dashboard de administrador.
 */
export function buildAdminMetrics() {
  return {
    total_users: 42,
    total_students: 25,
    total_teachers: 10,
    total_subjects: 8,
    active_periods: 3,
    total_enrollments: 60,
  };
}

/**
 * Configura un interceptor secuencial: cada llamada responde con el
 * siguiente elemento del array. El último se reutiliza indefinidamente.
 */
export function interceptSequence(
  method: HttpMethod,
  urlPattern: string,
  responses: Array<{ statusCode: number; body?: unknown }>,
  alias: string,
): void {
  let callIndex = 0;
  cy.intercept(method, `**${urlPattern}`, (req) => {
    const idx = Math.min(callIndex, responses.length - 1);
    callIndex++;
    const { statusCode, body } = responses[idx];
    req.reply({
      statusCode,
      body: body ?? {},
      headers: { "content-type": "application/json" },
    });
  }).as(alias);
}

/**
 * Helper para interceptor con delay controlado.
 */
export function interceptWithDelay(
  method: HttpMethod,
  urlPattern: string,
  response: { statusCode: number; body: unknown },
  delayMs: number,
  alias: string,
): void {
  cy.intercept(method, `**${urlPattern}`, (req) => {
    req.reply({
      statusCode: response.statusCode,
      body: response.body,
      headers: { "content-type": "application/json" },
      delay: delayMs,
    });
  }).as(alias);
}

/**
 * Helper para interceptor con error de red.
 */
export function interceptNetworkError(
  method: HttpMethod,
  urlPattern: string,
  alias: string,
): void {
  cy.intercept(method, `**${urlPattern}`, { forceNetworkError: true }).as(
    alias,
  );
}
