import { render, screen } from "@testing-library/react";
import UsersPage from "../../pages/users/UsersPage";

const setStoredSession = (role: "admin" | "user" = "admin") => {
  localStorage.setItem("accessToken", "fake-access-token");
  localStorage.setItem(
    "authUser",
    JSON.stringify({
      id: "1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      status: "active",
      role,
      permissions:
        role === "admin"
          ? ["manage_users", "manage_own", "manage_notes", "manage_own_notes"]
          : ["manage_own", "manage_own_notes"],
    }),
  );
};

describe("UsersPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders users returned by the API", async () => {
    setStoredSession("admin");
    const users = [
      {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        status: "active",
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
    expect(await screen.findByText("Active")).to.not.equal(null);
    cy.get("@fetchUsers").should(
      "have.been.calledWith",
      "http://localhost:4000/api/users/",
    );
  });

  it("sends the stored bearer token when fetching users", () => {
    setStoredSession("admin");
    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .as("fetchUsers");

    render(<UsersPage />);

    cy.get("@fetchUsers").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.headers).to.deep.equal({
        Authorization: "Bearer fake-access-token",
      });
    });
  });

  it("hides add user controls for regular users", () => {
    setStoredSession("user");
    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(
          JSON.stringify([
            {
              id: "1",
              firstName: "Ada",
              lastName: "Lovelace",
              email: "ada@example.com",
              status: "active",
              role: "user",
              permissions: ["manage_own", "manage_own_notes"],
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    render(<UsersPage />);

    cy.findByText("Ada").should("exist");
    cy.findByLabelText("Add user").should("not.exist");
  });

  it("renders legacy users without a status as inactive", async () => {
    setStoredSession("admin");
    const users = [
      {
        id: "1",
        firstName: "Legacy",
        lastName: "User",
        email: "legacy@example.com",
      },
    ];

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify(users), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<UsersPage />);

    expect(await screen.findByText("Legacy")).to.not.equal(null);
    expect(await screen.findByText("Inactive")).to.not.equal(null);
  });

  it("shows a success toast after creating a user", () => {
    setStoredSession("admin");
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
            status: "inactive",
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
    cy.findByText("Inactive").should("exist");
  });

  it("shows a success toast after updating a user", () => {
    setStoredSession("admin");
    const users = [
      {
        id: "1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        status: "active",
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
            status: "active",
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
    setStoredSession("admin");
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
    cy.findByLabelText("Email").should("have.attr", "aria-invalid", "true");
    cy.findByLabelText("Email").should(
      "have.css",
      "border-color",
      "rgb(198, 40, 40)",
    );
  });

  it("clears an errored field highlight when the field changes", () => {
    setStoredSession("admin");
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
        new Response(JSON.stringify({ detail: "Email already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<UsersPage />);

    cy.findByLabelText("Add user").click();
    cy.findByLabelText("First Name").type("Grace");
    cy.findByLabelText("Last Name").type("Hopper");
    cy.findByLabelText("Email").type("grace@example.com");
    cy.findByRole("button", { name: "Save" }).click();

    cy.findByLabelText("Email").should("have.attr", "aria-invalid", "true");
    cy.findByLabelText("Email").clear().type("new@example.com");

    cy.findByLabelText("Email").should("not.have.attr", "aria-invalid");
  });
});
