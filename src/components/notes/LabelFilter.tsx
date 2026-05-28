import styles from "./LabelFilter.module.scss";

type Props = {
  labels: string[];
  activeLabels: string[];
  onToggle: (label: string) => void;
};

export default function LabelFilter({ labels, activeLabels, onToggle }: Props) {
  if (labels.length === 0) return null;

  return (
    <div className={styles.filter} role="group" aria-label="Filter by label">
      {labels.map((label) => {
        const isActive = activeLabels.includes(label);
        return (
          <button
            key={label}
            type="button"
            className={`${styles.chip} ${isActive ? styles.activeChip : ""}`}
            aria-pressed={isActive}
            onClick={() => onToggle(label)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
