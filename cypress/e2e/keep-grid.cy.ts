const sampleNote = {
  id: "note-1",
  title: "test",
  contents: "<p>test</p>",
  color: null,
  isPinned: true,
  labels: [],
  noteType: "text",
  checklistItems: [],
  reminderAt: null,
  imagePath: null,
  user: "user-1",
  userName: "Test Admin",
  createdAt: "2026-05-28T10:00:00.000Z",
  updatedAt: "2026-05-28T10:00:00.000Z",
};

describe("Keep grid", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:4000/api/notes/by-user/user-1", [
      sampleNote,
    ]).as("notes");
    cy.intercept("GET", "http://localhost:4000/api/labels/", []);
  });

  it("keeps note controls visible and stable in dark mode", () => {
    cy.visit("/login");
    cy.loginAsAdmin();
    cy.window().then((window) => {
      window.localStorage.setItem("theme", "dark");
    });

    cy.visit("/my-notes");
    cy.wait("@notes");

    cy.get('input[aria-label="Search notes"]')
      .should("be.visible")
      .and("have.css", "color", "rgb(242, 242, 242)");

    cy.contains('[role="button"]', "Take a note")
      .should("be.visible")
      .and("have.css", "color", "rgb(242, 242, 242)")
      .then(($creator) => {
        expect($creator[0].getBoundingClientRect().height).to.be.greaterThan(
          55,
        );
      });

    cy.contains('[role="button"]', "test").as("noteCard").trigger("mouseover");
    cy.get("@noteCard").within(() => {
      cy.get('button[aria-label="Unpin note"]')
        .should("be.visible")
        .find("svg")
        .should("exist");
      cy.get('button[aria-label="Delete note"]')
        .should("be.visible")
        .find("svg")
        .should("exist");
      cy.get("button").each(($button) => {
        const rect = $button[0].getBoundingClientRect();
        expect(rect.width).to.be.at.least(32);
        expect(rect.height).to.be.at.least(32);
      });
    });
  });
});
