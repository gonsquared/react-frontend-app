import { render, screen } from "@testing-library/react";
import UsersPage from "../../pages/users/UsersPage";

describe("UsersPage", () => {
  it("renders users returned by the API", async () => {
    const users = [
      {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      },
    ];

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify(users), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .as("fetchUsers");

    render(<UsersPage />);

    expect(screen.getByText("Loading users...")).to.not.equal(null);
    expect(await screen.findByText("Ada")).to.not.equal(null);
    expect(await screen.findByText("Lovelace")).to.not.equal(null);
    expect(await screen.findByText("ada@example.com")).to.not.equal(null);
    cy.get("@fetchUsers").should(
      "have.been.calledWith",
      "http://localhost:4000/api/users/",
    );
  });

  it("shows a success toast after creating a user", () => {
    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .onFirstCall()
      .resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .onSecondCall()
      .resolves(
        new Response(
          JSON.stringify({
            id: "2",
            firstName: "Grace",
            lastName: "Hopper",
            email: "grace@example.com",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    render(<UsersPage />);

    cy.findByLabelText("Add user").click();
    cy.findByLabelText("First Name").type("Grace");
    cy.findByLabelText("Last Name").type("Hopper");
    cy.findByLabelText("Email").type("grace@example.com");
    cy.findByRole("button", { name: "Save" }).click();

    cy.findByRole("status").should(
      "contain.text",
      "User created successfully.",
    );
    cy.findByText("Grace").should("exist");
  });

  it("shows a success toast after updating a user", () => {
    const users = [
      {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      },
    ];

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify(users), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .withArgs("http://localhost:4000/api/users/1")
      .resolves(
        new Response(
          JSON.stringify({
            id: "1",
            firstName: "Ada",
            lastName: "Byron",
            email: "ada@example.com",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    render(<UsersPage />);

    cy.findByText("Ada").click();
    cy.findByRole("button", { name: "Edit user" }).click();
    cy.findByLabelText("Last Name").clear().type("Byron");
    cy.findByRole("button", { name: "Save" }).click();

    cy.findByRole("status").should(
      "contain.text",
      "User updated successfully.",
    );
    cy.findByText("Byron").should("exist");
  });

  it("shows an error toast when saving a user fails", () => {
    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .onFirstCall()
      .resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .onSecondCall()
      .resolves(
        new Response(JSON.stringify({ detail: "Email is already used" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<UsersPage />);

    cy.findByLabelText("Add user").click();
    cy.findByLabelText("First Name").type("Grace");
    cy.findByLabelText("Last Name").type("Hopper");
    cy.findByLabelText("Email").type("grace@example.com");
    cy.findByRole("button", { name: "Save" }).click();

    cy.findAllByRole("alert").should("have.length", 1);
    cy.findByRole("alert")
      .should("contain.text", "Email is already used")
      .and("have.css", "position", "fixed");
  });
});
