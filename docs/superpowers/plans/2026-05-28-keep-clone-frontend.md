# Google Keep Clone — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the My Notes table view with a full Google Keep-style masonry grid with inline note creation/editing, colors, pinning, labels, search, checklists, reminders, and image attachments.

**Architecture:** `/my-notes` becomes the `KeepGrid` page. Note creation and editing are inline via `NoteCreator` and `NoteEditModal`. Shared logic flows through `NoteToolbar`. The `/notes` admin page, all auth pages, and `AuthorizedLayout` structure are preserved.

**Tech Stack:** React 19, TypeScript, SCSS Modules, React Router v6, Vite, Bun

**Working directory:** `/mnt/c/Users/gonsq/devworks/react-frontend-app`

**Prerequisite:** Backend plan (`2026-05-28-keep-clone-backend.md`) must be complete and the backend must be running.

---

## File Map

| Action | File |
|---|---|
| Create | `src/interfaces/Note.ts` |
| Create | `src/helpers/noteColors.ts` |
| Create | `src/components/notes/NoteCard.tsx` + `.module.scss` |
| Create | `src/components/notes/NoteToolbar.tsx` + `.module.scss` |
| Create | `src/components/notes/NoteCreator.tsx` + `.module.scss` |
| Create | `src/components/notes/NoteEditModal.tsx` + `.module.scss` |
| Create | `src/components/notes/LabelFilter.tsx` + `.module.scss` |
| Create | `src/components/notes/SearchBar.tsx` + `.module.scss` |
| Create | `src/components/notes/ReminderBanner.tsx` + `.module.scss` |
| Create | `src/pages/notes/KeepGrid.tsx` + `.module.scss` |
| Delete | `src/pages/notes/MyNotesPage.tsx` + `.module.scss` |
| Delete | `src/pages/notes/NoteFormPage.tsx` + `.module.scss` |
| Modify | `src/App.tsx` |

---

### Task 1: Note interface and color constants

**Files:**
- Create: `src/interfaces/Note.ts`
- Create: `src/helpers/noteColors.ts`

- [ ] **Step 1: Create `src/interfaces/Note.ts`**

```typescript
export type NoteStatus = "published" | "not published" | "archived";
export type NoteColor =
  | "red" | "pink" | "orange" | "yellow" | "teal"
  | "green" | "cyan" | "blue" | "purple" | "gray"
  | null;
export type NoteType = "text" | "checklist";

export type ChecklistItem = {
  text: string;
  checked: boolean;
};

export type Note = {
  id: string;
  title: string;
  contents: string;
  status: NoteStatus;
  color: NoteColor;
  isPinned: boolean;
  labels: string[];
  noteType: NoteType;
  checklistItems: ChecklistItem[];
  reminderAt: string | null;
  imagePath: string | null;
  user: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
};

export type NotePayload = {
  title: string;
  contents: string;
  status: NoteStatus;
  color: NoteColor;
  isPinned: boolean;
  labels: string[];
  noteType: NoteType;
  checklistItems: ChecklistItem[];
  reminderAt: string | null;
};
```

- [ ] **Step 2: Create `src/helpers/noteColors.ts`**

```typescript
import type { NoteColor } from "../interfaces/Note";

export type ColorOption = {
  key: NoteColor;
  label: string;
  hex: string;
};

export const NOTE_COLORS: ColorOption[] = [
  { key: null, label: "Default", hex: "transparent" },
  { key: "red", label: "Red", hex: "#f28b82" },
  { key: "pink", label: "Pink", hex: "#fdcfe8" },
  { key: "orange", label: "Orange", hex: "#fbbc04" },
  { key: "yellow", label: "Yellow", hex: "#fff475" },
  { key: "teal", label: "Teal", hex: "#a8f0d1" },
  { key: "green", label: "Green", hex: "#ccff90" },
  { key: "cyan", label: "Cyan", hex: "#d3f8f8" },
  { key: "blue", label: "Blue", hex: "#aecbfa" },
  { key: "purple", label: "Purple", hex: "#d7aefb" },
  { key: "gray", label: "Gray", hex: "#e6c9a8" },
];

export const getNoteColorHex = (color: NoteColor): string =>
  NOTE_COLORS.find((c) => c.key === color)?.hex ?? "transparent";
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/interfaces/Note.ts src/helpers/noteColors.ts
git commit -m "feat: add Note interface and Keep color palette constants"
```

---

### Task 2: NoteCard component

**Files:**
- Create: `src/components/notes/NoteCard.tsx`
- Create: `src/components/notes/NoteCard.module.scss`

- [ ] **Step 1: Create `src/components/notes/NoteCard.module.scss`**

```scss
.card {
  background-color: var(--content-background, var(--sidebar-button-background));
  border: 1px solid var(--table-border);
  border-radius: 0.5rem;
  break-inside: avoid;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 1rem;
  position: relative;
  transition: box-shadow 0.15s;

  &:hover,
  &:focus-within {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    .actions {
      opacity: 1;
    }
  }
}

.image {
  border-radius: 0.375rem;
  display: block;
  margin: -1rem -1rem 0.75rem;
  max-height: 200px;
  object-fit: cover;
  width: calc(100% + 2rem);
}

.title {
  font-weight: 600;
  margin: 0 0 0.5rem;
  word-break: break-word;
}

.preview {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.checklist {
  font-size: 0.875rem;
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0;

  li {
    padding: 0.1rem 0;
  }
}

.checked {
  opacity: 0.55;
  text-decoration: line-through;
}

.labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.label {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 1rem;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}

.reminderBadge {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 1rem;
  display: inline-block;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.15rem 0.5rem;
}

.actions {
  bottom: 0.5rem;
  display: flex;
  gap: 0.25rem;
  left: 0.5rem;
  opacity: 0;
  position: absolute;
  transition: opacity 0.15s;
}

.actionButton {
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.3rem;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}

.pinnedIcon {
  color: var(--page-text);
  font-size: 0.85rem;
  opacity: 0.7;
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
}
```

