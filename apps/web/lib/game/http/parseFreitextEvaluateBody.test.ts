import { describe, expect, it } from "vitest";

import { parseFreitextEvaluateBody } from "@/lib/game/http/parseFreitextEvaluateBody";

describe("parseFreitextEvaluateBody", () => {
  it("treats empty and whitespace as empty answer", () => {
    expect(parseFreitextEvaluateBody("")).toEqual({ ok: true, answerText: "" });
    expect(parseFreitextEvaluateBody("   \n\t  ")).toEqual({ ok: true, answerText: "" });
  });

  it("rejects malformed JSON", () => {
    const r = parseFreitextEvaluateBody("{answerText:");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("INVALID_JSON");
    }
  });

  it("rejects non-object JSON roots", () => {
    expect(parseFreitextEvaluateBody("[]").ok).toBe(false);
    expect(parseFreitextEvaluateBody('"hello"').ok).toBe(false);
    expect(parseFreitextEvaluateBody("42").ok).toBe(false);
  });

  it("accepts empty object (default answerText)", () => {
    expect(parseFreitextEvaluateBody("{}")).toEqual({ ok: true, answerText: "" });
  });

  it("accepts answerText string", () => {
    expect(parseFreitextEvaluateBody('{"answerText":"Ciao!"}')).toEqual({
      ok: true,
      answerText: "Ciao!",
    });
  });

  it("rejects non-string answerText", () => {
    const r = parseFreitextEvaluateBody('{"answerText":12}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_PAYLOAD");
  });
});
