import { describe, expect, it } from "vitest";
import { toReferenceDocumentView } from "@/lib/game/reference-document-view";

describe("toReferenceDocumentView", () => {
  it("maps legacy body to view body", () => {
    expect(
      toReferenceDocumentView({
        title: "Menu",
        body: "Cappuccino - 1,50 EUR",
      }),
    ).toEqual({
      title: "Menu",
      body: "Cappuccino - 1,50 EUR",
    });
  });

  it("maps figures-only document", () => {
    expect(
      toReferenceDocumentView({
        title: "l'architetto",
        figures: [{ image: "chapters/02/quests/02/ref-prof-architetto", caption: "l'architetto" }],
      }),
    ).toEqual({
      title: "l'architetto",
      figures: [{ image: "chapters/02/quests/02/ref-prof-architetto", caption: "l'architetto" }],
    });
  });

  it("maps gallery with sections", () => {
    const view = toReferenceDocumentView({
      title: "Chi sono?",
      body: "Intro.",
      figures: [
        { image: "chapters/02/quests/03/ref-quiz-verdi", caption: "Giuseppe Verdi" },
        { image: "chapters/02/quests/03/ref-quiz-colombo", caption: "Cristoforo Colombo" },
      ],
      sections: [{ title: "Saviano", body: "Profilo…" }],
    });
    expect(view?.figures).toHaveLength(2);
    expect(view?.sections).toHaveLength(1);
    expect(view?.body).toBe("Intro.");
  });

  it("returns null for invalid payload", () => {
    expect(toReferenceDocumentView({ title: "Vuoto" })).toBeNull();
  });
});
