/* eslint-disable @typescript-eslint/no-namespace */

import type User from "../../src/interfaces/User";

type AuthUser = User & {
  permissions: NonNullable<User["permissions"]>;
  role: NonNullable<User["role"]>;
  status: NonNullable<User["status"]>;
};

const defaultAuthUser: AuthUser = {
  id: "user-1",
  firstName: "Test",
  lastName: "Admin",
  email: "test.admin@example.com",
  status: "active",
  role: "admin",
  permissions: ["manage_users", "manage_own", "manage_notes", "manage_own_notes"],
};

Cypress.Commands.add("loginAsAdmin", (overrides: Partial<AuthUser> = {}) => {
  const authUser = { ...defaultAuthUser, ...overrides };

  cy.window().then((window) => {
    window.localStorage.setItem("accessToken", "test-access-token");
    window.localStorage.setItem("tokenType", "bearer");
    window.localStorage.setItem("authUser", JSON.stringify(authUser));
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(overrides?: Partial<AuthUser>): Chainable<void>;
    }
  }
}

export {};
