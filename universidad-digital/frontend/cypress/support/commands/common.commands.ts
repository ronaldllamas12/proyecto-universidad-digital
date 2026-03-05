// ===========================================================================
// Comandos personalizados — Comunes / Aserciones
// ===========================================================================

/**
 * Valida la respuesta de un alias interceptado:
 * - status code
 * - content-type JSON
 * - tiempo de respuesta menor a maxResponseMs
 */
Cypress.Commands.add(
  "assertApiResponse",
  (alias: string, expectedStatus: number, maxResponseMs?: number) => {
    const maxMs = maxResponseMs ?? Cypress.env("maxResponseTimeMs") ?? 3000;

    cy.wait(`@${alias}`).then((interception) => {
      // Status code
      expect(interception.response?.statusCode, `[${alias}] status code`).to.eq(
        expectedStatus,
      );

      // Content-type
      if (interception.response?.statusCode !== 204) {
        const ct = interception.response?.headers?.["content-type"] ?? "";
        expect(ct, `[${alias}] content-type`).to.include("application/json");
      }

      // Tiempo de respuesta (solo disponible en respuestas reales, no en stubs)
      const duration = (
        interception.response as unknown as Record<string, unknown>
      )?.["duration"];
      if (typeof duration === "number") {
        expect(duration, `[${alias}] respuesta < ${maxMs}ms`).to.be.lessThan(
          maxMs,
        );
      }
    });
  },
);

/**
 * Valida que el body JSON de un alias contenga las claves especificadas.
 */
Cypress.Commands.add("assertJsonBodyKeys", (alias: string, keys: string[]) => {
  cy.get(`@${alias}`).then((interception) => {
    const resp = interception as unknown as {
      response?: { body?: Record<string, unknown> };
    };
    const body = resp.response?.body;
    keys.forEach((key) => {
      expect(body, `body contiene "${key}"`).to.have.property(key);
    });
  });
});
