import { useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { getAuthHeaders, handleUnauthorizedResponse } from "../../helpers/authSession";
import type { ChecklistItem, Note, NoteColor, NoteType } from "../../interfaces/Note";
import { sanitizeHtml } from "../../helpers/sanitizeHtml";
import NoteToolbar from "./NoteToolbar";
import styles from "./NoteCreator.module.scss";

type Props = {
  allLabels: string[];
  onCreated: (note: Note) => void;
};

export default function NoteCreator({ allLabels, onCreated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<NoteColor>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [noteType, setNoteType] = useState<NoteType>("text");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([{ text: "", checked: false }]);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const getContents = () => sanitizeHtml(editorRef.current?.innerHTML ?? "");

  const isEmpty = () => {
    if (title.trim()) return false;
    if (noteType === "text") {
      const el = document.createElement("div");
      el.innerHTML = editorRef.current?.innerHTML ?? "";
      return !(el.textContent?.trim());
    }
    return checklistItems.every((i) => !i.text.trim());
  };

  const reset = () => {
    setTitle("");
    setColor(null);
    setIsPinned(false);
    setLabels([]);
    setNoteType("text");
    setChecklistItems([{ text: "", checked: false }]);
    setReminderAt(null);
    setErrorMessage("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setExpanded(false);
  };

  const save = async () => {
    if (isEmpty()) { reset(); return; }
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch(getApiUrl("/api/notes/"), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          contents: noteType === "text" ? getContents() : "",
          status: "not published",
          color,
          isPinned,
          labels,
          noteType,
          checklistItems: noteType === "checklist" ? checklistItems.filter((i) => i.text.trim()) : [],
          reminderAt,
        }),
      });
      if (handleUnauthorizedResponse(response)) return;
      if (!response.ok) {
        const err = await readJsonResponse<{ detail?: unknown }>(response);
        throw new Error(getErrorMessage(err?.detail, "Failed to create note"));
      }
      const note = await readJsonResponse<Note>(response);
      if (note) onCreated(note);
      reset();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  const handleContainerBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    void save();
  };

  const updateChecklistItem = (index: number, text: string) =>
    setChecklistItems((prev) => prev.map((item, i) => i === index ? { ...item, text } : item));

  if (!expanded) {
    return (
      <div
        className={styles.wrapper}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(true)}
        tabIndex={0}
        role="button"
        aria-label="Take a note"
      >
        <span className={styles.collapsed}>Take a note…</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.wrapper} onBlur={handleContainerBlur}>
      <div className={styles.expanded}>
        <input
          className={styles.titleInput}
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          aria-label="Note title"
        />
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
          />
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