- [ ] **Step 2: Create `src/components/notes/NoteCard.tsx`**

```tsx
import { getApiUrl } from "../../helpers/api";
import { getNoteColorHex } from "../../helpers/noteColors";
import type { Note } from "../../interfaces/Note";
import styles from "./NoteCard.module.scss";

type Props = {
  note: Note;
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
};

function getTextFromHtml(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent?.trim() ?? "";
}

export default function NoteCard({ note, onClick, onPin, onDelete }: Props) {
  const imageUrl = note.imagePath
    ? getApiUrl(`/api/images/${note.imagePath}`)
    : null;
  const colorHex = getNoteColorHex(note.color);
  const cardStyle = note.color ? { backgroundColor: colorHex } : undefined;
  const contentPreview =
    note.noteType === "text"
      ? getTextFromHtml(note.contents).slice(0, 200)
      : null;
  const reminderIsFuture =
    note.reminderAt !== null && new Date(note.reminderAt) > new Date();

  return (
    <div
      className={styles.card}
      style={cardStyle}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`Open note: ${note.title || "Untitled"}`}
    >
      {note.isPinned && (
        <span className={styles.pinnedIcon} aria-label="Pinned">
          📌
        </span>
      )}
      {imageUrl && (
        <img
          className={styles.image}
          src={imageUrl}
          alt=""
          aria-hidden="true"
        />
      )}
      {note.title && <p className={styles.title}>{note.title}</p>}
      {note.noteType === "text" && contentPreview && (
        <p className={styles.preview}>{contentPreview}</p>
      )}
      {note.noteType === "checklist" && note.checklistItems.length > 0 && (
        <ul className={styles.checklist}>
          {note.checklistItems.slice(0, 6).map((item, i) => (
            <li key={i} className={item.checked ? styles.checked : undefined}>
              {item.text}
            </li>
          ))}
        </ul>
      )}
      {note.labels.length > 0 && (
        <div className={styles.labels}>
          {note.labels.map((label) => (
            <span key={label} className={styles.label}>
              {label}
            </span>
          ))}
        </div>
      )}
      {reminderIsFuture && (
        <span className={styles.reminderBadge}>
          🔔 {new Date(note.reminderAt!).toLocaleDateString()}
        </span>
      )}
      <div
        className={styles.actions}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.actionButton}
          aria-label={note.isPinned ? "Unpin note" : "Pin note"}
          onClick={onPin}
        >
          {note.isPinned ? "📌" : "📍"}
        </button>
        <button
          type="button"
          className={styles.actionButton}
          aria-label="Delete note"
          onClick={onDelete}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/notes/NoteCard.tsx src/components/notes/NoteCard.module.scss
git commit -m "feat: add NoteCard component for Keep grid"
```

---

### Task 3: NoteToolbar component

**Files:**
- Create: `src/components/notes/NoteToolbar.tsx`
- Create: `src/components/notes/NoteToolbar.module.scss`

- [ ] **Step 1: Create `src/components/notes/NoteToolbar.module.scss`**

```scss
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  position: relative;
}

.toolButton {
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.3rem 0.4rem;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.activeButton {
  background: rgba(0, 0, 0, 0.12);
}

.popover {
  background: var(--sidebar-button-background);
  border: 1px solid var(--table-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  left: 0;
  padding: 0.75rem;
  position: absolute;
  top: calc(100% + 0.5rem);
  z-index: 100;
  min-width: 200px;
}

.colorGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.colorSwatch {
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  height: 2rem;
  width: 2rem;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.15);
  }

  &:focus-visible {
    outline: 2px solid var(--page-text);
    outline-offset: 2px;
  }
}

.activeColor {
  border-color: var(--page-text);
}

.defaultSwatch {
  background: #ffffff;
  border: 2px solid var(--table-border);
}

.labelInput {
  border: 1px solid var(--table-border);
  border-radius: 0.25rem;
  background: var(--page-background);
  color: var(--page-text);
  font: inherit;
  font-size: 0.875rem;
  padding: 0.3rem 0.5rem;
  width: 100%;
}

.labelChips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.labelChip {
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }
}

.appliedChip {
  background: var(--table-border);
}

.reminderInput {
  border: 1px solid var(--table-border);
  border-radius: 0.25rem;
  background: var(--page-background);
  color: var(--page-text);
  font: inherit;
  font-size: 0.875rem;
  padding: 0.3rem 0.5rem;
  width: 100%;
}

.clearButton {
  background: none;
  border: none;
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  margin-top: 0.4rem;
  padding: 0.2rem 0;
  text-decoration: underline;

  &:hover {
    opacity: 0.7;
  }
}

.hiddenInput {
  display: none;
}
```

- [ ] **Step 2: Create `src/components/notes/NoteToolbar.tsx`**

