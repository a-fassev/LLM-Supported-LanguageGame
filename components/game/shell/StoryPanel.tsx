import { cn } from "@/lib/utils";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";

type StoryPanelProps = {
  text: string;
};

export function StoryPanel({ text }: StoryPanelProps) {
  return (
    <section
      className={cn(
        "game-panel game-panel-inset mx-auto mt-auto w-fit max-w-xl md:max-w-2xl",
        TASK_PLAY_BODY_TEXT,
      )}
    >
      <p className="whitespace-pre-line">{text}</p>
    </section>
  );
}
