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
