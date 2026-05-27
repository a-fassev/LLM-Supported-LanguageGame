import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureWalletRow: vi.fn(),
  listActiveChaptersOrdered: vi.fn(),
  getWalletTotals: vi.fn(),
  listCompletedQuestIds: vi.fn(),
  listCompletedLogicalTaskKeys: vi.fn(),
  listActiveQuestsByChapterIds: vi.fn(),
  listStepsForQuests: vi.fn(),
  findLatestInProgressRunForAccount: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game/repositories/game-progress-repository")>();
  return {
    ...actual,
    ensureWalletRow: mocks.ensureWalletRow,
    listActiveChaptersOrdered: mocks.listActiveChaptersOrdered,
    getWalletTotals: mocks.getWalletTotals,
    listCompletedQuestIds: mocks.listCompletedQuestIds,
    listCompletedLogicalTaskKeys: mocks.listCompletedLogicalTaskKeys,
    listActiveQuestsByChapterIds: mocks.listActiveQuestsByChapterIds,
    listStepsForQuests: mocks.listStepsForQuests,
    findLatestInProgressRunForAccount: mocks.findLatestInProgressRunForAccount,
  };
});

import { bootstrapGameState } from "./game-progress-service";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const chapter2Id = "22222222-2222-4222-8222-222222222222";
const chapter3Id = "33333333-3333-4333-8333-333333333333";

const storyQuest1Id = "a0000000-0000-4000-8000-000000000001";
const storyQuest2Id = "a0000000-0000-4000-8000-000000000002";
const bonusQuestId = "a0000000-0000-4000-8000-000000000099";
const chapter3QuestId = "b0000000-0000-4000-8000-000000000001";

const cutscenePayload = {
  sceneBackgroundAsset: "static/cutscene-backgrounds/ph-st-cutscene-bg-default",
  beats: [{ presentationMode: "narrator", body: "Ciao." }],
};

const emptyUnlockRules = {
  requiredTotalSlices: 0,
  prerequisiteQuestSlugs: [],
  prerequisiteLogicalTaskKeys: [],
};

function chapterRow(id: string, slug: string, orderIndex: number) {
  return {
    id,
    slug,
    display_name: slug,
    order_index: orderIndex,
    theme_payload: {},
    is_active: true,
  };
}

function questRow(
  id: string,
  chapterId: string,
  slug: string,
  orderIndex: number,
) {
  return {
    id,
    chapter_id: chapterId,
    slug,
    display_name: slug,
    order_index: orderIndex,
    unlock_rules: emptyUnlockRules,
    meta_payload: {},
    is_active: true,
  };
}

function cutsceneStep(questId: string, orderIndex: number) {
  return {
    id: `${questId}-step-${orderIndex}`,
    quest_id: questId,
    order_index: orderIndex,
    step_kind: "cutscene" as const,
    task_type: null,
    template_key: "cutscene.stub",
    logical_task_key: `${questId}-cutscene`,
    content_payload: cutscenePayload,
    reward_rules: {},
    is_active: true,
  };
}

function seedBootstrapFixtures(completedQuestIds: string[]) {
  const chapters = [
    chapterRow(chapter2Id, "chapter-02", 1),
    chapterRow(chapter3Id, "chapter-03", 2),
  ];
  const quests = [
    questRow(storyQuest1Id, chapter2Id, "chapter-02-quest-02-nutelleria", 0),
    questRow(storyQuest2Id, chapter2Id, "chapter-02-quest-04-restaurant", 1),
    questRow(bonusQuestId, chapter2Id, "chapter-02-quest-05-bonus-vocab", 2),
    questRow(chapter3QuestId, chapter3Id, "chapter-03-quest-01-morning-bridge", 0),
  ];
  const steps = quests.flatMap((q) => [cutsceneStep(q.id, 0)]);

  mocks.ensureWalletRow.mockResolvedValue(true);
  mocks.listActiveChaptersOrdered.mockResolvedValue(chapters);
  mocks.getWalletTotals.mockResolvedValue({ totalSlices: 0, totalBackpackPieces: 0 });
  mocks.listCompletedQuestIds.mockResolvedValue(completedQuestIds);
  mocks.listCompletedLogicalTaskKeys.mockResolvedValue([]);
  mocks.listActiveQuestsByChapterIds.mockResolvedValue(quests);
  mocks.listStepsForQuests.mockResolvedValue(steps);
  mocks.findLatestInProgressRunForAccount.mockResolvedValue(null);
}

describe("bootstrapGameState chapter unlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unlocks chapter 3 when chapter 2 story quests are done without bonus", async () => {
    seedBootstrapFixtures([storyQuest1Id, storyQuest2Id]);

    const result = await bootstrapGameState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);

    const chapter3 = result.chapters.find((c) => c.slug === "chapter-03");
    expect(chapter3?.isUnlocked).toBe(true);
    expect(chapter3?.quests[0]?.isUnlocked).toBe(true);
  });

  it("keeps chapter 3 locked when a required chapter 2 story quest is incomplete", async () => {
    seedBootstrapFixtures([storyQuest1Id]);

    const result = await bootstrapGameState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);

    const chapter3 = result.chapters.find((c) => c.slug === "chapter-03");
    expect(chapter3?.isUnlocked).toBe(false);
    expect(chapter3?.unlockHint).toContain("bonus quests are optional");
  });

  it("does not require the chapter 2 bonus quest for chapter 3 unlock", async () => {
    seedBootstrapFixtures([storyQuest1Id, storyQuest2Id]);

    const result = await bootstrapGameState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);

    const chapter2 = result.chapters.find((c) => c.slug === "chapter-02");
    const bonus = chapter2?.quests.find((q) => q.slug === "chapter-02-quest-05-bonus-vocab");
    expect(bonus?.hasCompletedAnyRun).toBe(false);
    expect(result.chapters.find((c) => c.slug === "chapter-03")?.isUnlocked).toBe(true);
  });
});
