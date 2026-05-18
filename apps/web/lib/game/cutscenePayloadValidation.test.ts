import { describe, expect, it } from "vitest";
import {
  collectCutscenePayloadErrors,
  parseCutsceneStepContent,
} from "@/lib/game/cutscenePayloadValidation";

describe("parseCutsceneStepContent", () => {
  it("skips task rows", () => {
    const r = parseCutsceneStepContent({
      step_kind: "task",
      content_payload: { not: "a cutscene" },
    });
    expect(r.ok).toBe(true);
  });

  it("validates cutscene rows", () => {
    const ok = parseCutsceneStepContent({
      step_kind: "cutscene",
      content_payload: { title: "A", body: "B" },
    });
    expect(ok.ok).toBe(true);

    const bad = parseCutsceneStepContent({
      step_kind: "cutscene",
      content_payload: { title: "Only title" },
    });
    expect(bad.ok).toBe(false);
  });
});

describe("collectCutscenePayloadErrors", () => {
  it("returns all invalid cutscenes across quests (bootstrap-style)", () => {
    const quests = [
      { id: "q1", slug: "quest-a" },
      { id: "q2", slug: "quest-b" },
    ];
    const stepsByQuest = new Map([
      [
        "q1",
        [
          {
            id: "s1",
            step_kind: "cutscene" as const,
            template_key: "cutscene.intro",
            content_payload: { title: "T", body: "ok" },
          },
          {
            id: "s2",
            step_kind: "cutscene" as const,
            template_key: "cutscene.bad",
            content_payload: { title: "no-body" },
          },
        ],
      ],
      [
        "q2",
        [
          {
            id: "s3",
            step_kind: "cutscene" as const,
            template_key: "cutscene.other",
            content_payload: { typo: true, title: "x", body: "y" },
          },
        ],
      ],
    ]);

    const errors = collectCutscenePayloadErrors(quests, stepsByQuest);
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.stepId).sort()).toEqual(["s2", "s3"]);
    expect(errors.find((e) => e.stepId === "s2")?.questSlug).toBe("quest-a");
    expect(errors.find((e) => e.stepId === "s3")?.questSlug).toBe("quest-b");
  });
});
