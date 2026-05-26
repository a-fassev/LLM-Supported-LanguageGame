import { describe, expect, it, vi } from "vitest";
import {
  parseQuestMetaPayload,
  parseQuestMetaPayloadStrict,
  serializeQuestMetaJson,
} from "@/lib/game/schemas/questMetaPayloadSchema";

describe("questMetaPayloadSchema", () => {
  it("parses reference document leniently", () => {
    const meta = parseQuestMetaPayload({
      referenceDocument: {
        title: "Brochure",
        bodyText: "Long text",
        buttonLabel: "Open",
      },
    });
    expect(meta.referenceDocument?.title).toBe("Brochure");
  });

  it("returns empty object for invalid root", () => {
    expect(parseQuestMetaPayload(null)).toEqual({});
    expect(parseQuestMetaPayload("bad")).toEqual({});
  });

  it("warns and strips invalid object keys", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseQuestMetaPayload({ unknown: true })).toEqual({});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("strict mode rejects unknown keys", () => {
    const r = parseQuestMetaPayloadStrict({ unknown: true });
    expect(r.ok).toBe(false);
  });

  it("lenient parse warns and strips when unknown key accompanies flow", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      parseQuestMetaPayload({
        flow: { blockBack: true },
        typoField: true,
      }),
    ).toEqual({});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("serializes flow flags", () => {
    const json = serializeQuestMetaJson({
      flow: { blockBack: true, autoStartQuestSlug: "quest-02" },
    });
    expect(JSON.parse(json).flow.autoStartQuestSlug).toBe("quest-02");
  });
});
