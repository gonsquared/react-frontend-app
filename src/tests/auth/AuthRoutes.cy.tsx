import { render, screen } from "@testing-library/react";
import App from "../../App";

describe("Auth routes", () => {
  beforeEach(() => {
    cy.viewport(1000, 660);
    localStorage.clear();
  });

  it("uses the login page as the landing page", () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Login" })).to.not.equal(null);
  });

  it("renders the login page at /login", () => {
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Login" })).to.not.equal(null);
    expect(screen.getByLabelText("Email")).to.not.equal(null);
    expect(screen.getByLabelText("Password")).to.not.equal(null);
    expect(screen.getByRole("button", { name: "Login" })).to.not.equal(null);
    expect(screen.queryByRole("link", { name: "Users" })).to.equal(null);
    expect(screen.queryByLabelText("Hide sidebar")).to.equal(null);
    expect(screen.getByRole("link", { name: "Sign up" })).to.have.attr(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Forgot password?" })).to.have.attr(
      "href",
      "#",
    );
  });

  it("logs in a user, stores the session, and opens users", () => {
    window.history.pushState({}, "", "/login");

    cy.stub(window, "fetch")
      .callsFake((input) => {
        const url = String(input);

        if (url === "http://localhost:4000/api/auth/login") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                accessToken: "fake-access-token",
                tokenType: "bearer",
                expiresIn: 3600,
                user: {
                  id: "64f1f77bcf86cd7994390111",
                  firstName: "Jane",
                  lastName: "Doe",
                  email: "jane@example.com",
                  status: "active",
                  role: "admin",
                  permissions: [
                    "manage_users",
                    "manage_own",
                    "manage_notes",
                    "manage_own_notes",
                  ],
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        if (url === "http://localhost:4000/api/users/") {
          return Promise.resolve(
            new Response(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        return Promise.reject(new Error(`Unexpected fetch to ${url}`));
      })
      .as("fetch");

    render(<App />);

    cy.findByLabelText("Email").type("jane@example.com");
    cy.findByLabelText("Password").type("VeryStrongPassword123!");
    cy.findByRole("button", { name: "Login" }).click();

    cy.get("@fetch").should((fetchStub) => {
      const loginCall = fetchStub
        .getCalls()
        .find(
          (call) => call.args[0] === "http://localhost:4000/api/auth/login",
        );
      expect(loginCall).to.not.equal(undefined);

      const [, options] = loginCall!.args;
      expect(options.method).to.equal("POST");
      expect(options.headers).to.deep.equal({
        "Content-Type": "application/json",
      });
      expect(JSON.parse(options.body)).to.deep.equal({
        email: "jane@example.com",
        password: "VeryStrongPassword123!",
      });
    });
    cy.location("pathname").should("equal", "/users");
    cy.wrap(null).should(() => {
      expect(localStorage.getItem("accessToken")).to.equal("fake-access-token");
      expect(localStorage.getItem("tokenType")).to.equal("bearer");
      expect(JSON.parse(localStorage.getItem("authUser") || "{}")).to.deep.equal({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      });
    });
  });

  it("shows invalid credential errors on the login form", () => {
    window.history.pushState({}, "", "/login");

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/auth/login")
      .resolves(
        new Response(JSON.stringify({ detail: "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<App />);

    cy.findByLabelText("Email").type("jane@example.com");
    cy.findByLabelText("Password").type("WrongPassword123!");
    cy.findByRole("button", { name: "Login" }).click();

    cy.findByRole("alert").should(
      "contain.text",
      "Invalid email or password",
    );
    cy.findByLabelText("Email").should("have.attr", "aria-invalid", "true");
    cy.findByLabelText("Password").should("have.attr", "aria-invalid", "true");
  });

  it("renders the user registration page at /register", () => {
    window.history.pushState({}, "", "/register");

    render(<App />);

    expect(screen.getByRole("heading", { name: "User Registration" })).to.not
      .equal(null);
    expect(screen.getByLabelText("First name")).to.not.equal(null);
    expect(screen.getByLabelText("Last name")).to.not.equal(null);
    expect(screen.getByLabelText("Email address")).to.not.equal(null);
    expect(screen.getByLabelText("Password")).to.not.equal(null);
    expect(screen.getByLabelText("Verify password")).to.not.equal(null);
    expect(screen.getByRole("button", { name: "Submit" })).to.not.equal(null);
    expect(screen.queryByRole("link", { name: "Users" })).to.equal(null);
    expect(screen.queryByLabelText("Hide sidebar")).to.equal(null);
    expect(screen.getByRole("link", { name: "Back" })).to.have.attr(
      "href",
      "/login",
    );
  });

  it("redirects users to login when they open users without a session", () => {
    window.history.pushState({}, "", "/users");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Login" })).to.not.equal(null);
    expect(screen.queryByRole("link", { name: "Users" })).to.equal(null);
    expect(screen.queryByLabelText("Hide sidebar")).to.equal(null);
  });

  it("clears an incomplete session and redirects to login", () => {
    window.history.pushState({}, "", "/users");
    localStorage.setItem("tokenType", "bearer");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      }),
    );

    render(<App />);

    cy.location("pathname").should("equal", "/login");
    cy.wrap(null).should(() => {
      expect(localStorage.getItem("accessToken")).to.equal(null);
      expect(localStorage.getItem("tokenType")).to.equal(null);
      expect(localStorage.getItem("authUser")).to.equal(null);
    });
  });

  it("logs out and redirects to login when an authorized request returns unauthorized", () => {
    window.history.pushState({}, "", "/users");
    localStorage.setItem("accessToken", "expired-access-token");
    localStorage.setItem("tokenType", "bearer");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      }),
    );

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify({ detail: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<App />);

    cy.findByRole("heading", { name: "Login" }).should("exist");
    cy.location("pathname").should("equal", "/login");
    cy.wrap(null).should(() => {
      expect(localStorage.getItem("accessToken")).to.equal(null);
      expect(localStorage.getItem("tokenType")).to.equal(null);
      expect(localStorage.getItem("authUser")).to.equal(null);
    });
  });

  it("shows the sidebar when users opens with a stored session", () => {
    window.history.pushState({}, "", "/users");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      }),
    );

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<App />);

    expect(screen.getByRole("link", { name: "Users" })).to.not.equal(null);
    expect(screen.getByRole("link", { name: "Notes" })).to.have.attr(
      "href",
      "/notes",
    );
    expect(screen.getByRole("button", { name: "Jane account menu" })).to.not
      .equal(null);
    expect(screen.queryByRole("link", { name: "Profile" })).to.equal(null);
    cy.findByRole("button", { name: "Jane account menu" }).click();
    cy.findByRole("button", { name: "Jane account menu" }).then(
      ([accountMenuButton]) => {
        cy.findByRole("link", { name: "Profile" }).then(([profileLink]) => {
          expect(
            accountMenuButton.compareDocumentPosition(profileLink) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ).to.not.equal(0);
        });
      },
    );
    cy.findByRole("link", { name: "Profile" }).should(
      "have.attr",
      "href",
      "/profile",
    );
    cy.findByRole("link", { name: "Logout" }).should(
      "have.attr",
      "href",
      "/login",
    );
    cy.findByRole("button", { name: "Toggle light and dark theme" }).should(
      "exist",
    );
    cy.findByRole("heading", { name: "Users" }).click();
    cy.findByRole("link", { name: "Profile" }).should("not.exist");
    expect(screen.getByLabelText("Hide sidebar")).to.not.equal(null);
  });

  it("hides the users sidebar link for a regular user session", () => {
    window.history.pushState({}, "", "/home");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own", "manage_own_notes"],
      }),
    );

    render(<App />);

    expect(screen.queryByRole("link", { name: "Users" })).to.equal(null);
    expect(screen.queryByRole("link", { name: "Notes" })).to.equal(null);
    expect(screen.getByRole("link", { name: "My Notes" })).to.have.attr(
      "href",
      "/my-notes",
    );
    expect(screen.getByRole("button", { name: "Jane account menu" })).to.not
      .equal(null);
    expect(screen.queryByRole("link", { name: "Profile" })).to.equal(null);
    expect(screen.getByLabelText("Hide sidebar")).to.not.equal(null);
  });

  it("shows notes only when the session has manage notes permission", () => {
    window.history.pushState({}, "", "/home");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: ["manage_users", "manage_own", "manage_own_notes"],
      }),
    );

    render(<App />);

    expect(screen.getByRole("link", { name: "Users" })).to.not.equal(null);
    expect(screen.queryByRole("link", { name: "Notes" })).to.equal(null);
    expect(screen.getByRole("link", { name: "My Notes" })).to.have.attr(
      "href",
      "/my-notes",
    );
  });

  it("hides my notes when the session lacks manage own notes permission", () => {
    window.history.pushState({}, "", "/home");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own"],
      }),
    );

    render(<App />);

    expect(screen.queryByRole("link", { name: "My Notes" })).to.equal(null);
  });

  it("renders my notes for users with manage own notes permission", () => {
    window.history.pushState({}, "", "/my-notes");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own", "manage_own_notes"],
      }),
    );

    cy.stub(window, "fetch")
      .withArgs(
        "http://localhost:4000/api/notes/by-user/64f1f77bcf86cd7994390111",
      )
      .resolves(
        new Response(
          JSON.stringify([
            {
              id: "note-1",
              title: "Release checklist",
              contents: "Ship the notes list",
              status: "published",
              user: "64f1f77bcf86cd7994390111",
              createdAt: "2026-05-24T10:00:00Z",
              updatedAt: "2026-05-25T11:30:00Z",
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .as("fetchMyNotes");

    render(<App />);

    cy.findByRole("heading", { name: "My Notes" }).should("exist");
    cy.get("@fetchMyNotes").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.headers).to.deep.equal({
        Authorization: "Bearer fake-access-token",
      });
    });
    cy.findByRole("columnheader", { name: "Title" }).should("exist");
    cy.findByRole("columnheader", { name: "Date" }).should("exist");
    cy.findByRole("columnheader", { name: "Status" }).should("exist");
    cy.findByRole("cell", { name: "Release checklist" }).should("exist");
    cy.findByRole("cell", { name: "Published" }).should("exist");
    cy.findByRole("link", { name: "Add note" }).should(
      "have.attr",
      "href",
      "/my-notes/new",
    );
    cy.findByRole("row", { name: /Release checklist/i }).click();
    cy.location("pathname").should("equal", "/my-notes/note-1");
  });

  it("creates a draft note from the my notes form", () => {
    window.history.pushState({}, "", "/my-notes/new");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own", "manage_own_notes"],
      }),
    );

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/notes/")
      .resolves(
        new Response(
          JSON.stringify({
            id: "note-2",
            title: "Draft idea",
            contents: "<p>Draft body</p>",
            status: "not published",
            user: "64f1f77bcf86cd7994390111",
            createdAt: "2026-05-24T10:00:00Z",
            updatedAt: "2026-05-25T11:30:00Z",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .as("createDraftNote");

    render(<App />);

    cy.findByRole("heading", { name: "New Note" }).should("exist");
    cy.findByLabelText("Title").type("Draft idea");
    cy.findByLabelText("Contents").type("Draft body");
    cy.findByRole("button", { name: "Save as draft" }).click();

    cy.get("@createDraftNote").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal("POST");
      expect(options.headers).to.deep.equal({
        "Content-Type": "application/json",
        Authorization: "Bearer fake-access-token",
      });
      expect(JSON.parse(options.body)).to.deep.equal({
        title: "Draft idea",
        contents: "Draft body",
        status: "not published",
      });
    });
    cy.location("pathname").should("equal", "/my-notes");
  });

  it("uses a modal confirmation before publishing a new note", () => {
    window.history.pushState({}, "", "/my-notes/new");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own", "manage_own_notes"],
      }),
    );
    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/notes/")
      .resolves(
        new Response(
          JSON.stringify({
            id: "note-3",
            title: "Published idea",
            contents: "<strong>Published body</strong>",
            status: "published",
            user: "64f1f77bcf86cd7994390111",
            createdAt: "2026-05-24T10:00:00Z",
            updatedAt: "2026-05-25T11:30:00Z",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .as("createPublishedNote");

    render(<App />);

    cy.findByLabelText("Title").type("Published idea");
    cy.findByLabelText("Contents").type("Published body");
    cy.findByRole("button", { name: "Save" }).click();

    cy.findByRole("dialog", { name: "Publish note?" }).should("exist");
    cy.findByText("This will make the note visible as published.").should(
      "exist",
    );
    cy.findByRole("button", { name: "Cancel" }).click();
    cy.findByRole("dialog", { name: "Publish note?" }).should("not.exist");
    cy.get("@createPublishedNote").should("not.have.been.called");

    cy.findByRole("button", { name: "Save" }).click();
    cy.findByRole("dialog", { name: "Publish note?" }).should("exist");
    cy.findByRole("button", { name: "Publish" }).click();

    cy.get("@createPublishedNote").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal("POST");
      expect(JSON.parse(options.body)).to.deep.equal({
        title: "Published idea",
        contents: "Published body",
        status: "published",
      });
    });
  });

  it("loads and updates an existing my note", () => {
    window.history.pushState({}, "", "/my-notes/note-1");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own", "manage_own_notes"],
      }),
    );
    cy.stub(window, "fetch")
      .callsFake((input) => {
        const url = String(input);

        if (url === "http://localhost:4000/api/notes/note-1") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: "note-1",
                title: "Release checklist",
                contents: "<p>Ship the notes form</p>",
                status: "not published",
                user: "64f1f77bcf86cd7994390111",
                createdAt: "2026-05-24T10:00:00Z",
                updatedAt: "2026-05-25T11:30:00Z",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return Promise.reject(new Error(`Unexpected fetch to ${url}`));
      })
      .as("noteRequests");

    render(<App />);

    cy.findByRole("heading", { name: "Edit Note" }).should("exist");
    cy.findByLabelText("Title").should("have.value", "Release checklist");
    cy.findByLabelText("Contents").should("contain.text", "Ship the notes form");
    cy.findByLabelText("Title").clear().type("Release checklist updated");
    cy.findByRole("button", { name: "Save" }).click();
    cy.findByRole("dialog", { name: "Publish note?" }).should("exist");
    cy.findByRole("button", { name: "Publish" }).click();

    cy.get("@noteRequests").should((fetchStub) => {
      const updateCall = fetchStub
        .getCalls()
        .find((call) => call.args[1]?.method === "PUT");
      expect(updateCall).to.not.equal(undefined);
      const [, options] = updateCall!.args;
      expect(options.headers).to.deep.equal({
        "Content-Type": "application/json",
        Authorization: "Bearer fake-access-token",
      });
      expect(JSON.parse(options.body)).to.deep.equal({
        title: "Release checklist updated",
        contents: "<p>Ship the notes form</p>",
        status: "published",
      });
    });
    cy.location("pathname").should("equal", "/my-notes");
  });

  it("logs out from the sidebar and redirects to login", () => {
    window.history.pushState({}, "", "/home");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem("tokenType", "bearer");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "user",
        permissions: ["manage_own", "manage_own_notes"],
      }),
    );

    render(<App />);

    cy.findByRole("button", { name: "Jane account menu" }).click();
    cy.findByRole("link", { name: "Logout" }).click();

    cy.location("pathname").should("equal", "/login");
    cy.findByRole("heading", { name: "Login" }).should("exist");
    cy.wrap(null).should(() => {
      expect(localStorage.getItem("accessToken")).to.equal(null);
      expect(localStorage.getItem("tokenType")).to.equal(null);
      expect(localStorage.getItem("authUser")).to.equal(null);
    });
  });

  it("renders the profile page with the stored session user", () => {
    window.history.pushState({}, "", "/profile");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      }),
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Profile" })).to.not.equal(null);
    expect(screen.getByText("Jane Doe")).to.not.equal(null);
    expect(screen.getByText("jane@example.com")).to.not.equal(null);
    expect(screen.getByText("Active")).to.not.equal(null);
    expect(screen.getByText("Admin")).to.not.equal(null);
    expect(screen.getByText("Manage users")).to.not.equal(null);
    expect(screen.getByText("Manage own")).to.not.equal(null);
    expect(screen.getByText("Manage notes")).to.not.equal(null);
    expect(screen.getByText("Manage own notes")).to.not.equal(null);
    cy.findByRole("button", { name: "Update avatar image" }).should("exist");
    cy.findByAltText("Jane Doe avatar")
      .should("have.attr", "width", "64")
      .and("have.attr", "height", "64");
  });

  it("uploads a new avatar from the profile page", () => {
    window.history.pushState({}, "", "/profile");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      }),
    );

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/users/64f1f77bcf86cd7994390111/avatar")
      .resolves(
        new Response(
          JSON.stringify({
            id: "64f1f77bcf86cd7994390111",
            firstName: "Jane",
            lastName: "Doe",
            email: "jane@example.com",
            status: "active",
            role: "admin",
            permissions: [
              "manage_users",
              "manage_own",
              "manage_notes",
              "manage_own_notes",
            ],
            avatarUrl: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .as("updateAvatar");

    render(<App />);

    cy.findByLabelText("Avatar image").selectFile(
      {
        contents: Cypress.Buffer.from("fake-image"),
        fileName: "avatar.png",
        mimeType: "image/png",
      },
      { force: true },
    );

    cy.get("@updateAvatar").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal("PATCH");
      expect(options.headers).to.deep.equal({
        "Content-Type": "application/json",
        Authorization: "Bearer fake-access-token",
      });
      expect(JSON.parse(options.body).avatarUrl).to.match(
        /^data:image\/png;base64,/,
      );
    });
    cy.findByRole("status").should("contain.text", "Avatar updated.");
    cy.wrap(null).should(() => {
      expect(JSON.parse(localStorage.getItem("authUser") || "{}")).to.include({
        avatarUrl: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
      });
    });
  });

  it("renders all notes for admins with manage notes permission", () => {
    window.history.pushState({}, "", "/notes");
    localStorage.setItem("accessToken", "fake-access-token");
    localStorage.setItem(
      "authUser",
      JSON.stringify({
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: "active",
        role: "admin",
        permissions: [
          "manage_users",
          "manage_own",
          "manage_notes",
          "manage_own_notes",
        ],
      }),
    );
    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/notes/")
      .resolves(
        new Response(
          JSON.stringify([
            {
              id: "note-1",
              title: "Admin release note",
              contents: "<p>Ship it</p>",
              status: "published",
              user: "64f1f77bcf86cd7994390111",
              createdAt: "2026-05-24T10:00:00Z",
              updatedAt: "2026-05-25T11:30:00Z",
            },
            {
              id: "note-2",
              title: "Another user's draft",
              contents: "<p>Keep writing</p>",
              status: "not published",
              user: "64f1f77bcf86cd7994390222",
              createdAt: "2026-05-24T10:00:00Z",
              updatedAt: "2026-05-26T11:30:00Z",
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .as("fetchAllNotes");

    render(<App />);

    cy.findByRole("heading", { name: "Notes" }).should("exist");
    cy.get("@fetchAllNotes").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.headers).to.deep.equal({
        Authorization: "Bearer fake-access-token",
      });
    });
    cy.findByRole("columnheader", { name: "Title" }).should("exist");
    cy.findByRole("columnheader", { name: "User" }).should("exist");
    cy.findByRole("columnheader", { name: "Status" }).should("exist");
    cy.findByRole("columnheader", { name: "Date" }).should("exist");
    cy.findByRole("cell", { name: "Admin release note" }).should("exist");
    cy.findByRole("cell", { name: "64f1f77bcf86cd7994390111" }).should(
      "exist",
    );
    cy.findByRole("cell", { name: "Published" }).should("exist");
    cy.findByRole("cell", { name: "Another user's draft" }).should("exist");
    cy.findByRole("cell", { name: "Not Published" }).should("exist");
  });

  it("registers a user and shows the activation email instruction", () => {
    window.history.pushState({}, "", "/register");

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/auth/register")
      .resolves(
        new Response(
          JSON.stringify({
            message:
              "Registration successful. Please check your email to activate your account.",
            user: {
              id: "64f1f77bcf86cd7994390111",
              firstName: "Jane",
              lastName: "Doe",
              email: "jane@example.com",
              status: "inactive",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .as("registerUser");

    render(<App />);

    cy.findByLabelText("First name").type("Jane");
    cy.findByLabelText("Last name").type("Doe");
    cy.findByLabelText("Email address").type("jane@example.com");
    cy.findByLabelText("Password").type("VeryStrongPassword123!");
    cy.findByLabelText("Verify password").type("VeryStrongPassword123!");
    cy.findByRole("button", { name: "Submit" }).click();

    cy.get("@registerUser").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal("POST");
      expect(options.headers).to.deep.equal({
        "Content-Type": "application/json",
      });
      expect(JSON.parse(options.body)).to.deep.equal({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "VeryStrongPassword123!",
        verifyPassword: "VeryStrongPassword123!",
      });
    });
    cy.findByRole("status").should(
      "contain.text",
      "Please check your email to activate your account.",
    );
    cy.location("pathname").should("equal", "/register");
  });

  it("activates an account from the activation link", () => {
    window.history.pushState({}, "", "/activate-account?token=fake-token");

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/auth/activate?token=fake-token")
      .resolves(
        new Response(
          JSON.stringify({ message: "Email address activated successfully" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    render(<App />);

    cy.findByRole("status").should(
      "contain.text",
      "Email address activated successfully",
    );
    cy.findByRole("link", { name: "Login" }).should("have.attr", "href", "/login");
  });

  it("shows a backend registration error", () => {
    window.history.pushState({}, "", "/register");

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/auth/register")
      .resolves(
        new Response(JSON.stringify({ detail: "Email already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<App />);

    cy.findByLabelText("First name").type("Jane");
    cy.findByLabelText("Last name").type("Doe");
    cy.findByLabelText("Email address").type("jane@example.com");
    cy.findByLabelText("Password").type("VeryStrongPassword123!");
    cy.findByLabelText("Verify password").type("VeryStrongPassword123!");
    cy.findByRole("button", { name: "Submit" }).click();

    cy.findByRole("alert").should("contain.text", "Email already exists");
    cy.findByLabelText("Email address").should(
      "have.attr",
      "aria-invalid",
      "true",
    );
  });

  it("shows backend validation errors in a readable format", () => {
    window.history.pushState({}, "", "/register");

    cy.stub(window, "fetch")
      .withArgs("http://localhost:4000/api/auth/register")
      .resolves(
        new Response(
          JSON.stringify({
            detail: [
              {
                loc: ["body", "password"],
                msg: "String should have at least 12 characters",
              },
            ],
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    render(<App />);

    cy.findByLabelText("First name").type("Jane");
    cy.findByLabelText("Last name").type("Doe");
    cy.findByLabelText("Email address").type("jane@example.com");
    cy.findByLabelText("Password").type("VeryStrongPassword123!");
    cy.findByLabelText("Verify password").type("VeryStrongPassword123!");
    cy.findByRole("button", { name: "Submit" }).click();

    cy.findByRole("alert").should(
      "contain.text",
      "Password: String should have at least 12 characters",
    );
    cy.findByLabelText("Password").should(
      "have.attr",
      "aria-invalid",
      "true",
    );
  });
});
