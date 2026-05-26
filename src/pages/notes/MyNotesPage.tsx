import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import {
  getAuthHeaders,
  getStoredAuthUser,
  handleUnauthorizedResponse,
  hasPermission,
} from "../../helpers/authSession";
import type User from "../../interfaces/User";
import styles from "./MyNotesPage.module.scss";

type NoteStatus = "published" | "not published" | "archived";

type Note = {
  id: string;
  title: string;
  contents: string;
  status: NoteStatus;
  user: string;
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

export default function MyNotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [authUser] = useState<User | null>(() => getStoredAuthUser());

  const canManageOwnNotes =
    authUser !== null && hasPermission(authUser, "manage_own_notes");

  useEffect(() => {
    if (!authUser || !canManageOwnNotes) return;

    const getMyNotes = async () => {
      try {
        const response = await fetch(
          getApiUrl(`/api/notes/by-user/${authUser.id}`),
          {
            headers: getAuthHeaders(),
          },
        );

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

    getMyNotes();
  }, [authUser, canManageOwnNotes]);

  if (!authUser || !canManageOwnNotes) {
    return <Navigate to="/home" replace />;
  }

  if (loading) return <p>Loading notes...</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>My Notes</h1>
        <Link className={styles.addButton} to="/my-notes/new" aria-label="Add note">
          +
        </Link>
      </div>
      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : notes.length === 0 ? (
        <p className={styles.emptyState}>No notes found.</p>
      ) : (
        <table aria-label="My notes">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr className={styles.noteRow} key={note.id}>
                <td>
                  <button
                    className={styles.rowButton}
                    type="button"
                    onClick={() => navigate(`/my-notes/${note.id}`)}
                  >
                    {note.title}
                  </button>
                </td>
                <td>{formatUpdatedDate(note.updatedAt)}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${getStatusClassName(
                      note.status,
                    )}`}
                  >
                    {getStatusLabel(note.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
