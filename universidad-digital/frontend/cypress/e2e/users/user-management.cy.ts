describe("Usuarios — Gestión básica", () => {
  beforeEach(() => {
    cy.mockAuthApi({ initialMeUnauthorized: false });

    cy.intercept(
      { method: "GET", pathname: "/roles" },
      {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: "Administrador",
            description: "Admin",
            created_at: "2025-01-01T00:00:00",
          },
          {
            id: 2,
            name: "Docente",
            description: "Teacher",
            created_at: "2025-01-01T00:00:00",
          },
        ],
      },
    ).as("listRoles");

    cy.intercept({ method: "POST", pathname: "/users" }, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 101,
          email: req.body.email,
          full_name: req.body.full_name,
          is_active: true,
          created_at: "2025-01-01T00:00:00",
          roles: ["Docente"],
        },
      });
    }).as("createUser");

    cy.intercept({ method: "PUT", pathname: "/users/*" }, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 101,
          email: "docente@uni.com",
          full_name: req.body.full_name ?? "Docente Actualizado",
          is_active: req.body.is_active ?? true,
          created_at: "2025-01-01T00:00:00",
          roles: ["Docente"],
        },
      });
    }).as("updateUser");

    cy.visit("/admin/users");
    cy.wait("@meRequest");
    cy.wait("@listRoles");
  });

  it("crea usuario y muestra alerta de éxito", () => {
    cy.contains("h2", "Crear usuario")
      .closest(".card")
      .within(() => {
        cy.get('input[name="email"]').type("docente@uni.com");
        cy.get('input[name="full_name"]').type("Docente QA");
        cy.get('input[name="password"]').type("Password123");
        cy.get('select[name="role_id"]').select("2");
        cy.contains("button", "Crear").click();
      });

    cy.wait("@createUser").then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.request.body).to.deep.include({
        email: "docente@uni.com",
        full_name: "Docente QA",
      });
      expect(interception.request.body.role_ids).to.deep.eq([2]);
    });

    cy.contains('[role="alert"]', "Usuario creado correctamente.").should(
      "be.visible",
    );
  });

  it("actualiza usuario y envía payload esperado", () => {
    cy.contains("h2", "Actualizar usuario")
      .closest(".card")
      .within(() => {
        cy.get('input[name="id"]').type("101");
        cy.get('input[name="full_name"]').type("Docente QA Editado");
        cy.get('select[name="is_active"]').select("false");
        cy.contains("button", "Actualizar").click();
      });

    cy.wait("@updateUser").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.request.body).to.deep.eq({
        full_name: "Docente QA Editado",
        is_active: false,
      });
    });

    cy.contains('[role="alert"]', "Usuario actualizado correctamente.").should(
      "be.visible",
    );
  });

  it("valida formulario de creación y evita request inválido", () => {
    cy.contains("h2", "Crear usuario")
      .closest(".card")
      .as("createUserCard")
      .within(() => {
        cy.get('input[name="email"]').type("valido@uni.com");
        cy.get('input[name="full_name"]').type("A");
        cy.get('input[name="password"]').type("123");
        cy.contains("button", "Crear").click();
      });

    cy.get("@createUser.all").should("have.length", 0);

    cy.get("@createUserCard").within(() => {
      cy.get('input[name="full_name"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
      cy.get('input[name="password"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
      cy.get('select[name="role_id"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
    });
  });
});
