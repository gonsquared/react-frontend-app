import { useCallback, useEffect, useState } from "react";
import { getApiUrl, readJsonResponse } from "../../helpers/api";
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
