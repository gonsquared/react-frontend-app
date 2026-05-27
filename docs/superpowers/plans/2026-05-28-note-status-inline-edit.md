# Note Status Inline Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pencil icon button beside the status badge in the admin Notes page modal so an admin can update a note's status inline without closing the modal.

**Architecture:** All changes are self-contained in `NotesPage.tsx` and its SCSS module. Four local state variables control edit mode, the pending value, in-flight state, and error display. The existing `PUT /api/notes/{id}` endpoint handles the update. On success, both `selectedNote` and the `notes` array are updated locally so the table row badge reflects the change immediately without a refetch.

**Tech Stack:** React (useState, useCallback), TypeScript, CSS Modules (SCSS), Cypress (e2e tests)

---

### Task 1: Write failing Cypress tests

**Files:**
- Modify: `cypress/e2e/app.cy.ts`

- [ ] **Step 1: Add notes fixture data and a new describe block**

Append the following to the bottom of `cypress/e2e/app.cy.ts` (after the closing `}` of the existing `describe("App", ...)` block):

```typescript
const notes = [
  {
    id: "note1",
    title: "My First Note",
    contents: "<p>Hello world</p>",
    status: "published",
    user: "user1",
    userName: "Ada Lovelace",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "note2",
    title: "Draft Note",
    contents: "<p>Draft content</p>",
    status: "not published",
    user: "user2",
    userName: "Grace Hopper",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
  },
];

describe("Notes page (admin)", () => {
  beforeEach(() => {
    cy.intercept("GET", "http://localhost:4000/api/notes/", notes).as(
      "getNotes",
    );
  });

  it("shows a pencil button beside the status badge in the note modal", () => {
    visitAuthorized("/notes");
    cy.wait("@getNotes");

    cy.findByRole("row", { name: "View note: My First Note" }).click();
    cy.findByRole("dialog").within(() => {
      cy.findByText("Published").should("be.visible");
      cy.findByRole("button", { name: "Edit status" }).should("be.visible");
    });
  });

  it("switches status badge to a select with save and cancel when pencil is clicked", () => {
    visitAuthorized("/notes");
    cy.wait("@getNotes");

    cy.findByRole("row", { name: "View note: My First Note" }).click();
    cy.findByRole("dialog").within(() => {
      cy.findByRole("button", { name: "Edit status" }).click();
      cy.findByRole("combobox", { name: "Note status" }).should(
        "have.value",
        "published",
      );
      cy.findByRole("button", { name: "Save status" }).should("be.visible");
      cy.findByRole("button", { name: "Cancel editing status" }).should(
        "be.visible",
      );
      cy.findByText("Published").should("not.exist");
      cy.findByRole("button", { name: "Edit status" }).should("not.exist");
    });
  });

  it("cancels editing and restores the status badge", () => {
    visitAuthorized("/notes");
    cy.wait("@getNotes");

    cy.findByRole("row", { name: "View note: My First Note" }).click();
    cy.findByRole("dialog").within(() => {
      cy.findByRole("button", { name: "Edit status" }).click();
      cy.findByRole("button", { name: "Cancel editing status" }).click();
      cy.findByText("Published").should("be.visible");
      cy.findByRole("button", { name: "Edit status" }).should("be.visible");
    });
  });

  it("saves a new status and updates the badge in the modal and table row", () => {
    cy.intercept("PUT", "http://localhost:4000/api/notes/note1", {
      statusCode: 200,
      body: { ...notes[0], status: "archived" },
    }).as("updateStatus");

    visitAuthorized("/notes");
    cy.wait("@getNotes");

    cy.findByRole("row", { name: "View note: My First Note" }).click();
    cy.findByRole("dialog").within(() => {
      cy.findByRole("button", { name: "Edit status" }).click();
      cy.findByRole("combobox", { name: "Note status" }).select("archived");
      cy.findByRole("button", { name: "Save status" }).click();
    });

    cy.wait("@updateStatus");

    cy.findByRole("dialog").within(() => {
      cy.findByText("Archived").should("be.visible");
      cy.findByRole("button", { name: "Edit status" }).should("be.visible");
    });

    cy.findByRole("button", { name: "Close modal" }).click();
    cy.findByRole("row", { name: "View note: My First Note" }).within(() => {
      cy.findByText("Archived").should("be.visible");
    });
  });

  it("shows an inline error when the status save fails and stays in edit mode", () => {
    cy.intercept("PUT", "http://localhost:4000/api/notes/note1", {
      statusCode: 500,
      body: { detail: "Internal server error" },
    }).as("updateStatusFail");

    visitAuthorized("/notes");
    cy.wait("@getNotes");

    cy.findByRole("row", { name: "View note: My First Note" }).click();
    cy.findByRole("dialog").within(() => {
      cy.findByRole("button", { name: "Edit status" }).click();
      cy.findByRole("combobox", { name: "Note status" }).select("archived");
      cy.findByRole("button", { name: "Save status" }).click();
    });

    cy.wait("@updateStatusFail");

    cy.findByRole("dialog").within(() => {
      cy.findByRole("alert").should("contain.text", "Internal server error");
      cy.findByRole("combobox", { name: "Note status" }).should("be.visible");
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm the new ones fail**

```bash
npx cypress run --spec cypress/e2e/app.cy.ts
```

Expected: The 5 new "Notes page (admin)" tests fail with element-not-found errors. All pre-existing "App" tests continue to pass.

---

### Task 2: Add state variables and handlers to NotesPage.tsx

**Files:**
- Modify: `src/pages/notes/NotesPage.tsx`

- [ ] **Step 1: Add four new state variables**

Locate the existing state block (around line 45). After `const [selectedNote, setSelectedNote] = useState<Note | null>(null);`, add:

```typescript
const [isEditingStatus, setIsEditingStatus] = useState(false);
const [pendingStatus, setPendingStatus] = useState<NoteStatus>("not published");
const [isSavingStatus, setIsSavingStatus] = useState(false);
const [statusSaveError, setStatusSaveError] = useState("");
```

- [ ] **Step 2: Update `closeModal` to also reset edit state**

Replace:

```typescript
const closeModal = useCallback(() => setSelectedNote(null), []);
```

With:

```typescript
const closeModal = useCallback(() => {
  setSelectedNote(null);
  setIsEditingStatus(false);
  setStatusSaveError("");
}, []);
```

- [ ] **Step 3: Add `handleStatusSave` callback after `closeModal`**

```typescript
const handleStatusSave = useCallback(async () => {
  if (!selectedNote) return;
  setIsSavingStatus(true);
  setStatusSaveError("");
  try {
    const response = await fetch(getApiUrl(`/api/notes/${selectedNote.id}`), {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: pendingStatus }),
    });

    if (handleUnauthorizedResponse(response)) return;

    if (!response.ok) {
      const errorData = await readJsonResponse<{ detail?: unknown }>(response);
      throw new Error(
        getErrorMessage(errorData?.detail, "Failed to update status"),
      );
    }

    setSelectedNote((prev) =>
      prev ? { ...prev, status: pendingStatus } : prev,
    );
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id ? { ...n, status: pendingStatus } : n,
      ),
    );
    setIsEditingStatus(false);
  } catch (error) {
    setStatusSaveError(
      error instanceof Error ? error.message : "Failed to update status",
    );
  } finally {
    setIsSavingStatus(false);
  }
}, [selectedNote, pendingStatus]);
```

---

### Task 3: Update the modal JSX

**Files:**
- Modify: `src/pages/notes/NotesPage.tsx`

- [ ] **Step 1: Reset edit state when a note row is clicked**

In the table body, each `<tr>` has `onClick` and `onKeyDown`. Replace both:

```tsx
// Before
onClick={() => setSelectedNote(note)}
onKeyDown={(e) => e.key === "Enter" && setSelectedNote(note)}

