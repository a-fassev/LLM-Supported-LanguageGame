import { describe, expect, it } from "vitest";
import { parseCutsceneContent } from "@/lib/game/schemas/cutsceneContentSchema";

describe("parseCutsceneContent", () => {
  it("accepts minimal v1 payload", () => {
    const r = parseCutsceneContent({ schemaVersion: 1, title: "A", body: "B" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.title).toBe("A");
  });

  it("rejects missing body", () => {
    const r = parseCutsceneContent({ title: "Only title" });
    expect(r.ok).toBe(false);
  });

  it("rejects unknown keys (strict)", () => {
    const r = parseCutsceneContent({
      title: "T",
      body: "B",
      typoField: "x",
    });
    expect(r.ok).toBe(false);
  });
});
