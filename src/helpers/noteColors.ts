import type { NoteColor } from "../interfaces/Note";

export type ColorOption = {
  key: NoteColor;
  label: string;
  hex: string;
};

export const NOTE_COLORS: ColorOption[] = [
  { key: null, label: "Default", hex: "transparent" },
  { key: "red", label: "Red", hex: "#f28b82" },
  { key: "pink", label: "Pink", hex: "#fdcfe8" },
  { key: "orange", label: "Orange", hex: "#fbbc04" },
  { key: "yellow", label: "Yellow", hex: "#fff475" },
  { key: "teal", label: "Teal", hex: "#a8f0d1" },
  { key: "green", label: "Green", hex: "#ccff90" },
  { key: "cyan", label: "Cyan", hex: "#d3f8f8" },
  { key: "blue", label: "Blue", hex: "#aecbfa" },
  { key: "purple", label: "Purple", hex: "#d7aefb" },
  { key: "gray", label: "Gray", hex: "#e6c9a8" },
];

export const getNoteColorHex = (color: NoteColor): string =>
  NOTE_COLORS.find((c) => c.key === color)?.hex ?? "transparent";
