import { describe, expect, it } from "vitest";
import {
  countFreitextAnswerWordsBeyondTemplate,
  isFreitextAnswerMissingTemplateStructure,
  isFreitextAnswerUnchangedTemplate,
} from "@/lib/game/tasks/freitext/freitext-initial-answer";

const template = "nome:\nanno di nascita:\nparticolarità:";

describe("freitext initial answer helpers", () => {
  it("detects unchanged template", () => {
    expect(isFreitextAnswerUnchangedTemplate(template, template)).toBe(true);
    expect(isFreitextAnswerUnchangedTemplate(` ${template} `, template)).toBe(true);
    expect(isFreitextAnswerUnchangedTemplate(`${template}\nRoberto Saviano`, template)).toBe(false);
  });

  it("counts words beyond the template only", () => {
    expect(countFreitextAnswerWordsBeyondTemplate(template, template)).toBe(0);
    expect(
      countFreitextAnswerWordsBeyondTemplate(
        "nome: Roberto Saviano\nanno di nascita:\nparticolarità:",
        template,
      ),
    ).toBe(2);
    expect(countFreitextAnswerWordsBeyondTemplate("Ciao mondo", undefined)).toBe(2);
  });

  it("requires each template line to remain in the answer", () => {
    expect(isFreitextAnswerMissingTemplateStructure(template, template)).toBe(false);
    expect(
      isFreitextAnswerMissingTemplateStructure("nome: Roberto\nanno di nascita:\nparticolarità:", template),
    ).toBe(false);
    expect(isFreitextAnswerMissingTemplateStructure("Roberto Saviano solo", template)).toBe(true);
  });
});
