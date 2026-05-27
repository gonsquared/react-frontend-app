# Google Keep Clone — Design Spec

**Date:** 2026-05-28
**Repos:** `react-frontend-app` (frontend), `python-backend-app` (backend)

---

## Overview

Transform the existing notes app into a Google Keep clone. All existing functionality — auth, roles, permissions, admin Notes page, note status system, profile, and user management — is preserved. The Keep UI is built on top of the existing foundation.

---

## Scope

**In scope:**
- Card/masonry grid layout replacing the My Notes table view
- Note colors (11-color Keep palette)
- Pin notes
- Labels/tags
- Client-side search
- Checklists (checklist note type alongside rich-text)
- Reminders (in-app only, 60-second polling)
- Image attachments (one per note, local filesystem, configurable)

**Out of scope (this iteration):**
- Email or push notifications for reminders
- Collaborators / note sharing
- Multiple images per note
- Cloud storage (abstraction is in place; implementation deferred)
- Admin Notes page restyling (remains a table)

---

## Architecture

No new services. Two-repo full-stack: React 19 + TypeScript + Vite frontend, FastAPI + MongoDB backend.

- `/my-notes` becomes the Keep grid page. The `/my-notes/new` and `/my-notes/:noteId` form routes are removed — all creation and editing is inline on the grid.
- The `/notes` admin page, all auth pages, profile, and users management are untouched.
- The backend notes collection gains new optional fields. A storage abstraction handles image files. Two new API endpoints and one new route are added.

---

## Data Model

### Backend note fields (additions — all optional, backward-compatible)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `color` | `string \| null` | `null` | Keep palette key (e.g. `"red"`, `"teal"`) |
| `isPinned` | `bool` | `false` | Pinned to top of grid |
| `labels` | `list[str]` | `[]` | User-defined label tags |
| `noteType` | `"text" \| "checklist"` | `"text"` | Note content mode |
| `checklistItems` | `list[{text: str, checked: bool}]` | `[]` | Used when `noteType == "checklist"` |
| `reminderAt` | `datetime \| null` | `null` | UTC datetime for in-app reminder |
| `imagePath` | `string \| null` | `null` | Relative path to uploaded image |

Existing fields unchanged: `title`, `contents`, `status`, `user`, `createdAt`, `updatedAt`.

### Note color palette

11 values: `null` (default/white), `"red"`, `"pink"`, `"orange"`, `"yellow"`, `"teal"`, `"green"`, `"cyan"`, `"blue"`, `"purple"`, `"gray"`.

---

## Backend Changes

### Updated models (`app/models/note_model.py`)

`Note` and `UpdateNote` Pydantic models gain the new optional fields listed above.

### New endpoints

- `POST /api/notes/{id}/image` — multipart image upload. Saves to local storage via `StorageBackend`, stores relative path on the note. If the note already has an image, the old file is deleted before the new one is saved. Requires `manage_own_notes` and note ownership (or `manage_notes`).
- `GET /api/images/{filename}` — serves image files (FastAPI `StaticFiles` or streaming route).
- `GET /api/labels` — returns the authenticated user's distinct labels aggregated from all their notes.

### Storage abstraction (`app/storage.py`)

```
StorageBackend (Protocol)
  save(file: UploadFile) -> str   # returns relative path
  delete(path: str) -> None

LocalStorageBackend
  - Saves to storage/images/ directory
  - Configured via STORAGE_BACKEND=local env var (default)
```

Adding S3 support later means implementing `S3StorageBackend` and switching the env var.

### Note deletion

Deleting a note also calls `storage.delete(note.imagePath)` if an image exists.

---

## Frontend Components

### Page: Keep Grid (`/my-notes`)

Replaces `MyNotesPage`. Fetches from existing `/api/notes/by-user/{userId}`. Renders:
1. **Pinned** section (if any pinned notes) — labeled "Pinned"
2. **Others** section — all unpinned notes
3. Within each section, notes ordered by `updatedAt` descending

### Component: `NoteCreator`

Collapsed "Take a note…" input bar at the top of the grid. On focus: expands to show title field, content/checklist area, and `NoteToolbar`. On blur/close: if both title and content are empty, discards without any API call. Otherwise saves as draft (`status: "not published"`) and collapses. If save fails: stays open, shows inline error, preserves content.

### Component: `NoteCard`

Single card in the masonry grid. Displays:
- Color background (CSS class per palette key, with dark mode variants)
- Image thumbnail (if present)
- Title
- Content preview (plain text truncated) or checklist items (with strikethrough for checked)
- Labels as chips
- Reminder badge (if `reminderAt` is set and in the future)
- Pin indicator

On hover: shows action toolbar with color picker, pin toggle, label manager, reminder picker, delete.
On click: opens `NoteEditModal`.

### Component: `NoteEditModal`

Full-screen overlay for editing an existing note. Same fields and toolbar as `NoteCreator`, pre-populated. Saves on close (blur or explicit close button). Error shown inline if save fails.

### Component: `NoteToolbar`

Shared toolbar used in both `NoteCreator` and `NoteEditModal`:
- Color picker (swatch grid)
- Pin toggle
- Label manager (free-text input with autocomplete from `GET /api/labels`)
- Reminder datetime picker
- Image upload button (triggers `POST /api/notes/{id}/image`)
- Checklist/text toggle (`noteType` switch)

### Component: `LabelFilter`

Chip list in the sidebar or top bar. Shows all distinct labels from the loaded notes. Clicking a chip filters the grid client-side to notes containing that label. Multiple chips can be active (OR logic).

### Component: `SearchBar`

Text input in the top nav area. Filters the loaded note list client-side by matching title or content text (case-insensitive). Clearing search restores the full grid. No backend search endpoint.

### Component: `ReminderBanner`

On page load and every 60 seconds: checks all loaded notes for `reminderAt` values that are in the past and not yet dismissed (session state). Shows a dismissible banner per fired reminder with the note title. Dismissing calls `PUT /api/notes/{id}` with `reminderAt: null`.

### Routing changes

| Before | After |
|---|---|
| `/my-notes` → `MyNotesPage` (table) | `/my-notes` → Keep grid page |
| `/my-notes/new` → `NoteFormPage` | removed |
| `/my-notes/:noteId` → `NoteFormPage` | removed |

---

## Error Handling

- Network/API errors: inline `role="alert"` paragraphs, consistent with existing patterns. No global toast system.
- Image upload failure: error shown in the edit modal; note is unaffected.
- Reminder polling failure: silently ignored; next poll retries.
- `NoteCreator` save failure on blur: creator stays open, content preserved, error shown.

---

## Testing

### Backend

New pytest tests in `tests/test_notes.py`:
- Image upload endpoint (valid upload, invalid file type, missing note)
- Label aggregation endpoint (returns distinct labels, scoped to current user)
- Updated note model fields (color, isPinned, labels, reminderAt, noteType, checklistItems)

Follows existing test patterns and fixtures.

### Frontend

No frontend unit test suite exists in the project. Manual verification via dev server + browser, following the existing project pattern.

Pre-commit hook and ESLint config are unchanged.
