import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { handleUnauthorizedResponse } from "../../helpers/authSession";
import type User from "../../interfaces/User";
import type { UserPermission } from "../../interfaces/User";
import styles from "./NotesPage.module.scss";

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

const getStoredAccessToken = () => localStorage.getItem("accessToken");

const getStoredAuthUser = (): User | null => {
  const authUser = localStorage.getItem("authUser");
  if (!authUser) return null;

  try {
    return JSON.parse(authUser) as User;
  } catch {
    return null;
  }
};

const getUserPermissions = (user: User): UserPermission[] => {
  if (user.permissions) return user.permissions;

  return user.role === "admin"
    ? ["manage_users", "manage_own", "manage_notes", "manage_own_notes"]
    : ["manage_own", "manage_own_notes"];
};

const hasPermission = (user: User, permission: UserPermission): boolean =>
  getUserPermissions(user).includes(permission);

const getAuthHeaders = (): Record<string, string> => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return {};

  return {
    Authorization: `Bearer ${accessToken}`,
  };
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

  const canManageNotes =
    authUser !== null && hasPermission(authUser, "manage_notes");

  useEffect(() => {
    if (!authUser || !canManageNotes) return;

    const getNotes = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/notes/", {
          headers: getAuthHeaders(),
        });

        if (handleUnauthorizedResponse(response)) return;

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch notes");
        }

        const data: Note[] = await response.json();
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
        <table>
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
              <tr key={note.id}>
                <td>{note.title}</td>
                <td>{note.user}</td>
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
    </>
  );
}
