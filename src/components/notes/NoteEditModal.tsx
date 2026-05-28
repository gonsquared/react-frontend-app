import { useEffect, useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders, handleUnauthorizedResponse } from "../../helpers/authSession";
import { useDialogFocusTrap } from "../../helpers/useDialogFocusTrap";
import { sanitizeHtml } from "../../helpers/sanitizeHtml";
import type { ChecklistItem, Note, NoteColor, NoteType } from "../../interfaces/Note";
import NoteToolbar from "./NoteToolbar";
import styles from "./NoteEditModal.module.scss";

type Props = {
  note: Note;
  allLabels: string[];
  onClose: () => void;
  onUpdated: (note: Note) => void;
};

export default function NoteEditModal({ note, allLabels, onClose, onUpdated }: Props) {
  const [title, setTitle] = useState(note.title);
  const [color, setColor] = useState<NoteColor>(note.color);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [labels, setLabels] = useState<string[]>(note.labels);
  const [noteType, setNoteType] = useState<NoteType>(note.noteType);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    note.checklistItems.length > 0 ? note.checklistItems : [{ text: "", checked: false }]
  );
  const [reminderAt, setReminderAt] = useState<string | null>(note.reminderAt);
  const [imagePath, setImagePath] = useState<string | null>(note.imagePath);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(note.contents);
    }
  }, [note.contents]);

  useDialogFocusTrap({
    isOpen: true,
    dialogRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: () => void handleClose(),
  });

  const getContents = () => sanitizeHtml(editorRef.current?.innerHTML ?? "");

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch(getApiUrl(`/api/notes/${note.id}`), {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          contents: noteType === "text" ? getContents() : "",
          color,
          isPinned,
          labels,
          noteType,
          checklistItems: noteType === "checklist" ? checklistItems.filter((i) => i.text.trim()) : [],
          reminderAt,
        }),
      });
      if (handleUnauthorizedResponse(response)) return false;
      if (!response.ok) {
        const err = await readJsonResponse<{ detail?: unknown }>(response);
        throw new Error(getErrorMessage(err?.detail, "Failed to save note"));
      }
      const updated = await readJsonResponse<Note>(response);
      if (updated) onUpdated({ ...updated, imagePath });
      return true;
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to save note");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    const ok = await save();
    if (ok) onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) void handleClose();
  };

  const updateChecklistItem = (index: number, text: string) =>
    setChecklistItems((prev) => prev.map((item, i) => i === index ? { ...item, text } : item));

  const imageUrl = imagePath ? getApiUrl(`/api/images/${imagePath}`) : null;

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit note: ${note.title || "Untitled"}`}
      >
        <input
          className={styles.titleInput}
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          aria-label="Note title"
        />
        {imageUrl && (
          <img className={styles.image} src={imageUrl} alt="" aria-hidden="true" />
        )}
        {noteType === "text" ? (
          <div
            ref={editorRef}
            className={styles.editor}
            role="textbox"
            aria-label="Note contents"
            aria-multiline="true"
            contentEditable={!saving}
            suppressContentEditableWarning
          />
        ) : (
          <div className={styles.checklistArea} aria-label="Checklist items">
            {checklistItems.map((item, i) => (
              <div key={i} className={styles.checklistRow}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    setChecklistItems((prev) =>
                      prev.map((it, idx) => idx === i ? { ...it, checked: e.target.checked } : it)
                    )
                  }
                  aria-label={`Item ${i + 1} checked`}
                />
                <input
                  className={styles.checklistInput}
                  type="text"
                  value={item.text}
                  placeholder="List item…"
                  onChange={(e) => updateChecklistItem(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setChecklistItems((prev) => [
                        ...prev.slice(0, i + 1),
                        { text: "", checked: false },
                        ...prev.slice(i + 1),
                      ]);
                    }
                  }}
                  aria-label={`Checklist item ${i + 1}`}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addItemButton}
              onClick={() => setChecklistItems((prev) => [...prev, { text: "", checked: false }])}
            >
              + Add item
            </button>
          </div>
        )}
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">{errorMessage}</p>
        )}
        <div className={styles.footer}>
          <NoteToolbar
            noteId={note.id}
            color={color}
            isPinned={isPinned}
            labels={labels}
            noteType={noteType}
            reminderAt={reminderAt}
            allLabels={allLabels}
            onColorChange={setColor}
            onPinToggle={() => setIsPinned((p) => !p)}
            onLabelsChange={setLabels}
            onNoteTypeChange={(t) => {
              setNoteType(t);
              setChecklistItems([{ text: "", checked: false }]);
              if (editorRef.current) editorRef.current.innerHTML = "";
            }}
            onReminderChange={setReminderAt}
            onImageUploaded={(path) => setImagePath(path)}
          />
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={() => void handleClose()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
