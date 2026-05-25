import { render, screen } from "@testing-library/react";
import App from "../../App";

describe("Auth routes", () => {
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
    expect(screen.getByRole("link", { name: "Sign up" })).to.have.attr(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Forgot password?" })).to.have.attr(
      "href",
      "#",
    );
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
    expect(screen.getByRole("link", { name: "Back" })).to.have.attr(
      "href",
      "/login",
    );
  });
});