// After
onClick={() => {
  setSelectedNote(note);
  setIsEditingStatus(false);
  setStatusSaveError("");
}}
onKeyDown={(e) => {
  if (e.key === "Enter") {
    setSelectedNote(note);
    setIsEditingStatus(false);
    setStatusSaveError("");
  }
}}
```

- [ ] **Step 2: Replace the `modalMeta` div and add the error paragraph**

Find the `<div className={styles.modalMeta}>` block (and its closing `</div>`) inside the modal. Replace the entire `modalMeta` div with the following, keeping it in the same position inside `<div className={styles.modal}>`:

```tsx
<div className={styles.modalMeta}>
  <span>{selectedNote.userName}</span>
  {isEditingStatus ? (
    <>
      <select
        className={styles.statusSelect}
        value={pendingStatus}
        onChange={(e) =>
          setPendingStatus(e.target.value as NoteStatus)
        }
        disabled={isSavingStatus}
        aria-label="Note status"
      >
        <option value="published">Published</option>
        <option value="not published">Not Published</option>
        <option value="archived">Archived</option>
      </select>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Save status"
        onClick={handleStatusSave}
        disabled={isSavingStatus}
      >
        ✓
      </button>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Cancel editing status"
        onClick={() => {
          setIsEditingStatus(false);
          setStatusSaveError("");
        }}
        disabled={isSavingStatus}
      >
        ✗
      </button>
    </>
  ) : (
    <>
      <span
        className={`${styles.statusBadge} ${getStatusClassName(
          selectedNote.status,
        )}`}
      >
        {getStatusLabel(selectedNote.status)}
      </span>
      <button
        type="button"
        className={styles.editStatusButton}
        aria-label="Edit status"
        onClick={() => {
          setPendingStatus(selectedNote.status);
          setIsEditingStatus(true);
          setStatusSaveError("");
        }}
      >
        ✏
      </button>
    </>
  )}
  <span>{formatUpdatedDate(selectedNote.updatedAt)}</span>
  <button
    type="button"
    className={styles.closeTextButton}
    onClick={closeModal}
  >
    Close
  </button>
