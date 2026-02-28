export function assertJsonResponse(alias: string, expectedStatus: number) {
  cy.wait(alias).then(({ response }) => {
    expect(response?.statusCode).to.eq(expectedStatus);
    expect(response?.headers["content-type"]).to.include("application/json");
  });
}

export function assertResponseTime(alias: string, maxMs: number) {
  cy.wait(alias).then(({ response }) => {
    expect(response?.duration ?? 0).to.be.lessThan(maxMs);
  });
}
