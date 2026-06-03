import type { TaskOutcomeDto } from "@/lib/game/task-outcome-messages";

/** Learner-facing overlay when the last quest of a `gameFinale` chapter completes. */
export const QUEST_COMPLETE_GAME_FINALE: TaskOutcomeDto = {
  kind: "success",
  ratio: 1,
  awardedSlices: 0,
  awardedBackpackPieces: 0,
  headline: "Percorso completato!",
  body: "Hai completato tutte le sei lezioni a Bologna. Torna al menu quando vuoi rivedere la tua stanza.",
};

export type GameFinaleChapterShape = {
  id: string;
  gameFinale?: boolean;
  quests: string[];
};

export type GameFinaleRunShape = {
  status: string;
  chapterId: string;
  questId: string;
  isGameFinaleQuest?: boolean;
};

/** True when this quest is the last entry in a chapter marked `gameFinale`. */
export function isGameFinaleCatalogQuest(
  catalog: { chapters: GameFinaleChapterShape[] },
  chapterId: string,
  questId: string,
): boolean {
  const chapter = catalog.chapters.find((item) => item.id === chapterId);
  if (!chapter?.gameFinale || chapter.quests.length === 0) return false;
  const lastQuestId = chapter.quests[chapter.quests.length - 1];
  return questId === lastQuestId;
}

export function isGameFinaleCompletedRun(run: GameFinaleRunShape | null | undefined): boolean {
  return run?.status === "completed" && run.isGameFinaleQuest === true;
}
