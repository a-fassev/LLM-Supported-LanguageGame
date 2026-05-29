import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.hero}>
        <p className={styles.eyebrow}>Language game for Italian class</p>
        <h1>L&apos;Enigma di Bologna</h1>
        <p className={styles.intro}>
          Welcome back. Refresh this school year&apos;s Italian knowledge
          through short quests, clues, and practice challenges.
        </p>
      </main>
    </div>
  );
}
