export function toQuestProgressId(chapterId: string, questId: string): string {
  return `${chapterId}:${questId}`;
}