</div>
{statusSaveError && (
  <p
    className={`${styles.errorMessage} ${styles.statusSaveError}`}
    role="alert"
  >
    {statusSaveError}
  </p>
)}
```

The `{statusSaveError && ...}` block goes immediately after `</div>` of `modalMeta`, still inside the outer `<div className={styles.modal}>`.

---

### Task 4: Add SCSS styles

**Files:**
- Modify: `src/pages/notes/NotesPage.module.scss`

- [ ] **Step 1: Append new classes to the end of the file**

```scss
.editStatusButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--table-border);
  border-radius: 0.25rem;
  background-color: var(--sidebar-button-background);
  color: var(--page-text);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;

  &:hover {
    background-color: var(--sidebar-button-hover);
  }
}

.statusSelect {
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--table-border);
  border-radius: 0.25rem;
  background-color: var(--sidebar-button-background);
  color: var(--page-text);
  font-size: 0.85rem;
  cursor: pointer;
}

.statusSaveError {
  padding: 0.25rem 1rem 0.5rem;
  font-size: 0.85rem;
  border-top: 1px solid var(--table-border);
  margin: 0;
}
```

---

### Task 5: Verify and commit

**Files:** none (verification + commit)

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run the full Cypress suite**

```bash
npx cypress run --spec cypress/e2e/app.cy.ts
```

Expected: All tests pass, including the 5 new "Notes page (admin)" tests.

- [ ] **Step 3: Commit**

```bash
git add src/pages/notes/NotesPage.tsx src/pages/notes/NotesPage.module.scss cypress/e2e/app.cy.ts
git commit -m "feat: add inline status edit to admin notes modal"
```
