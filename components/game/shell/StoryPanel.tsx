import { cn } from "@/lib/utils";

type StoryPanelProps = {
  variant: "dialog" | "interaction";
  text: string;
};

export function StoryPanel({ variant, text }: StoryPanelProps) {
  return (
    <section
      className={cn(
        "game-panel game-panel-inset text-base leading-relaxed md:text-lg",
        variant === "dialog"
          ? "mx-auto my-auto w-full max-w-3xl"
          : "mx-auto mt-auto w-fit max-w-xl md:max-w-2xl",
      )}
    >
      <p>{text}</p>
    </section>
  );
}