```tsx
import { useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders } from "../../helpers/authSession";
import { NOTE_COLORS } from "../../helpers/noteColors";
import type { NoteColor, NoteType } from "../../interfaces/Note";
import styles from "./NoteToolbar.module.scss";

type Props = {
  noteId?: string;
  color: NoteColor;
  isPinned: boolean;
  labels: string[];
  noteType: NoteType;
  reminderAt: string | null;
  allLabels: string[];
  onColorChange: (color: NoteColor) => void;
  onPinToggle: () => void;
  onLabelsChange: (labels: string[]) => void;
  onNoteTypeChange: (type: NoteType) => void;
  onReminderChange: (date: string | null) => void;
  onImageUploaded?: (path: string) => void;
};

type Popover = "color" | "label" | "reminder" | null;

export default function NoteToolbar({
  noteId,
  color,
  isPinned,
  labels,
  noteType,
  reminderAt,
  allLabels,
  onColorChange,
  onPinToggle,
  onLabelsChange,
  onNoteTypeChange,
  onReminderChange,
  onImageUploaded,
}: Props) {
  const [openPopover, setOpenPopover] = useState<Popover>(null);
  const [labelInput, setLabelInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePopover = (name: Popover) =>
    setOpenPopover((current) => (current === name ? null : name));

  const addLabel = (label: string) => {
    const trimmed = label.trim();
    if (trimmed && !labels.includes(trimmed)) {
      onLabelsChange([...labels, trimmed]);
    }
    setLabelInput("");
  };

  const removeLabel = (label: string) =>
    onLabelsChange(labels.filter((l) => l !== label));

  const handleImageUpload = async (file: File) => {
    if (!noteId) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(getApiUrl(`/api/notes/${noteId}/image`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      });
      if (!response.ok) {
        const err = await readJsonResponse<{ detail?: unknown }>(response);
        throw new Error(getErrorMessage(err?.detail, "Upload failed"));
      }
      const data = await readJsonResponse<{ imagePath: string }>(response);
      if (data?.imagePath) onImageUploaded?.(data.imagePath);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reminderValue = reminderAt
    ? new Date(reminderAt).toISOString().slice(0, 16)
    : "";

  return (
    <div className={styles.toolbar}>
      {/* Color picker */}
      <button
        type="button"
        className={`${styles.toolButton} ${openPopover === "color" ? styles.activeButton : ""}`}
        aria-label="Change note color"
        onClick={() => togglePopover("color")}
      >
        🎨
      </button>
      {openPopover === "color" && (
        <div className={styles.popover} role="dialog" aria-label="Color picker">
          <div className={styles.colorGrid}>
            {NOTE_COLORS.map((c) => (
              <button
                key={String(c.key)}
                type="button"
                className={`${styles.colorSwatch} ${c.key === null ? styles.defaultSwatch : ""} ${color === c.key ? styles.activeColor : ""}`}
                style={c.key ? { backgroundColor: c.hex } : undefined}
                aria-label={c.label}
                aria-pressed={color === c.key}
                onClick={() => {
                  onColorChange(c.key);
                  setOpenPopover(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pin toggle */}
      <button
        type="button"
        className={`${styles.toolButton} ${isPinned ? styles.activeButton : ""}`}
        aria-label={isPinned ? "Unpin note" : "Pin note"}
        aria-pressed={isPinned}
        onClick={onPinToggle}
      >
        📌
      </button>

      {/* Label manager */}
      <button
        type="button"
        className={`${styles.toolButton} ${openPopover === "label" ? styles.activeButton : ""}`}
        aria-label="Edit labels"
        onClick={() => togglePopover("label")}
      >
        🏷
      </button>
      {openPopover === "label" && (
        <div className={styles.popover} role="dialog" aria-label="Label manager">
          <input
            className={styles.labelInput}
            type="text"
            placeholder="Add label…"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLabel(labelInput);
              }
            }}
            aria-label="New label name"
          />
          {labels.length > 0 && (
            <div className={styles.labelChips}>
              {labels.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`${styles.labelChip} ${styles.appliedChip}`}
                  aria-label={`Remove label ${l}`}
                  onClick={() => removeLabel(l)}
                >
                  {l} ✕
                </button>
              ))}
            </div>
          )}
          {allLabels.filter((l) => !labels.includes(l) && l.includes(labelInput)).length > 0 && (
            <div className={styles.labelChips}>
              {allLabels
                .filter((l) => !labels.includes(l) && l.includes(labelInput))
                .map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={styles.labelChip}
                    onClick={() => addLabel(l)}
                  >
                    {l}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Reminder picker */}
      <button
        type="button"
        className={`${styles.toolButton} ${openPopover === "reminder" ? styles.activeButton : ""}`}
        aria-label="Set reminder"
        onClick={() => togglePopover("reminder")}
      >
        🔔
      </button>
      {openPopover === "reminder" && (
        <div className={styles.popover} role="dialog" aria-label="Reminder picker">
          <input
            className={styles.reminderInput}
            type="datetime-local"
            value={reminderValue}
            onChange={(e) => onReminderChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            aria-label="Reminder date and time"
          />
          {reminderAt && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => onReminderChange(null)}
            >
              Clear reminder
            </button>
          )}
        </div>
      )}

      {/* Checklist toggle */}
      <button
        type="button"
        className={`${styles.toolButton} ${noteType === "checklist" ? styles.activeButton : ""}`}
        aria-label={noteType === "checklist" ? "Switch to text" : "Switch to checklist"}
        aria-pressed={noteType === "checklist"}
        onClick={() => onNoteTypeChange(noteType === "checklist" ? "text" : "checklist")}
      >
        ✓
      </button>

      {/* Image upload (only when editing an existing note) */}
      <button
        type="button"
        className={styles.toolButton}
        aria-label="Upload image"
        disabled={!noteId || uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        🖼
      </button>
      <input
        ref={fileInputRef}
        className={styles.hiddenInput}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file);
          e.target.value = "";
        }}
        aria-hidden="true"
      />
      {uploadError && (
        <span role="alert" style={{ fontSize: "0.75rem", color: "#c62828" }}>
          {uploadError}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/notes/NoteToolbar.tsx src/components/notes/NoteToolbar.module.scss
git commit -m "feat: add NoteToolbar with color picker, pin, labels, reminder, checklist toggle, image upload"
```

