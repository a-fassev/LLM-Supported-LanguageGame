import { describe, expect, it } from "vitest";
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

  it("strict mode rejects unknown keys", () => {
    const r = parseQuestMetaPayloadStrict({ unknown: true });
    expect(r.ok).toBe(false);
  });

  it("serializes flow flags", () => {
    const json = serializeQuestMetaJson({
      flow: { blockBack: true, autoStartQuestSlug: "quest-02" },
    });
    expect(JSON.parse(json).flow.autoStartQuestSlug).toBe("quest-02");
  });
});
