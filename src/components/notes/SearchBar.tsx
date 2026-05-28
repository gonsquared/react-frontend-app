import styles from "./SearchBar.module.scss";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <form
      className={styles.form}
      role="search"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        className={styles.input}
        type="search"
        placeholder="Search notes…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search notes"
      />
    </form>
  );
}