---

### Task 4: NoteCreator component

**Files:**
- Create: `src/components/notes/NoteCreator.tsx`
- Create: `src/components/notes/NoteCreator.module.scss`

- [ ] **Step 1: Create `src/components/notes/NoteCreator.module.scss`**

```scss
.wrapper {
  border: 1px solid var(--table-border);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.collapsed {
  color: rgba(0, 0, 0, 0.5);
  cursor: text;
  font-size: 0.95rem;
  padding: 0.85rem 1rem;
}

.expanded {
  padding: 0.75rem 1rem;
}

.titleInput {
  background: none;
  border: none;
  color: var(--page-text);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  padding: 0;
  width: 100%;

  &::placeholder {
    opacity: 0.5;
  }
}

.editorField {
  margin-top: 0.5rem;
}

.editor {
  border: none;
  color: var(--page-text);
  font: inherit;
  font-size: 0.9rem;
  min-height: 2rem;
  outline: none;
  width: 100%;
}

.checklistArea {
  margin-top: 0.5rem;
}

.checklistRow {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.checklistInput {
  background: none;
  border: none;
  color: var(--page-text);
  flex: 1;
  font: inherit;
  font-size: 0.9rem;
  outline: none;
  padding: 0;
}

.addItemButton {
  background: none;
  border: none;
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  opacity: 0.6;
  padding: 0.2rem 0;
  text-align: left;

  &:hover {
    opacity: 1;
  }
}

.footer {
  align-items: center;
  border-top: 1px solid var(--table-border);
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
}

.closeButton {
  background: none;
  border: none;
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  margin-left: auto;
  padding: 0.3rem 0.75rem;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 0.25rem;
  }
}

.errorMessage {
  color: #c62828;
  font-size: 0.875rem;
  margin: 0.25rem 0 0;
}
```

- [ ] **Step 2: Create `src/components/notes/NoteCreator.tsx`**

```tsx
import { useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders, handleUnauthorizedResponse } from "../../helpers/authSession";
import type { ChecklistItem, Note, NoteColor, NoteType } from "../../interfaces/Note";
import { sanitizeHtml } from "../../helpers/sanitizeHtml";
import NoteToolbar from "./NoteToolbar";
import styles from "./NoteCreator.module.scss";

type Props = {
  allLabels: string[];
  onCreated: (note: Note) => void;
};

export default function NoteCreator({ allLabels, onCreated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<NoteColor>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [noteType, setNoteType] = useState<NoteType>("text");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([{ text: "", checked: false }]);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const getContents = () => sanitizeHtml(editorRef.current?.innerHTML ?? "");

  const isEmpty = () => {
    if (title.trim()) return false;
    if (noteType === "text") {
      const el = document.createElement("div");
      el.innerHTML = editorRef.current?.innerHTML ?? "";
      return !(el.textContent?.trim());
    }
    return checklistItems.every((i) => !i.text.trim());
  };

  const reset = () => {
    setTitle("");
    setColor(null);
    setIsPinned(false);
    setLabels([]);
    setNoteType("text");
    setChecklistItems([{ text: "", checked: false }]);
    setReminderAt(null);
    setErrorMessage("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setExpanded(false);
  };

  const save = async () => {
    if (isEmpty()) { reset(); return; }
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch(getApiUrl("/api/notes/"), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          contents: noteType === "text" ? getContents() : "",
          status: "not published",
          color,
          isPinned,
          labels,
          noteType,
          checklistItems: noteType === "checklist" ? checklistItems.filter((i) => i.text.trim()) : [],
          reminderAt,
        }),
      });
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) {
        const err = await readJsonResponse<{ detail?: unknown }>(response);
        throw new Error(getErrorMessage(err?.detail, "Failed to create note"));
      }
      const note = await readJsonResponse<Note>(response);
      if (note) onCreated(note);
      reset();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  const handleContainerBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    void save();
  };

  const updateChecklistItem = (index: number, text: string) =>
    setChecklistItems((prev) => prev.map((item, i) => i === index ? { ...item, text } : item));

  if (!expanded) {
    return (
      <div
        className={styles.wrapper}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(true)}
        tabIndex={0}
        role="button"
        aria-label="Take a note"
      >
        <span className={styles.collapsed}>Take a note…</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.wrapper} onBlur={handleContainerBlur}>
      <div className={styles.expanded}>
        <input
          className={styles.titleInput}
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          aria-label="Note title"
        />
        {noteType === "text" ? (
          <div
            ref={editorRef}
            className={styles.editor}
            role="textbox"
            aria-label="Note contents"
            aria-multiline="true"
            contentEditable={!saving}
            suppressContentEditableWarning
          />
        ) : (
          <div className={styles.checklistArea} aria-label="Checklist items">
            {checklistItems.map((item, i) => (
              <div key={i} className={styles.checklistRow}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    setChecklistItems((prev) =>
                      prev.map((it, idx) => idx === i ? { ...it, checked: e.target.checked } : it)
                    )
                  }
                  aria-label={`Item ${i + 1} checked`}
                />
                <input
                  className={styles.checklistInput}
                  type="text"
                  value={item.text}
                  placeholder="List item…"
                  onChange={(e) => updateChecklistItem(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setChecklistItems((prev) => [
                        ...prev.slice(0, i + 1),
                        { text: "", checked: false },
                        ...prev.slice(i + 1),
                      ]);
                    }
                  }}
                  aria-label={`Checklist item ${i + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addItemButton}
              onClick={() => setChecklistItems((prev) => [...prev, { text: "", checked: false }])}
            >
              + Add item
            </button>
          </div>
        )}
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">{errorMessage}</p>
        )}
        <div className={styles.footer}>
          <NoteToolbar
            color={color}
            isPinned={isPinned}
            labels={labels}
            noteType={noteType}
            reminderAt={reminderAt}
            allLabels={allLabels}
            onColorChange={setColor}
            onPinToggle={() => setIsPinned((p) => !p)}
            onLabelsChange={setLabels}
            onNoteTypeChange={(t) => {
              setNoteType(t);
              setChecklistItems([{ text: "", checked: false }]);
              if (editorRef.current) editorRef.current.innerHTML = "";
            }}
            onReminderChange={setReminderAt}
          />
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/notes/NoteCreator.tsx src/components/notes/NoteCreator.module.scss
git commit -m "feat: add inline NoteCreator component"
```

---

### Task 5: NoteEditModal component

**Files:**
- Create: `src/components/notes/NoteEditModal.tsx`
- Create: `src/components/notes/NoteEditModal.module.scss`

- [ ] **Step 1: Create `src/components/notes/NoteEditModal.module.scss`**

```scss
.overlay {
  background: rgba(0, 0, 0, 0.4);
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--sidebar-button-background);
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  max-width: 600px;
  min-width: 320px;
  overflow-y: auto;
  padding: 1.25rem;
  width: 90%;
}

