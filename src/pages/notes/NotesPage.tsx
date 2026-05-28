import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import {
  getAuthHeaders,
  getStoredAuthUser,
  handleUnauthorizedResponse,
  hasPermission,
} from "../../helpers/authSession";
import { useDialogFocusTrap } from "../../helpers/useDialogFocusTrap";
import { sanitizeHtml } from "../../helpers/sanitizeHtml";
import type User from "../../interfaces/User";
import styles from "./NotesPage.module.scss";

type NoteStatus = "published" | "not published" | "archived";

type Note = {
  id: string;
  title: string;
  contents: string;
  status: NoteStatus;
  user: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
};

const getStatusLabel = (status: NoteStatus) =>
  status
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStatusClassName = (status: NoteStatus) =>
  status === "not published" ? styles.notPublished : styles[status];

const formatUpdatedDate = (updatedAt: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(updatedAt));

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [authUser] = useState<User | null>(() => getStoredAuthUser());
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<NoteStatus>("not published");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusSaveError, setStatusSaveError] = useState("");
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const canManageNotes =
    authUser !== null && hasPermission(authUser, "manage_notes");

  const closeModal = useCallback(() => {
    setSelectedNote(null);
    setIsEditingStatus(false);
    setStatusSaveError("");
  }, []);

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

      const data = await readJsonResponse<Note>(response);
      const updatedAt = data?.updatedAt ?? selectedNote.updatedAt;

      setSelectedNote((prev) =>
        prev ? { ...prev, status: pendingStatus, updatedAt } : prev,
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id ? { ...n, status: pendingStatus, updatedAt } : n,
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

  useEffect(() => {
    if (!authUser || !canManageNotes) return;

    const getNotes = async () => {
      try {
        const response = await fetch(getApiUrl("/api/notes/"), {
          headers: getAuthHeaders(),
        });

        if (handleUnauthorizedResponse(response)) return;

        if (!response.ok) {
          const errorData = await readJsonResponse<{ detail?: unknown }>(
            response,
          );
          throw new Error(
            getErrorMessage(errorData?.detail, "Failed to fetch notes"),
          );
        }

        const data = (await readJsonResponse<Note[]>(response)) ?? [];
        setNotes(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch notes",
        );
      } finally {
        setLoading(false);
      }
    };

    getNotes();
  }, [authUser, canManageNotes]);

  useDialogFocusTrap({
    isOpen: selectedNote !== null,
    dialogRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: closeModal,
  });

  if (!authUser || !canManageNotes) {
    return <Navigate to="/home" replace />;
  }

  if (loading) return <p>Loading notes...</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>Notes</h1>
      </div>
      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : notes.length === 0 ? (
        <p className={styles.emptyState}>No notes found.</p>
      ) : (
        <table aria-label="Notes">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr
                key={note.id}
                className={styles.noteRow}
                onClick={() => {
                  setSelectedNote(note);
                  setIsEditingStatus(false);
                  setStatusSaveError("");
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;

                  e.preventDefault();
                  setSelectedNote(note);
                  setIsEditingStatus(false);
                  setStatusSaveError("");
                }}
                tabIndex={0}
                aria-label={`View note: ${note.title}`}
              >
                <td>{note.title}</td>
                <td>{note.userName}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${getStatusClassName(
                      note.status,
                    )}`}
                  >
                    {getStatusLabel(note.status)}
                  </span>
                </td>
                <td>{formatUpdatedDate(note.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedNote ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="note-modal-title">{selectedNote.title}</h2>
              <button
                ref={closeButtonRef}
                className={styles.closeButton}
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
              >
                ×
              </button>
            </div>
            <div
              className={styles.modalContents}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedNote.contents) }}
            />
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
          </div>
        </div>
      ) : null}
    </>
  );
}
