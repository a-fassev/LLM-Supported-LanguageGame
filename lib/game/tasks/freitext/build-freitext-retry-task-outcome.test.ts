import { describe, expect, it } from "vitest";
import { buildFreitextRetryTaskOutcome } from "@/lib/game/tasks/freitext/build-freitext-retry-task-outcome";

describe("buildFreitextRetryTaskOutcome", () => {
  it("uses LLM summary in retry body and appends short advice", () => {
    const outcome = buildFreitextRetryTaskOutcome({
      ratio: 0.4,
      summaryFeedback: "Prova a usare due frasi complete.",
      nextStepAdvice: "Aggiungi un saluto.",
    });
    expect(outcome.kind).toBe("retry");
    expect(outcome.body).toContain("Prova a usare");
    expect(outcome.body).toContain("Aggiungi un saluto");
  });
});
