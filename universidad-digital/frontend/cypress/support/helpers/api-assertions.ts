// ===========================================================================
// Helpers de aserción sobre respuestas de API interceptadas
// ===========================================================================

/**
 * Valida status code, content-type JSON y tiempo de respuesta de un alias.
 */
export function assertJsonResponse(
  alias: string,
  expectedStatus: number,
  maxResponseMs?: number,
): void {
  const maxMs = maxResponseMs ?? Cypress.env("maxResponseTimeMs") ?? 3000;

  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode, `status ${alias}`).to.eq(
      expectedStatus,
    );

    const contentType = interception.response?.headers?.["content-type"] ?? "";
    expect(contentType, `content-type ${alias}`).to.include("application/json");

    if (interception.response?.statusCode !== 204) {
      expect(interception.response?.body, `body no vacío ${alias}`).to.exist;
    }

    const duration = interception.response
      ? (interception.response as unknown as Record<string, unknown>)[
          "duration"
        ]
      : undefined;

    // duration no siempre está disponible en stubbed responses
    if (typeof duration === "number") {
      expect(duration, `tiempo de respuesta ${alias}`).to.be.lessThan(maxMs);
    }
  });
}

/**
 * Valida que el body de la respuesta contenga las claves indicadas.
 */
export function assertBodyContainsKeys(alias: string, keys: string[]): void {
  cy.get(alias).then((interception: unknown) => {
    const resp = interception as {
      response?: { body?: Record<string, unknown> };
    };
    const body = resp.response?.body;
    keys.forEach((key) => {
      expect(body, `body contiene "${key}"`).to.have.property(key);
    });
  });
}

/**
 * Valida tiempo de respuesta de un alias ya esperado.
 */
export function assertResponseTimeBelow(alias: string, maxMs: number): void {
  cy.get(alias).then((interception: unknown) => {
    const resp = interception as { response?: Record<string, unknown> };
    const duration = (resp.response as unknown as Record<string, unknown>)?.[
      "duration"
    ];
    if (typeof duration === "number") {
      expect(duration, `respuesta < ${maxMs}ms`).to.be.lessThan(maxMs);
    }
  });
}
