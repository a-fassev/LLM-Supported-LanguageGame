import { describe, expect, it } from "vitest";
import {
  mergeFreitextSceneContent,
  normalizeReferenceDocumentForTask,
} from "@/lib/game/tasks/freitext/merge-freitext-scene-content";

describe("normalizeReferenceDocumentForTask", () => {
  it("maps catalog body to bodyText", () => {
    expect(
      normalizeReferenceDocumentForTask({
        title: "Menu",
        body: "Caffe - 1,20 EUR",
      }),
    ).toEqual({
      title: "Menu",
      bodyText: "Caffe - 1,20 EUR",
    });
  });

  it("accepts figures without body text", () => {
    expect(
      normalizeReferenceDocumentForTask({
        title: "l'architetto",
        figures: [{ image: "chapters/02/quests/02/ref-prof-architetto", caption: "l'architetto" }],
      }),
    ).toMatchObject({
      title: "l'architetto",
      figures: [{ image: "chapters/02/quests/02/ref-prof-architetto", caption: "l'architetto" }],
    });
  });
});

describe("mergeFreitextSceneContent", () => {
  it("hoists shell referenceDocument when task has none", () => {
    const merged = mergeFreitextSceneContent(
      { prompt: "Ordina al bar" },
      "Scrivi due frasi.",
      { title: "Menu", body: "Cappuccino - 1,50 EUR" },
    );
    expect(merged.instruction).toBe("Scrivi due frasi.");
    expect(merged.referenceDocument).toEqual({
      title: "Menu",
      bodyText: "Cappuccino - 1,50 EUR",
    });
  });

  it("keeps task referenceDocument over shell", () => {
    const merged = mergeFreitextSceneContent(
      {
        prompt: "x",
        referenceDocument: { title: "Task doc", bodyText: "from task" },
      },
      null,
      { title: "Shell", body: "ignored" },
    );
    expect(merged.referenceDocument).toEqual({
      title: "Task doc",
      bodyText: "from task",
    });
  });
});
