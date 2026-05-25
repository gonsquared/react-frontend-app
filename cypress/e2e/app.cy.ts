const users = [
  {
    id: "1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
  },
  {
    id: "2",
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
  },
];

describe("App", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:4000/api/users/", users).as(
      "getUsers",
    );
  });

  it("navigates from the home page to the users table", () => {
    cy.visit("/");

    cy.findByRole("heading", { name: "Home Page" }).should("be.visible");
    cy.findByRole("link", { name: "Users" }).click();
    cy.wait("@getUsers");

    cy.findByRole("heading", { name: "Users" }).should("be.visible");
    cy.findByRole("cell", { name: "Ada" }).should("be.visible");
    cy.findByRole("cell", { name: "grace@example.com" }).should("be.visible");
  });

  it("hides the sidebar and toggles the theme", () => {
    cy.visit("/");

    cy.findByRole("button", { name: "Hide sidebar" }).click();
    cy.findByRole("button", { name: "Show sidebar" }).should("be.visible");
    cy.findByRole("button", { name: "Show sidebar" }).click();

    cy.findByRole("button", { name: "Toggle light and dark theme" })
      .should("have.attr", "aria-pressed", "false")
      .click()
      .should("have.attr", "aria-pressed", "true");
  });

  it("adds a user through the modal", () => {
    const newUser = {
      id: "3",
      firstName: "Katherine",
      lastName: "Johnson",
      email: "katherine@example.com",
    };

    cy.intercept("POST", "http://localhost:4000/api/users/", {
      statusCode: 201,
      body: newUser,
    }).as("createUser");

    cy.visit("/users");
    cy.wait("@getUsers");
    cy.findByRole("button", { name: "Add user" }).click();
    cy.findByLabelText("First Name").type(newUser.firstName);
    cy.findByLabelText("Last Name").type(newUser.lastName);
    cy.findByLabelText("Email").type(newUser.email);
    cy.findByRole("button", { name: "Save" }).click();
    cy.wait("@createUser");

    cy.findByRole("cell", { name: newUser.firstName }).should("be.visible");
    cy.findByRole("cell", { name: newUser.email }).should("be.visible");
  });
});
