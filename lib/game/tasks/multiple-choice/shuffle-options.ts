import type { McOptionView } from "@/lib/game/tasks/multiple-choice/mc-types";

export function shuffleMcOptions(options: McOptionView[]): McOptionView[] {
  const copy = [...options];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
