type StoryPanelProps = {
  text: string;
};

export function StoryPanel({ text }: StoryPanelProps) {
  return (
    <section className="game-panel game-panel-inset mx-auto mt-auto w-fit max-w-xl text-base leading-relaxed md:max-w-2xl md:text-lg">
      <p>{text}</p>
    </section>
  );
}
