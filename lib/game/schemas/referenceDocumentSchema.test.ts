import { describe, expect, it } from "vitest";
import { parseReferenceDocument, referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

describe("referenceDocumentSchema", () => {
  it("accepts legacy title + bodyText", () => {
    const parsed = parseReferenceDocument({
      title: "Documento",
      bodyText: "Testo completo.",
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts catalog body alias", () => {
    const parsed = parseReferenceDocument({
      title: "Documento",
      body: "Testo completo.",
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts single figure without body", () => {
    const parsed = parseReferenceDocument({
      title: "l'architetto",
      figures: [{ image: "chapters/02/quests/02/ref-prof-architetto", caption: "l'architetto" }],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts gallery and sections", () => {
    const parsed = parseReferenceDocument({
      title: "Galleria",
      body: "Intro.",
      figures: [
        { image: "chapters/02/quests/03/ref-quiz-verdi", caption: "Giuseppe Verdi" },
        { image: "chapters/02/quests/03/ref-quiz-colombo", caption: "Cristoforo Colombo" },
      ],
      sections: [{ title: "Saviano", body: "Profilo…" }],
    });
    expect(parsed.ok).toBe(true);
  });

  it("rejects empty document", () => {
    const parsed = referenceDocumentSchema.safeParse({ title: "Vuoto" });
    expect(parsed.success).toBe(false);
  });
});
