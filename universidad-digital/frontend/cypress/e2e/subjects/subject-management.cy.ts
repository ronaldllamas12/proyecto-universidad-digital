describe("Materias — Gestión básica", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });

    cy.intercept({ method: "POST", pathname: "/subjects" }, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 55,
          code: req.body.code,
          name: req.body.name,
          credits: req.body.credits,
          is_active: true,
          created_at: "2025-01-01T00:00:00",
        },
      });
    }).as("createSubject");

    cy.intercept({ method: "PUT", pathname: "/subjects/*" }, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 55,
          code: "MAT101",
          name: req.body.name ?? "Álgebra",
          credits: req.body.credits ?? 4,
          is_active: true,
          created_at: "2025-01-01T00:00:00",
        },
      });
    }).as("updateSubject");

    cy.visit("/admin/subjects");
    cy.wait("@meRequest");
  });

  it("crea materia con payload válido", () => {
    cy.contains("h2", "Crear materia")
      .closest(".card")
      .within(() => {
        cy.get('input[name="code"]').type("MAT101");
        cy.get('input[name="name"]').type("Álgebra Lineal");
        cy.get('input[name="credits"]').clear().type("4");
        cy.contains("button", "Crear").click();
      });

    cy.wait("@createSubject").then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.request.body).to.deep.eq({
        code: "MAT101",
        name: "Álgebra Lineal",
        credits: 4,
      });
    });

    cy.contains('[role="alert"]', "Materia creada.").should("be.visible");
  });

  it("actualiza materia existente", () => {
    cy.contains("h2", "Actualizar materia")
      .closest(".card")
      .within(() => {
        cy.get('input[name="id"]').type("55");
        cy.get('input[name="name"]').type("Álgebra Avanzada");
        cy.get('input[name="credits"]').clear().type("5");
        cy.contains("button", "Actualizar").click();
      });

    cy.wait("@updateSubject").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.request.body).to.deep.eq({
        name: "Álgebra Avanzada",
        credits: 5,
      });
    });

    cy.contains('[role="alert"]', "Materia actualizada.").should("be.visible");
  });

  it("muestra error de validación y no llama API en create inválido", () => {
    cy.contains("h2", "Crear materia")
      .closest(".card")
      .within(() => {
        cy.get('input[name="code"]').type("A");
        cy.get('input[name="name"]').type("AB");
        cy.get('input[name="credits"]').clear().type("0");
        cy.contains("button", "Crear").click();
      });

    cy.get("@createSubject.all").should("have.length", 0);
    cy.get('[role="alert"]').its("length").should("be.gte", 1);
  });
});