.titleInput {
  background: none;
  border: none;
  color: var(--page-text);
  font: inherit;
  font-size: 1.1rem;
  font-weight: 600;
  outline: none;
  padding: 0;
  width: 100%;

  &::placeholder {
    opacity: 0.5;
  }
}

.editor {
  border: none;
  color: var(--page-text);
  font: inherit;
  font-size: 0.9rem;
  margin-top: 0.75rem;
  min-height: 4rem;
  outline: none;
  width: 100%;
}

.checklistArea {
  margin-top: 0.75rem;
}

.checklistRow {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.checklistInput {
  background: none;
  border: none;
  color: var(--page-text);
  flex: 1;
  font: inherit;
  font-size: 0.9rem;
  outline: none;
  padding: 0;
}

.addItemButton {
  background: none;
  border: none;
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  opacity: 0.6;
  padding: 0.2rem 0;
  text-align: left;

  &:hover {
    opacity: 1;
  }
}

.image {
  border-radius: 0.375rem;
  display: block;
  margin: 0.75rem 0;
  max-height: 300px;
  object-fit: contain;
  width: 100%;
}

.footer {
  align-items: center;
  border-top: 1px solid var(--table-border);
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
}

.closeButton {
  background: none;
  border: none;
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  margin-left: auto;
  padding: 0.3rem 0.75rem;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 0.25rem;
  }
}

.errorMessage {
  color: #c62828;
  font-size: 0.875rem;
  margin: 0.25rem 0 0;
  width: 100%;
}
```

- [ ] **Step 2: Create `src/components/notes/NoteEditModal.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders, handleUnauthorizedResponse } from "../../helpers/authSession";
import { useDialogFocusTrap } from "../../helpers/useDialogFocusTrap";
import { sanitizeHtml } from "../../helpers/sanitizeHtml";
import type { ChecklistItem, Note, NoteColor, NoteType } from "../../interfaces/Note";
import NoteToolbar from "./NoteToolbar";
import styles from "./NoteEditModal.module.scss";

type Props = {
  note: Note;
  allLabels: string[];
  onClose: () => void;
  onUpdated: (note: Note) => void;
};

