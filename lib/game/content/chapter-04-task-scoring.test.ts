import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";
import {
  evaluateCloze,
  evaluateErrorSpotting,
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

function errorSpottingAttemptFromSegments(
  segments: { id: string; isError?: boolean; acceptedCorrections?: string[] }[],
) {
  const selectedSegmentIds: string[] = [];
  const corrections: Record<string, string> = {};
  for (const seg of segments) {
    if (seg.isError && seg.acceptedCorrections?.[0]) {
      selectedSegmentIds.push(seg.id);
      corrections[seg.id] = seg.acceptedCorrections[0];
    }
  }
  return { selectedSegmentIds, corrections };
}

describe("chapter-04 task answer keys (server scoring)", () => {
  it("Sara cloze accepts all sixteen gap solutions", async () => {
    const scene = await findScene("chapter-04", "quest-02", 14)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const answers = clozeAnswersFromLines(task.lines);
    expect(answers).toHaveLength(16);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 16, itemsTotal: 16 });
  });

  it("error spotting accepts the three Sara corrections", async () => {
    const scene = await findScene("chapter-04", "quest-02", 16)();
    const task = scene.content.task as {
      segments: { id: string; isError?: boolean; acceptedCorrections?: string[] }[];
    };
    const attemptPayload = errorSpottingAttemptFromSegments(task.segments);
    expect(attemptPayload.selectedSegmentIds).toHaveLength(3);
    const r = evaluateErrorSpotting(task, {
      taskType: "ErrorSpotting",
      errorSpotting: attemptPayload,
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 3, itemsTotal: 3 });
  });

  it("error spotting uses the clarified four-sentence Sara task", async () => {
    const scene = await findScene("chapter-04", "quest-02", 16)();
    const task = scene.content.task as {
      expectedErrorRange: { min: number; max: number };
      segments: { id: string; isError?: boolean; acceptedCorrections?: string[] }[];
    };
    expect(task.expectedErrorRange).toEqual({ min: 3, max: 3 });
    expect(task.segments.some((segment) => segment.id.startsWith("es5-"))).toBe(false);
    const attemptPayload = errorSpottingAttemptFromSegments(task.segments);
    const r = evaluateErrorSpotting(task, {
      taskType: "ErrorSpotting",
      errorSpotting: attemptPayload,
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 3, itemsTotal: 3 });
  });

  it("invito MC accepts all four comprehension answers", async () => {
    const scene = await findScene("chapter-04", "quest-04", 5)();
    const task = scene.content.task as {
      questions: { correctOptionIds: string[] }[];
    };
    const r = evaluateMultipleChoice(task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: mcSelectionsFromQuestions(task.questions) },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 4, itemsTotal: 4 });
  });

  it("SMS cloze accepts primary solutions for eight gaps", async () => {
    const scene = await findScene("chapter-04", "quest-04", 9)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const answers = clozeAnswersFromLines(task.lines);
    expect(answers).toHaveLength(8);
    const r = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: { answers },
    });
    expect(r).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 8, itemsTotal: 8 });
  });

  it("SMS cloze accepts every listed alternate answer per gap", async () => {
    const scene = await findScene("chapter-04", "quest-04", 9)();
    const task = scene.content.task as {
      lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
    };
    const gaps = gapSegmentsFromLines(task.lines);
    expect(gaps).toHaveLength(8);

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
          itemsCorrect: 8,
          itemsTotal: 8,
        });
      }
    }
  });
});
