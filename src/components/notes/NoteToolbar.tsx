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
