describe("App", () => {
  it("redirects the root route to the login page", () => {
    cy.visit("/");

    cy.location("pathname").should("eq", "/login");
    cy.contains("h1", "Login").should("be.visible");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
  });

  it("shows validation feedback when login fails", () => {
    cy.intercept("POST", "http://localhost:4000/api/auth/login", {
      statusCode: 401,
      body: { detail: "Invalid email or password" },
    }).as("login");

    cy.visit("/login");
    cy.get('input[name="email"]').type("user@example.com");
    cy.get('input[name="password"]').type("incorrect-password");
    cy.contains("button", "Login").click();

    cy.wait("@login");
    cy.get('[role="alert"]').should("contain.text", "Invalid email or password");
  });

  it("renders an authenticated page from a stored session", () => {
    cy.visit("/login");
    cy.loginAsAdmin();
    cy.visit("/home");

    cy.contains("h1", "Home Page").should("be.visible");
    cy.contains("a", "Users").should("be.visible");
    cy.contains("a", "Notes").should("be.visible");
    cy.contains("a", "My Notes").should("be.visible");
  });
});
