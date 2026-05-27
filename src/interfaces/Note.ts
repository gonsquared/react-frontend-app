export type NoteStatus = "published" | "not published" | "archived";
export type NoteColor =
  | "red" | "pink" | "orange" | "yellow" | "teal"
  | "green" | "cyan" | "blue" | "purple" | "gray"
  | null;
export type NoteType = "text" | "checklist";

export type ChecklistItem = {
  text: string;
  checked: boolean;
};

export type Note = {
  id: string;
  title: string;
  contents: string;
  status: NoteStatus;
  color: NoteColor;
  isPinned: boolean;
  labels: string[];
  noteType: NoteType;
  checklistItems: ChecklistItem[];
  reminderAt: string | null;
  imagePath: string | null;
  user: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
};

export type NotePayload = {
  title: string;
  contents: string;
  status: NoteStatus;
  color: NoteColor;
  isPinned: boolean;
  labels: string[];
  noteType: NoteType;
  checklistItems: ChecklistItem[];
  reminderAt: string | null;
};
