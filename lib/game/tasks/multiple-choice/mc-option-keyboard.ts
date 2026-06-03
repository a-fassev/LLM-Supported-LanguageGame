import type { McOptionView } from "@/lib/game/tasks/multiple-choice/mc-types";

/** Arrow-key selection for single-select MC (radiogroup pattern). */
export function nextMcRadioSelection(
  options: McOptionView[],
  selectedIds: string[],
  direction: "next" | "prev",
): string[] {
  if (options.length === 0) return [];
  const currentIndex = options.findIndex((opt) => selectedIds.includes(opt.id));
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const delta = direction === "next" ? 1 : -1;
  const nextIndex = (startIndex + delta + options.length) % options.length;
  return [options[nextIndex].id];
}
