# Note Status Inline Edit

**Date:** 2026-05-28
**Feature:** Allow admin to update a note's status directly from the note detail modal in the Notes page.

---

## Overview

In the Notes page modal's meta strip, a pencil icon button sits immediately to the right of the status badge. Clicking it switches the status badge into an inline `<select>` dropdown pre-filled with the current status, alongside Save and Cancel buttons. On save, the frontend calls the existing `PUT /api/notes/{id}` endpoint with the new status and updates both the modal and the table row without closing the modal.

---

## UI Layout

**View mode (default):**
```
[userName]  [statusBadge]  [✏]  [date]  [Close]
```

**Edit mode (after pencil click):**
```
[userName]  [<select>]  [✓]  [✗]  [date]  [Close]
```

- The `<select>` is pre-filled with the current status.
- Options: `published`, `not published`, `archived` (displayed as "Published", "Not Published", "Archived").
- Save (✓) is disabled while the API request is in-flight.
- On error, a small inline error message appears below the meta strip.
- Cancel (✗) or a successful save returns to view mode.

---

## State

All state is local to `NotesPage.tsx`. No new files are required.

| Field | Type | Purpose |
|---|---|---|
| `isEditingStatus` | `boolean` | Toggles between view and edit mode |
| `pendingStatus` | `NoteStatus` | Tracks the selected value in the `<select>` |
| `isSavingStatus` | `boolean` | Disables the save button during the API call |
| `statusSaveError` | `string` | Holds an inline error message on failure |

State resets (`isEditingStatus → false`, `statusSaveError → ""`) when the modal is closed or a different note is opened.

---

## Data Flow

1. Admin clicks pencil → `isEditingStatus = true`, `pendingStatus = selectedNote.status`.
2. Admin changes the `<select>` → `pendingStatus` updates.
3. Admin clicks Save (✓):
   - `isSavingStatus = true`, save button disabled.
   - `PATCH PUT /api/notes/{id}` with `{ status: pendingStatus }`.
   - On success: update `selectedNote.status` and the matching entry in the `notes` array, `isEditingStatus = false`, `isSavingStatus = false`.
   - On error: `statusSaveError = errorMessage`, `isSavingStatus = false` (stays in edit mode).
4. Admin clicks Cancel (✗) → `isEditingStatus = false`, `statusSaveError = ""`.

---

## API

Uses the existing endpoint:

```
PUT /api/notes/{note_id}
Body: { "status": "published" | "not published" | "archived" }
```

Requires `manage_notes` permission (already enforced — only admins reach this page).

---

## Styling

- Pencil button reuses `.closeButton` styles.
- Save/Cancel buttons reuse `.closeTextButton` styles.
- The `<select>` gets minimal new styles consistent with the existing button aesthetic (same border, border-radius, background, font-size).
- Inline error message reuses `.errorMessage` styles, placed below the meta strip.

---

## Error Handling

- API error → display message inline below the meta strip, remain in edit mode so the admin can retry or cancel.
- No optimistic update — the UI only changes after a confirmed successful response.
