import { render, screen } from "@testing-library/react";
import UsersPage from "./UsersPage";

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
});
