import { useCallback, useEffect, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { useDialogFocusTrap } from "../../helpers/useDialogFocusTrap";
import {
  getAuthHeaders,
  getStoredAuthUser,
  handleUnauthorizedResponse,
  hasPermission,
} from "../../helpers/authSession";
import type User from "../../interfaces/User";
import { sanitizeHtml } from "../../helpers/sanitizeHtml";
import styles from "./NoteFormPage.module.scss";

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

type NotePayload = {
  title: string;
  contents: string;
  status: Exclude<NoteStatus, "archived">;
};

const getTextFromHtml = (html: string) => {
  const element = document.createElement("div");
  element.innerHTML = sanitizeHtml(html);
  return element.textContent?.trim() ?? "";
};

export default function NoteFormPage() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const publishModalRef = useRef<HTMLDivElement | null>(null);
  const publishCancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [authUser] = useState<User | null>(() => getStoredAuthUser());
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [loading, setLoading] = useState(noteId !== undefined);
  const [saving, setSaving] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isEditing = noteId !== undefined;

  const canManageOwnNotes =
    authUser !== null && hasPermission(authUser, "manage_own_notes");

  useEffect(() => {
    if (!noteId || !authUser || !canManageOwnNotes) return;

    const getNote = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/notes/${noteId}`), {
          headers: getAuthHeaders(),
        });

        if (handleUnauthorizedResponse(response)) return;

        if (!response.ok) {
          const errorData = await readJsonResponse<{ detail?: unknown }>(
            response,
          );
          throw new Error(
            getErrorMessage(errorData?.detail, "Failed to fetch note"),
          );
        }

        const note = await readJsonResponse<Note>(response);
        if (!note) throw new Error("Failed to fetch note");
        setTitle(note.title);
        setContents(sanitizeHtml(note.contents));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch note",
        );
      } finally {
        setLoading(false);
      }
    };

    getNote();
  }, [authUser, canManageOwnNotes, noteId]);

  useEffect(() => {
    if (!loading && editorRef.current && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = contents;
    }
  }, [contents, loading]);

  const closePublishModal = useCallback(() => {
    setIsPublishModalOpen(false);
  }, []);

  useDialogFocusTrap({
    isOpen: isPublishModalOpen,
    dialogRef: publishModalRef,
    initialFocusRef: publishCancelButtonRef,
    onEscape: closePublishModal,
  });

  const updateContents = () => {
    setContents(sanitizeHtml(editorRef.current?.innerHTML ?? ""));
  };

  const formatContents = (command: "bold" | "italic" | "insertUnorderedList") => {
    editorRef.current?.focus();
    document.execCommand(command);
    updateContents();
  };

  const getNotePayload = (status: NotePayload["status"]) => {
    const payload: NotePayload = {
      title: title.trim(),
      contents,
      status,
    };

    if (!payload.title || !getTextFromHtml(payload.contents)) {
      setErrorMessage("Title and contents are required.");
      return null;
    }

    return payload;
  };

  const openPublishModal = () => {
    setErrorMessage("");

    if (getNotePayload("published")) {
      setIsPublishModalOpen(true);
    }
  };

  const handleEditorPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    updateContents();
  };

  const saveNote = async (status: NotePayload["status"]) => {
    setErrorMessage("");
    const payload = getNotePayload(status);
    if (!payload) return;

    setSaving(true);

    try {
      const response = await fetch(
        isEditing
          ? getApiUrl(`/api/notes/${noteId}`)
          : getApiUrl("/api/notes/"),
        {
          method: isEditing ? "PUT" : "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        },
      );

      if (handleUnauthorizedResponse(response)) return;

      if (!response.ok) {
        const errorData = await readJsonResponse<{ detail?: unknown }>(
          response,
        );
        throw new Error(
          getErrorMessage(errorData?.detail, "Failed to save note"),
        );
      }

      navigate("/my-notes");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save note",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!authUser || !canManageOwnNotes) {
    return <Navigate to="/home" replace />;
  }

  if (loading) return <p>Loading note...</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>{isEditing ? "Edit Note" : "New Note"}</h1>
        <Link className={styles.backLink} to="/my-notes">
          Back
        </Link>
      </div>
      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          openPublishModal();
        }}
      >
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            disabled={saving}
          />
        </label>
        <div className={styles.editorField}>
          <span id="note-contents-label">Contents</span>
          <div className={styles.editorToolbar} aria-label="Formatting tools">
            <button
              type="button"
              aria-label="Bold"
              onClick={() => formatContents("bold")}
              disabled={saving}
            >
              B
            </button>
            <button
              type="button"
              aria-label="Italic"
              onClick={() => formatContents("italic")}
              disabled={saving}
            >
              I
            </button>
            <button
              type="button"
              aria-label="Bulleted list"
              onClick={() => formatContents("insertUnorderedList")}
              disabled={saving}
            >
              List
            </button>
          </div>
          <div
            ref={editorRef}
            className={styles.editor}
            role="textbox"
            aria-labelledby="note-contents-label"
            aria-multiline="true"
            contentEditable={!saving}
            onInput={updateContents}
            onPaste={handleEditorPaste}
            suppressContentEditableWarning
          />
        </div>
        <div className={styles.formActions}>
          <Link to="/my-notes">Cancel</Link>
          <button
            type="button"
            onClick={() => void saveNote("not published")}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save as draft"}
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
      {isPublishModalOpen ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
            ref={publishModalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-note-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="publish-note-title">Publish note?</h2>
            </div>
            <div className={styles.modalBody}>
              <p>This will make the note visible as published.</p>
            </div>
            <div className={styles.modalActions}>
              <button
                ref={publishCancelButtonRef}
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPublishModalOpen(false);
                  void saveNote("published");
                }}
                disabled={saving}
              >
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