export default function NoteEditModal({ note, allLabels, onClose, onUpdated }: Props) {
  const [title, setTitle] = useState(note.title);
  const [color, setColor] = useState<NoteColor>(note.color);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [labels, setLabels] = useState<string[]>(note.labels);
  const [noteType, setNoteType] = useState<NoteType>(note.noteType);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    note.checklistItems.length > 0 ? note.checklistItems : [{ text: "", checked: false }]
  );
  const [reminderAt, setReminderAt] = useState<string | null>(note.reminderAt);
  const [imagePath, setImagePath] = useState<string | null>(note.imagePath);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(note.contents);
    }
  }, [note.contents]);

  useDialogFocusTrap({
    isOpen: true,
    dialogRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: () => void handleClose(),
  });

  const getContents = () => sanitizeHtml(editorRef.current?.innerHTML ?? "");

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch(getApiUrl(`/api/notes/${note.id}`), {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          contents: noteType === "text" ? getContents() : "",
          color,
          isPinned,
          labels,
          noteType,
          checklistItems: noteType === "checklist" ? checklistItems.filter((i) => i.text.trim()) : [],
          reminderAt,
        }),
      });
      if (handleUnauthorizedResponse(response)) return false;
      if (!response.ok) {
        const err = await readJsonResponse<{ detail?: unknown }>(response);
        throw new Error(getErrorMessage(err?.detail, "Failed to save note"));
      }
      const updated = await readJsonResponse<Note>(response);
      if (updated) onUpdated({ ...updated, imagePath });
      return true;
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to save note");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    const ok = await save();
    if (ok) onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) void handleClose();
  };

  const updateChecklistItem = (index: number, text: string) =>
    setChecklistItems((prev) => prev.map((item, i) => i === index ? { ...item, text } : item));

  const imageUrl = imagePath ? getApiUrl(`/api/images/${imagePath}`) : null;

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit note: ${note.title || "Untitled"}`}
      >
        <input
          className={styles.titleInput}
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          aria-label="Note title"
        />
        {imageUrl && (
          <img className={styles.image} src={imageUrl} alt="" aria-hidden="true" />
        )}
        {noteType === "text" ? (
          <div
            ref={editorRef}
            className={styles.editor}
            role="textbox"
            aria-label="Note contents"
            aria-multiline="true"
            contentEditable={!saving}
            suppressContentEditableWarning
          />
        ) : (
          <div className={styles.checklistArea} aria-label="Checklist items">
            {checklistItems.map((item, i) => (
              <div key={i} className={styles.checklistRow}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    setChecklistItems((prev) =>
                      prev.map((it, idx) => idx === i ? { ...it, checked: e.target.checked } : it)
                    )
                  }
                  aria-label={`Item ${i + 1} checked`}
                />
                <input
                  className={styles.checklistInput}
                  type="text"
                  value={item.text}
                  placeholder="List item…"
                  onChange={(e) => updateChecklistItem(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setChecklistItems((prev) => [
                        ...prev.slice(0, i + 1),
                        { text: "", checked: false },
                        ...prev.slice(i + 1),
                      ]);
                    }
                  }}
                  aria-label={`Checklist item ${i + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addItemButton}
              onClick={() => setChecklistItems((prev) => [...prev, { text: "", checked: false }])}
            >
              + Add item
            </button>
          </div>
        )}
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">{errorMessage}</p>
        )}
        <div className={styles.footer}>
          <NoteToolbar
            noteId={note.id}
            color={color}
            isPinned={isPinned}
            labels={labels}
            noteType={noteType}
            reminderAt={reminderAt}
            allLabels={allLabels}
            onColorChange={setColor}
            onPinToggle={() => setIsPinned((p) => !p)}
            onLabelsChange={setLabels}
            onNoteTypeChange={(t) => {
              setNoteType(t);
              setChecklistItems([{ text: "", checked: false }]);
              if (editorRef.current) editorRef.current.innerHTML = "";
            }}
            onReminderChange={setReminderAt}
            onImageUploaded={(path) => setImagePath(path)}
          />
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={() => void handleClose()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/notes/NoteEditModal.tsx src/components/notes/NoteEditModal.module.scss
git commit -m "feat: add NoteEditModal with full editing, toolbar, image support"
```

---

### Task 6: LabelFilter component

**Files:**
- Create: `src/components/notes/LabelFilter.tsx`
- Create: `src/components/notes/LabelFilter.module.scss`

- [ ] **Step 1: Create `src/components/notes/LabelFilter.module.scss`**

```scss
.filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.chip {
  background: rgba(0, 0, 0, 0.07);
  border: 1px solid var(--table-border);
  border-radius: 1rem;
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  padding: 0.2rem 0.75rem;
  transition: background 0.1s;

  &:hover {
    background: rgba(0, 0, 0, 0.13);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}

.activeChip {
  background: var(--page-text);
  border-color: var(--page-text);
  color: var(--page-background);
}
```

- [ ] **Step 2: Create `src/components/notes/LabelFilter.tsx`**

```tsx
import styles from "./LabelFilter.module.scss";

type Props = {
  labels: string[];
  activeLabels: string[];
  onToggle: (label: string) => void;
};

export default function LabelFilter({ labels, activeLabels, onToggle }: Props) {
  if (labels.length === 0) return null;

  return (
    <div className={styles.filter} role="group" aria-label="Filter by label">
      {labels.map((label) => {
        const isActive = activeLabels.includes(label);
        return (
          <button
            key={label}
            type="button"
            className={`${styles.chip} ${isActive ? styles.activeChip : ""}`}
            aria-pressed={isActive}
            onClick={() => onToggle(label)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/notes/LabelFilter.tsx src/components/notes/LabelFilter.module.scss
git commit -m "feat: add LabelFilter chip component"
```

---

### Task 7: SearchBar component

**Files:**
- Create: `src/components/notes/SearchBar.tsx`
- Create: `src/components/notes/SearchBar.module.scss`

- [ ] **Step 1: Create `src/components/notes/SearchBar.module.scss`**

```scss
.form {
  display: flex;
  align-items: center;
}

.input {
  background: var(--sidebar-button-background);
  border: 1px solid var(--table-border);
  border-radius: 0.5rem;
  color: var(--page-text);
  font: inherit;
  font-size: 0.875rem;
  padding: 0.35rem 0.75rem;
  width: 100%;

  &::placeholder {
    opacity: 0.5;
  }

  &:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}
```

- [ ] **Step 2: Create `src/components/notes/SearchBar.tsx`**

```tsx
import styles from "./SearchBar.module.scss";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <form
      className={styles.form}
      role="search"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        className={styles.input}
        type="search"
        placeholder="Search notes…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search notes"
      />
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/notes/SearchBar.tsx src/components/notes/SearchBar.module.scss
git commit -m "feat: add SearchBar component"
```

---

### Task 8: ReminderBanner component

**Files:**
- Create: `src/components/notes/ReminderBanner.tsx`
- Create: `src/components/notes/ReminderBanner.module.scss`

- [ ] **Step 1: Create `src/components/notes/ReminderBanner.module.scss`**

```scss
.banners {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.banner {
  align-items: center;
  background: #fff9c4;
  border: 1px solid #f9a825;
  border-radius: 0.375rem;
  color: #5d4037;
  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
}

.message {
  flex: 1;
  font-size: 0.9rem;
}

.dismissButton {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;

  &:hover {
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}
```

- [ ] **Step 2: Create `src/components/notes/ReminderBanner.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders, handleUnauthorizedResponse } from "../../helpers/authSession";
import type { Note } from "../../interfaces/Note";
import styles from "./ReminderBanner.module.scss";

type Props = {
  notes: Note[];
  onNoteUpdated: (note: Note) => void;
};

export default function ReminderBanner({ notes, onNoteUpdated }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const getFiredReminders = useCallback(
    () =>
      notes.filter(
        (n) =>
          n.reminderAt !== null &&
          new Date(n.reminderAt) <= new Date() &&
          !dismissed.has(n.id)
      ),
    [notes, dismissed]
  );

  const [fired, setFired] = useState<Note[]>(() => getFiredReminders());

  useEffect(() => {
    setFired(getFiredReminders());
    const id = setInterval(() => setFired(getFiredReminders()), 60_000);
    return () => clearInterval(id);
  }, [getFiredReminders]);

  const dismiss = async (note: Note) => {
    setDismissed((prev) => new Set([...prev, note.id]));
    try {
      const response = await fetch(getApiUrl(`/api/notes/${note.id}`), {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reminderAt: null }),
      });
      if (handleUnauthorizedResponse(response)) return;
      if (response.ok) {
        const updated = await readJsonResponse<Note>(response);
        if (updated) onNoteUpdated(updated);
      }
    } catch {
      // silently ignore - reminder is already dismissed in UI
    }
  };

  if (fired.length === 0) return null;

  return (
    <div className={styles.banners} role="region" aria-label="Reminders">
      {fired.map((note) => (
        <div key={note.id} className={styles.banner} role="alert">
          <span className={styles.message}>
            🔔 Reminder: <strong>{note.title || "Untitled"}</strong>
          </span>
          <button
            type="button"
            className={styles.dismissButton}
            aria-label={`Dismiss reminder for ${note.title || "Untitled"}`}
            onClick={() => void dismiss(note)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/notes/ReminderBanner.tsx src/components/notes/ReminderBanner.module.scss
git commit -m "feat: add ReminderBanner with 60-second polling and dismiss"
```

---

### Task 9: KeepGrid page

**Files:**
- Create: `src/pages/notes/KeepGrid.tsx`
- Create: `src/pages/notes/KeepGrid.module.scss`

- [ ] **Step 1: Create `src/pages/notes/KeepGrid.module.scss`**

```scss
.page {
  max-width: 960px;
}

.sectionLabel {
  color: var(--page-text);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 1rem 0 0.5rem;
  opacity: 0.55;
  text-transform: uppercase;
}

.grid {
  column-gap: 1rem;
  columns: 240px;
}

.errorMessage {
  color: #c62828;
  font-weight: 700;
}

.emptyState {
  color: var(--page-text);
  opacity: 0.5;
}

.searchBar {
  margin-bottom: 1rem;
  max-width: 400px;
}
```

- [ ] **Step 2: Create `src/pages/notes/KeepGrid.tsx`**

```tsx
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import {
  getAuthHeaders,
  getStoredAuthUser,
  handleUnauthorizedResponse,
  hasPermission,
} from "../../helpers/authSession";
import type { Note } from "../../interfaces/Note";
import NoteCard from "../../components/notes/NoteCard";
import NoteCreator from "../../components/notes/NoteCreator";
import NoteEditModal from "../../components/notes/NoteEditModal";
import LabelFilter from "../../components/notes/LabelFilter";
import SearchBar from "../../components/notes/SearchBar";
import ReminderBanner from "../../components/notes/ReminderBanner";
import styles from "./KeepGrid.module.scss";

export default function KeepGrid() {
  const [authUser] = useState(() => getStoredAuthUser());
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeLabels, setActiveLabels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allLabels, setAllLabels] = useState<string[]>([]);

  const canManageOwnNotes =
    authUser !== null && hasPermission(authUser, "manage_own_notes");

  const fetchNotes = useCallback(async () => {
    if (!authUser) return;
    try {
      const response = await fetch(
        getApiUrl(`/api/notes/by-user/${authUser.id}`),
        { headers: getAuthHeaders() }
      );
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) {
        const err = await readJsonResponse<{ detail?: unknown }>(response);
        throw new Error(getErrorMessage(err?.detail, "Failed to fetch notes"));
      }
      const data = (await readJsonResponse<Note[]>(response)) ?? [];
      setNotes(data);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  const fetchLabels = useCallback(async () => {
    if (!authUser) return;
    try {
      const response = await fetch(getApiUrl("/api/labels/"), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = (await readJsonResponse<string[]>(response)) ?? [];
        setAllLabels(data);
      }
    } catch {
      // non-critical, ignore
    }
  }, [authUser]);

  useEffect(() => {
    void fetchNotes();
    void fetchLabels();
  }, [fetchNotes, fetchLabels]);

  const handleCreated = (note: Note) => {
    setNotes((prev) => [note, ...prev]);
    void fetchLabels();
  };

  const handleUpdated = (updated: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    void fetchLabels();
  };

  const handleDeleted = async (noteId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/notes/${noteId}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (handleUnauthorizedResponse(response)) return;
      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        void fetchLabels();
      }
    } catch {
      // ignore
    }
  };

  const handlePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(getApiUrl(`/api/notes/${note.id}`), {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      if (response.ok) {
        const updated = await readJsonResponse<Note>(response);
        if (updated) handleUpdated(updated);
      }
    } catch {
      // ignore
    }
  };

  const toggleLabel = (label: string) =>
    setActiveLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const distinctLabels = Array.from(new Set(notes.flatMap((n) => n.labels))).sort();

  const filteredNotes = notes.filter((note) => {
    if (activeLabels.length > 0 && !activeLabels.some((l) => note.labels.includes(l)))
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(q);
      const contentEl = document.createElement("div");
      contentEl.innerHTML = note.contents;
      const contentMatch = (contentEl.textContent ?? "").toLowerCase().includes(q);
      const checklistMatch = note.checklistItems.some((i) =>
        i.text.toLowerCase().includes(q)
      );
      if (!titleMatch && !contentMatch && !checklistMatch) return false;
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  if (!authUser || !canManageOwnNotes) {
    return <Navigate to="/home" replace />;
  }

  if (loading) return <p>Loading notes…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>
      <ReminderBanner notes={notes} onNoteUpdated={handleUpdated} />
      <NoteCreator allLabels={allLabels} onCreated={handleCreated} />
      <LabelFilter
        labels={distinctLabels}
        activeLabels={activeLabels}
        onToggle={toggleLabel}
      />
      {errorMessage && (
        <p className={styles.errorMessage} role="alert">{errorMessage}</p>
      )}
      {filteredNotes.length === 0 && !errorMessage && (
        <p className={styles.emptyState}>No notes found.</p>
      )}
      {pinnedNotes.length > 0 && (
        <>
          <p className={styles.sectionLabel}>Pinned</p>
          <div className={styles.grid}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onPin={(e) => void handlePin(note, e)}
                onDelete={(e) => { e.stopPropagation(); void handleDeleted(note.id); }}
              />
            ))}
          </div>
        </>
      )}
      {otherNotes.length > 0 && (
        <>
          {pinnedNotes.length > 0 && (
            <p className={styles.sectionLabel}>Others</p>
          )}
          <div className={styles.grid}>
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditingNote(note)}
                onPin={(e) => void handlePin(note, e)}
                onDelete={(e) => { e.stopPropagation(); void handleDeleted(note.id); }}
              />
            ))}
          </div>
        </>
      )}
      {editingNote && (
        <NoteEditModal
          note={editingNote}
          allLabels={allLabels}
          onClose={() => setEditingNote(null)}
          onUpdated={(updated) => {
            handleUpdated(updated);
            setEditingNote(updated);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/notes/KeepGrid.tsx src/pages/notes/KeepGrid.module.scss
git commit -m "feat: add KeepGrid page with masonry layout, pinned section, search, and label filter"
```

---

### Task 10: Update routing and remove old pages

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/pages/notes/MyNotesPage.tsx`, `src/pages/notes/MyNotesPage.module.scss`
- Delete: `src/pages/notes/NoteFormPage.tsx`, `src/pages/notes/NoteFormPage.module.scss`

- [ ] **Step 1: Update `src/App.tsx`**

Replace the full file:

```tsx
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/home/HomePage";
import ActivateAccountPage from "./pages/activate-account/ActivateAccountPage";
import LoginPage from "./pages/login/LoginPage";
import KeepGrid from "./pages/notes/KeepGrid";
import NotesPage from "./pages/notes/NotesPage";
import ProfilePage from "./pages/profile/ProfilePage";
import RegisterPage from "./pages/register/RegisterPage";
import Users from "./pages/users/UsersPage";
import AuthorizedLayout from "./layouts/AuthorizedLayout";
import PublicLayout from "./layouts/PublicLayout";
import styles from "./App.module.scss";

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const isDarkTheme = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      <div className={`${styles.app} ${isDarkTheme ? styles.darkTheme : ""}`}>
        <div className={styles.appBody}>
          <a className={styles.skipLink} href="#main-content">
            Skip to main content
          </a>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/activate-account"
                element={<ActivateAccountPage />}
              />
            </Route>
            <Route
              element={
                <AuthorizedLayout
                  isDarkTheme={isDarkTheme}
                  toggleTheme={toggleTheme}
                />
              }
            >
              <Route path="/home" element={<Home />} />
              <Route path="/my-notes" element={<KeepGrid />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}
```

- [ ] **Step 2: Delete old note pages**

```bash
rm src/pages/notes/MyNotesPage.tsx src/pages/notes/MyNotesPage.module.scss
rm src/pages/notes/NoteFormPage.tsx src/pages/notes/NoteFormPage.module.scss
```

- [ ] **Step 3: Run TypeScript check**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the dev server and verify**

```bash
bun run dev
```

- Open `http://localhost:5173` in a browser and log in.
- Navigate to `/my-notes` — confirm the Keep grid loads.
- Click "Take a note…" — confirm the creator expands.
- Create a text note, a checklist note.
- Open a note — confirm the edit modal opens.
- Test color picker, pin toggle, label manager, reminder picker.
- Test search by typing in the search bar.
- Create a note with a label, confirm LabelFilter chip appears.
- Confirm the admin `/notes` page still works.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire KeepGrid into routing, remove old MyNotesPage and NoteFormPage"
```
