import { describe, expect, it } from "vitest";
import { collectStepPayloadErrors, parseStepContent } from "@/lib/game/stepContentValidation";

describe("parseStepContent", () => {
  it("accepts valid cutscene beats", () => {
    const r = parseStepContent({
      step_kind: "cutscene",
      task_type: null,
      content_payload: {
        beats: [{ presentationMode: "narrator", body: "Ciao." }],
      },
    });
    expect(r.ok).toBe(true);
  });

  it("accepts drag-drop targets with matchMode all", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "DragDrop",
      content_payload: {
        sceneBackgroundAsset: "static/task-scene-backgrounds/ph-st-task-bg-default",
        items: [{ id: "a", label: "A" }],
        targets: [
          {
            id: "bucket",
            matchMode: "all",
            correctItemIds: ["a", "b"],
          },
        ],
      },
    });
    expect(r.ok).toBe(true);
  });

  it("rejects drag-drop targets with invalid matchMode", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "DragDrop",
      content_payload: {
        sceneBackgroundAsset: "static/task-scene-backgrounds/ph-st-task-bg-default",
        items: [{ id: "a", label: "A" }],
        targets: [{ id: "t1", matchMode: "alll", correctItemIds: ["a"] }],
      },
    });
    expect(r.ok).toBe(false);
  });

  it("accepts cloze task with scene background", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "ClozeText",
      content_payload: {
        sceneBackgroundAsset: "Static/Task-Scene-Backgrounds/ph-st-task-bg-default",
        prompt: "Completa.",
        lines: [{ segments: [{ kind: "literal", text: "Ciao " }, { kind: "gap", correctAnswers: ["mondo"] }] }],
      },
    });
    expect(r.ok).toBe(true);
  });

  it("accepts special screen reader mode", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "SpecialScreenReader",
      content_payload: {
        readerChrome: { bodyText: "Ciao mondo." },
      },
    });
    expect(r.ok).toBe(true);
  });

  it("rejects cutscene without beats", () => {
    const r = parseStepContent({
      step_kind: "cutscene",
      task_type: null,
      content_payload: {},
    });
    expect(r.ok).toBe(false);
  });

  it("rejects empty special screen payload", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "SpecialScreen",
      content_payload: { title: "only title" },
    });
    expect(r.ok).toBe(false);
  });

  it("rejects reader chrome combined with blocks", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "SpecialScreenReader",
      content_payload: {
        readerChrome: { bodyText: "Ciao." },
        blocks: [{ blockType: "stub" }],
      },
    });
    expect(r.ok).toBe(false);
  });

  it("rejects mail editor without blocks", () => {
    const r = parseStepContent({
      step_kind: "task",
      task_type: "SpecialScreenMailEditor",
      content_payload: {
        mailChrome: { greeting: "Ciao" },
      },
    });
    expect(r.ok).toBe(false);
  });
});

describe("collectStepPayloadErrors", () => {
  it("batches errors across quests", () => {
    const quests = [{ id: "q1", slug: "quest-one" }];
    const stepsByQuest = new Map([
      [
        "q1",
        [
          {
            id: "s1",
            step_kind: "cutscene" as const,
            task_type: null,
            template_key: "cut",
            content_payload: {},
          },
        ],
      ],
    ]);
    const errors = collectStepPayloadErrors(quests, stepsByQuest);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.questSlug).toBe("quest-one");
    expect(errors[0]?.taskType).toBeNull();
  });
});
