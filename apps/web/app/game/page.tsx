export default function GamePage() {
  return (
    <main className="gamePage">
      <header className="gameHeader">
        <h1>Language Game</h1>
        <p>
          If the game does not load, copy your Unity WebGL build files to{" "}
          <code>apps/web/public/unity-webgl</code> and reload this page.
        </p>
      </header>

      <section className="gameFrameWrap">
        <iframe
          title="Unity Language Game"
          src="/unity-webgl/index.html"
          className="gameFrame"
          allowFullScreen
        />
      </section>
    </main>
  );
}
