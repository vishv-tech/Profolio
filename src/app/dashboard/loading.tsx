import styles from "./loading.module.css";

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your portfolio workspace"
      className={styles.loading}
    >
      <div className={styles.container}>
        <div className={styles.shortLine} />
        <div className={styles.hero} />
        <div className={styles.line} />
        <div className={styles.grid}>
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </div>
    </main>
  );
}
