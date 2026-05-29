import { useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders, handleUnauthorizedResponse } from "../../helpers/authSession";
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

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.2-3.15 1.45 1.45 0 0 1 .95-2.55H17a4 4 0 0 0 4-4C21 6.8 17 3 12 3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
      <circle cx="15" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M14 3l7 7-3 1-4 4v5l-2 2-3.5-6.5L2 12l2-2h5l4-4 1-3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20 13l-7 7L4 11V4h7l9 9z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 7l2 2 4-4M13 8h6M5 17l2 2 4-4M13 18h6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 16l3.5-3.5 2.5 2.5 2-2 2 3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="15.5" cy="9.5" r="1" fill="currentColor" />
    </svg>
  );
}

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
      if (handleUnauthorizedResponse(response)) return;
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
        <PaletteIcon />
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
        <PinIcon filled={isPinned} />
      </button>

      {/* Label manager */}
      <button
        type="button"
        className={`${styles.toolButton} ${openPopover === "label" ? styles.activeButton : ""}`}
        aria-label="Edit labels"
        onClick={() => togglePopover("label")}
      >
        <TagIcon />
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
        <BellIcon />
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
        <ChecklistIcon />
      </button>

      {/* Image upload (only when editing an existing note) */}
      <button
        type="button"
        className={styles.toolButton}
        aria-label="Upload image"
        disabled={!noteId || uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon />
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
