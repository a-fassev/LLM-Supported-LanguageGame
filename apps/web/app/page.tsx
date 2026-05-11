export default function Page() {
  return (
    <main className="page">
      <h1>Language Game Local Start</h1>
      <p>
        Open the browser game at <code>/game</code> after copying a Unity WebGL
        build to <code>apps/web/public/unity-webgl</code>.
      </p>
      <a className="primaryLink" href="/game">
        Open game
      </a>
      <p className="mutedText">
        API endpoint: <code>POST /api/tasks/evaluate</code>
      </p>
    </main>
  );
}
