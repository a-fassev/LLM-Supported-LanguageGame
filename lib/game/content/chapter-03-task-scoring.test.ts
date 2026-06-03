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

function clozeAnswersFromLines(lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[]) {
  const answers: string[] = [];
  for (const line of lines) {
    for (const seg of line.segments) {
      if (seg.kind === "gap" && seg.correctAnswers?.[0]) {
        answers.push(seg.correctAnswers[0]);
      }
    }
  }
  return answers;
}

function mcSelectionsFromQuestions(
  questions: { correctOptionIds: string[] }[],
): string[][] {
  return questions.map((q) => [...q.correctOptionIds]);
}

describe("chapter-03 task answer keys (server scoring)", () => {
  it("museum MC accepts all six authored solutions", async () => {
    const scene = await findScene("chapter-03", "quest-02", 5)();
    const task = scene.content.task as {
      questions: { correctOptionIds: string[] }[];
    };
    const r = evaluateMultipleChoice(task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: mcSelectionsFromQuestions(task.questions) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 6, itemsTotal: 6 });
  });

  it("congiuntivo cloze accepts all nine gap solutions", async () => {
    const scene = await findScene("chapter-03", "quest-03", 9)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const answers = clozeAnswersFromLines(task.lines);
    expect(answers).toHaveLength(9);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 9, itemsTotal: 9 });
  });

  it("accrescitivi matching accepts all eight pairs", async () => {
    const scene = await findScene("chapter-03", "quest-03", 14)();
    const task = scene.content.task as {
      correctPairs: { leftItemId: string; rightItemId: string }[];
    };
    const pairs: Record<string, string> = {};
    for (const p of task.correctPairs) {
      pairs[p.leftItemId] = p.rightItemId;
    }
    const r = evaluateMatching(task, {
      taskType: "Matching",
      matching: { pairs },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 8, itemsTotal: 8 });
  });

  it("suffix cloze accepts primary solutions per gap", async () => {
    const scene = await findScene("chapter-03", "quest-03", 15)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const answers = clozeAnswersFromLines(task.lines);
    expect(answers).toHaveLength(6);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 6, itemsTotal: 6 });
  });

  it("lorenzo MC accepts all four comprehension answers", async () => {
    const scene = await findScene("chapter-03", "quest-04", 8)();
    const task = scene.content.task as {
      questions: { correctOptionIds: string[] }[];
    };
    const r = evaluateMultipleChoice(task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: mcSelectionsFromQuestions(task.questions) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 4, itemsTotal: 4 });
  });

  it("si impersonale cloze accepts all eighteen gap solutions", async () => {
    const scene = await findScene("chapter-03", "quest-04", 11)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const answers = clozeAnswersFromLines(task.lines);
    expect(answers).toHaveLength(18);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 18, itemsTotal: 18 });
  });

  it("made in italy drag_drop accepts full zone assignments", async () => {
    const scene = await findScene("chapter-03", "quest-04", 15)();
    const task = scene.content.task as {
      targets: { id: string; correctItemIds: string[] }[];
    };
    const assignments: Record<string, string[]> = {};
    for (const t of task.targets) {
      assignments[t.id] = [...t.correctItemIds];
    }
    const r = evaluateDragDrop(task, {
      taskType: "DragDrop",
      dragDrop: { assignments },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 6, itemsTotal: 6 });
  });
});
