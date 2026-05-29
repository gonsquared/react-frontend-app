import { getApiUrl } from "../../helpers/api";
import { getNoteColorHex } from "../../helpers/noteColors";
import { getTextFromHtml } from "../../helpers/sanitizeHtml";
import type { Note } from "../../interfaces/Note";
import styles from "./NoteCard.module.scss";

type Props = {
  note: Note;
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
};

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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
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
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;

        e.preventDefault();
        onClick();
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open note: ${note.title || "Untitled"}`}
    >
      {note.isPinned && (
        <span className={styles.pinnedIcon} aria-label="Pinned">
          <PinIcon filled />
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
          <BellIcon />
          {new Date(note.reminderAt!).toLocaleDateString()}
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
          <PinIcon filled={note.isPinned} />
        </button>
        <button
          type="button"
          className={styles.actionButton}
          aria-label="Delete note"
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
