import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getTextFromHtml } from "../../helpers/sanitizeHtml";
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

  const distinctLabels = useMemo(
    () => Array.from(new Set(notes.flatMap((n) => n.labels))).sort(),
    [notes],
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        if (
          activeLabels.length > 0 &&
          !activeLabels.some((label) => note.labels.includes(label))
        ) {
          return false;
        }

        if (normalizedSearchQuery) {
          const titleMatch = note.title
            .toLowerCase()
            .includes(normalizedSearchQuery);
          const contentMatch = getTextFromHtml(note.contents)
            .toLowerCase()
            .includes(normalizedSearchQuery);
          const checklistMatch = note.checklistItems.some((item) =>
            item.text.toLowerCase().includes(normalizedSearchQuery),
          );

          if (!titleMatch && !contentMatch && !checklistMatch) return false;
        }

        return true;
      }),
    [activeLabels, normalizedSearchQuery, notes],
  );

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((note) => note.isPinned),
    [filteredNotes],
  );
  const otherNotes = useMemo(
    () => filteredNotes.filter((note) => !note.isPinned),
    [filteredNotes],
  );

  if (!authUser || !canManageOwnNotes) {
    return <Navigate to="/home" replace />;
  }

  if (loading) return <p>Loading notes…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.mainColumn}>
        <div className={styles.fixedControls}>
          <div className={styles.searchBar}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <ReminderBanner notes={notes} onNoteUpdated={handleUpdated} />
          <NoteCreator allLabels={allLabels} onCreated={handleCreated} />
        </div>
        <div className={styles.notesScroll}>
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
        </div>
      </div>
      <aside className={styles.labelRail}>
        <div className={styles.labelRailInner}>
          <LabelFilter
            labels={distinctLabels}
            activeLabels={activeLabels}
            onToggle={toggleLabel}
          />
        </div>
      </aside>
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
