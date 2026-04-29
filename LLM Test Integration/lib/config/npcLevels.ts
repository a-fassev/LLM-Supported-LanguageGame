import { LevelConfig, NpcProfile } from "@/lib/types/chat";

export const levelConfigs: LevelConfig[] = [
  {
    id: "a1-basics",
    label: "A1 Basics",
    cefrBand: "A1",
    learnerGoal: "Simple introductions and daily phrases.",
    expectedVocabulary: ["ciao", "mi chiamo", "ho", "mi piace"],
  },
  {
    id: "a2-school-life",
    label: "A2 School Life",
    cefrBand: "A2",
    learnerGoal: "Describe school routines and preferences.",
    expectedVocabulary: ["scuola", "materia", "dopo", "perché"],
  },
  {
    id: "b1-storytelling",
    label: "B1 Storytelling",
    cefrBand: "B1",
    learnerGoal: "Retell events and explain opinions.",
    expectedVocabulary: ["ieri", "quando", "quindi", "secondo me"],
  },
];

export const npcProfiles: NpcProfile[] = [
  {
    id: "luca-guide",
    name: "Luca",
    tone: "Friendly museum guide",
    scenarioHint: "Explore an old Italian town and ask the learner questions.",
    bilingualHintPolicy: "de-or-en-short-hints",
  },
  {
    id: "sofia-classmate",
    name: "Sofia",
    tone: "Curious classmate",
    scenarioHint: "Talk about school activities and hobbies.",
    bilingualHintPolicy: "de-or-en-short-hints",
  },
  {
    id: "marco-shopkeeper",
    name: "Marco",
    tone: "Helpful market vendor",
    scenarioHint: "Practice ordering, quantities, and polite requests.",
    bilingualHintPolicy: "de-or-en-short-hints",
  },
];

export function getLevelConfig(levelId: string): LevelConfig {
  return levelConfigs.find((level) => level.id === levelId) ?? levelConfigs[0];
}

export function getNpcProfile(npcId: string): NpcProfile {
  return npcProfiles.find((npc) => npc.id === npcId) ?? npcProfiles[0];
}
