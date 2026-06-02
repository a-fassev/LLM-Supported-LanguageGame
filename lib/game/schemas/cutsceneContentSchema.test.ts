import { describe, expect, it } from "vitest";
import { parseCutsceneContent } from "@/lib/game/schemas/cutsceneContentSchema";

describe("parseCutsceneContent", () => {
  it("accepts minimal narrator beat", () => {
    const r = parseCutsceneContent({
      beats: [{ presentationMode: "narrator", body: "Hello" }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.beats[0].body).toBe("Hello");
  });

  it("accepts multi-beat dialog with npc cast", () => {
    const r = parseCutsceneContent({
      npcCast: [{ id: "ricci", displayName: "Prof.ssa Ricci", side: "right" }],
      beats: [
        { presentationMode: "narrator", body: "Scene" },
        { presentationMode: "npcDialog", speakerId: "ricci", body: "Ciao!" },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("rejects empty beats array", () => {
    const r = parseCutsceneContent({ beats: [] });
    expect(r.ok).toBe(false);
  });

  it("rejects legacy root title/body", () => {
    const r = parseCutsceneContent({ title: "A", body: "B" });
    expect(r.ok).toBe(false);
  });

  it("rejects unknown keys (strict)", () => {
    const r = parseCutsceneContent({
      beats: [{ presentationMode: "narrator", body: "B" }],
      typoField: "x",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects npcDialog without speakerId", () => {
    const r = parseCutsceneContent({
      beats: [{ presentationMode: "npcDialog", body: "Ciao" }],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects speakerId not in npcCast", () => {
    const r = parseCutsceneContent({
      npcCast: [{ id: "a", displayName: "A" }],
      beats: [{ presentationMode: "npcDialog", speakerId: "missing", body: "Hi" }],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects invalid presentationMode", () => {
    const r = parseCutsceneContent({
      beats: [{ presentationMode: "cinematic", body: "Hi" }],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects invalid npcCast entry", () => {
    const r = parseCutsceneContent({
      npcCast: [{ id: "a", displayName: "" }],
      beats: [{ presentationMode: "narrator", body: "Hi" }],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects negative autoAdvanceMs", () => {
    const r = parseCutsceneContent({
      beats: [{ presentationMode: "narrator", body: "Hi", autoAdvanceMs: -1 }],
    });
    expect(r.ok).toBe(false);
  });
});
