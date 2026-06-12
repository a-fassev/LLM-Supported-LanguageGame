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

describe("chapter-05 task answer keys (server scoring)", () => {
  it("Lucca MC accepts all five comprehension answers", async () => {
    const scene = await findScene("chapter-05", "quest-02", 4)();
    const task = scene.content.task as {
      questions: { correctOptionIds: string[] }[];
    };
    const r = evaluateMultipleChoice(task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: mcSelectionsFromQuestions(task.questions) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 5, itemsTotal: 5 });
  });

  it("pro/contro drag_drop accepts full zone assignments", async () => {
    const scene = await findScene("chapter-05", "quest-03", 4)();
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
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 4, itemsTotal: 4 });
  });

  it("aggettivo cloze accepts primary solutions for six gaps", async () => {
    const scene = await findScene("chapter-05", "quest-03", 5)();
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

  it("aggettivo cloze accepts every listed alternate per gap", async () => {
    const scene = await findScene("chapter-05", "quest-03", 5)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const gaps = gapSegmentsFromLines(task.lines);
    expect(gaps).toHaveLength(6);

    for (let gapIndex = 0; gapIndex < gaps.length; gapIndex += 1) {
      const variants = gaps[gapIndex].correctAnswers ?? [];
      expect(variants.length).toBeGreaterThan(0);

      for (const variant of variants) {
        const answers = clozeAnswersFromLines(task.lines);
        answers[gapIndex] = variant;
        const r = evaluateCloze(task, {
          taskType: "ClozeText",
          clozeText: { answers },
        });
        expect(r).toMatchObject({
          ok: true,
          ratio: 1,
          itemsCorrect: 6,
          itemsTotal: 6,
        });
      }
    }
  });

  it("formal mail cloze accepts primary solutions for eleven gaps", async () => {
    const scene = await findScene("chapter-05", "quest-04", 4)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const answers = clozeAnswersFromLines(task.lines);
    expect(answers).toHaveLength(11);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 11, itemsTotal: 11 });
  });

  it("formal mail cloze uses only formulas from the visible word bank", async () => {
    const scene = await findScene("chapter-05", "quest-04", 4)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const gaps = gapSegmentsFromLines(task.lines);
    expect(gaps[0].correctAnswers).toEqual([
      "Egregio Dirigente scolastico, Gentile Professor Sallusti",
    ]);
    expect(scene.content.referenceDocument?.body).toContain("Banca formule:");

    const answers = clozeAnswersFromLines(task.lines);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({
      ok: true,
      ratio: 1,
      itemsCorrect: 11,
      itemsTotal: 11,
    });
  });

  it("imperativo matching accepts all eight pairs", async () => {
    const scene = await findScene("chapter-05", "quest-04", 5)();
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
});
