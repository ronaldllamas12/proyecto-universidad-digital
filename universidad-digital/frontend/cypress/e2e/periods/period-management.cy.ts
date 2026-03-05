describe("Periodos — Gestión básica", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });

    cy.intercept(
      { method: "GET", pathname: "/periods" },
      {
        statusCode: 200,
        body: [],
      },
    ).as("listPeriods");

    cy.intercept({ method: "POST", pathname: "/periods" }, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 77,
          code: req.body.code,
          name: req.body.name,
          start_date: req.body.start_date,
          end_date: req.body.end_date,
          is_active: true,
          created_at: "2025-01-01T00:00:00",
        },
      });
    }).as("createPeriod");

    cy.intercept({ method: "PUT", pathname: "/periods/*" }, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 77,
          code: "2026A",
          name: req.body.name ?? "Periodo A",
          start_date: req.body.start_date ?? "2026-01-10",
          end_date: req.body.end_date ?? "2026-06-10",
          is_active: true,
          created_at: "2025-01-01T00:00:00",
        },
      });
    }).as("updatePeriod");

    cy.visit("/admin/periods");
    cy.wait("@meRequest");
    cy.wait("@listPeriods");
  });

  it("crea periodo con fechas válidas", () => {
    cy.contains("h2", "Crear periodo")
      .closest(".card")
      .within(() => {
        cy.get('input[name="code"]').type("2026A");
        cy.get('input[name="name"]').type("Periodo 2026-A");
        cy.get('input[name="start_date"]').type("2026-01-10");
        cy.get('input[name="end_date"]').type("2026-06-10");
        cy.contains("button", "Crear").click();
      });

    cy.wait("@createPeriod").then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.request.body).to.deep.eq({
        code: "2026A",
        name: "Periodo 2026-A",
        start_date: "2026-01-10",
        end_date: "2026-06-10",
      });
    });

    cy.contains('[role="alert"]', "Periodo creado.").should("be.visible");
  });

  it("actualiza periodo existente", () => {
    cy.contains("h2", "Actualizar periodo")
      .closest(".card")
      .within(() => {
        cy.get('input[name="id"]').type("77");
        cy.get('input[name="name"]').type("Periodo 2026-A Modificado");
        cy.get('input[name="start_date"]').type("2026-01-12");
        cy.get('input[name="end_date"]').type("2026-06-15");
        cy.contains("button", "Actualizar").click();
      });

    cy.wait("@updatePeriod").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.request.body).to.deep.eq({
        name: "Periodo 2026-A Modificado",
        start_date: "2026-01-12",
        end_date: "2026-06-15",
      });
    });

    cy.contains('[role="alert"]', "Periodo actualizado.").should("be.visible");
  });

  it("evita request cuando create tiene datos inválidos", () => {
    cy.contains("h2", "Crear periodo")
      .closest(".card")
      .within(() => {
        cy.get('input[name="code"]').type("A");
        cy.get('input[name="name"]').type("AB");
        cy.contains("button", "Crear").click();
      });

    cy.get("@createPeriod.all").should("have.length", 0);
    cy.get('[role="alert"]').its("length").should("be.gte", 1);
  });
});
