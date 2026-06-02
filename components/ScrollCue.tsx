import styles from "./ScrollCue.module.css";

export default function ScrollCue() {
  return (
    <div className="flex items-center gap-3 pointer-events-none">
      <span className="eyebrow">Scroll</span>
      <span className={styles.cue} aria-hidden>
        <span className={styles.track} />
      </span>
    </div>
  );
}
