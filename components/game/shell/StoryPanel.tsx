import { cn } from "@/lib/utils";

type StoryPanelProps = {
  variant: "dialog" | "interaction";
  text: string;
};

export function StoryPanel({ variant, text }: StoryPanelProps) {
  return (
    <section
      className={cn(
        "game-panel max-w-3xl p-4 text-base leading-relaxed md:p-6 md:text-lg",
        variant === "dialog" ? "mx-auto mt-auto mb-20" : "ml-auto mt-auto mb-24 mr-4 md:mr-10",
      )}
    >
      <p>{text}</p>
    </section>
  );
}
