import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";
import {
  evaluateCloze,
  evaluateDragDrop,
  evaluateMatching,
  evaluateMultipleChoice,
} from "@/lib/game/scoring/evaluateTaskAttempt";

function findScene(chapterId: string, questId: string, sceneNum: number) {
  return async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === chapterId);
    const quest = chapter?.questsExpanded.find((q) => q.id === questId);
    const nn = String(sceneNum).padStart(2, "0");
    const scene = quest?.scenes.find((s) => s.id === `${chapterId}-${questId}-scene-${nn}`);
    expect(scene?.scene_type).toBe("task");
    return scene!;
  };
}

function clozeAnswersFromLines(
  lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[],
  pickIndex = 0,
) {
  const answers: string[] = [];
  for (const line of lines) {
    for (const seg of line.segments) {
      if (seg.kind === "gap" && seg.correctAnswers?.[pickIndex]) {
        answers.push(seg.correctAnswers[pickIndex]);
      }
    }
  }
  return answers;
}

function gapSegmentsFromLines(
  lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[],
) {
  const gaps: { correctAnswers?: string[] }[] = [];
  for (const line of lines) {
    for (const seg of line.segments) {
      if (seg.kind === "gap") {
        gaps.push(seg);
      }
    }
  }
  return gaps;
}

function mcSelectionsFromQuestions(
  questions: { correctOptionIds: string[] }[],
): string[][] {
  return questions.map((q) => [...q.correctOptionIds]);
}

function matchingPairsFromCorrect(
  correctPairs: { leftItemId: string; rightItemId: string }[],
): Record<string, string> {
  const pairs: Record<string, string> = {};
  for (const p of correctPairs) {
    pairs[p.leftItemId] = p.rightItemId;
  }
  return pairs;
}

describe("chapter-06 task answer keys (server scoring)", () => {
  it("prof line matching accepts all five row references", async () => {
    const scene = await findScene("chapter-06", "quest-02", 3)();
    const task = scene.content.task as {
      correctPairs: { leftItemId: string; rightItemId: string }[];
    };
    const r = evaluateMatching(task, {
      taskType: "Matching",
      matching: { pairs: matchingPairsFromCorrect(task.correctPairs) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 5, itemsTotal: 5 });
  });

  it("interview matching accepts all eight question-answer pairs", async () => {
    const scene = await findScene("chapter-06", "quest-02", 4)();
    const task = scene.content.task as {
      correctPairs: { leftItemId: string; rightItemId: string }[];
    };
    const r = evaluateMatching(task, {
      taskType: "Matching",
      matching: { pairs: matchingPairsFromCorrect(task.correctPairs) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 8, itemsTotal: 8 });
  });

  it("indirect speech drag_drop accepts all ten inserted answers", async () => {
    const scene = await findScene("chapter-06", "quest-02", 5)();
    const task = scene.content.task as {
      targets: { id: string; correctItemIds: string[] }[];
    };
    const assignments: Record<string, string[]> = {};
    for (const target of task.targets) {
      assignments[target.id] = [...target.correctItemIds];
    }
    const r = evaluateDragDrop(task, {
      taskType: "DragDrop",
      dragDrop: { assignments },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 10, itemsTotal: 10 });
  });

  it("Sicily emphasis cloze accepts all five gap answers", async () => {
    const scene = await findScene("chapter-06", "quest-03", 3)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const gaps = gapSegmentsFromLines(task.lines);
    expect(gaps).toHaveLength(5);
    for (const g of gaps) {
      expect(g.correctAnswers?.length).toBeGreaterThanOrEqual(1);
    }
    const answers = clozeAnswersFromLines(task.lines);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 5, itemsTotal: 5 });
  });

  it("quiz MC accepts all sixteen book keys", async () => {
    const scene = await findScene("chapter-06", "quest-04", 3)();
    const task = scene.content.task as {
      questions: { correctOptionIds: string[] }[];
    };
    const r = evaluateMultipleChoice(task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: mcSelectionsFromQuestions(task.questions) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 16, itemsTotal: 16 });
  });
});
