import { render, screen } from "@testing-library/react";
import App from "../../App";

describe("Auth routes", () => {
  beforeEach(() => {
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
      .withArgs("http://localhost:4000/api/auth/login")
      .resolves(
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
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .withArgs("http://localhost:4000/api/users/")
      .resolves(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .as("loginUser");

    render(<App />);

    cy.findByLabelText("Email").type("jane@example.com");
    cy.findByLabelText("Password").type("VeryStrongPassword123!");
    cy.findByRole("button", { name: "Login" }).click();

    cy.get("@loginUser").should((fetchStub) => {
      const [, options] = fetchStub.firstCall.args;
      expect(options.method).to.equal("POST");
      expect(options.headers).to.deep.equal({
        "Content-Type": "application/json",
      });
      expect(JSON.parse(options.body)).to.deep.equal({
        email: "jane@example.com",
        password: "VeryStrongPassword123!",
      });
    });
    cy.wrap(localStorage.getItem("accessToken")).should(
      "equal",
      "fake-access-token",
    );
    cy.wrap(localStorage.getItem("tokenType")).should("equal", "bearer");
    cy.wrap(JSON.parse(localStorage.getItem("authUser") || "{}")).should(
      "deep.equal",
      {
        id: "64f1f77bcf86cd7994390111",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
      },
    );
    cy.location("pathname").should("equal", "/users");
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
    expect(screen.getByLabelText("Hide sidebar")).to.not.equal(null);
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
              isEmailActivated: false,
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
