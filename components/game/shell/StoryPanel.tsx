import { cn } from "@/lib/utils";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";

type StoryPanelProps = {
  text: string;
};

function renderStoryLine(line: string, index: number) {
  const speakerMatch = line.match(/^([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ' -]{1,32})(?::)?$/);
  if (speakerMatch) {
    return (
      <span key={`${index}-${line}`} className="block">
        <strong>{speakerMatch[1]}:</strong>
      </span>
    );
  }
  return (
    <span key={`${index}-${line}`} className="block">
      {line}
    </span>
  );
}

export function StoryPanel({ text }: StoryPanelProps) {
  return (
    <section
      className={cn(
        "game-panel game-panel-inset mx-auto mt-auto w-fit max-w-xl md:max-w-2xl",
        TASK_PLAY_BODY_TEXT,
      )}
    >
      <p>{text.split("\n").map(renderStoryLine)}</p>
    </section>
  );
}
