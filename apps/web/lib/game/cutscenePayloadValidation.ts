import { parseCutsceneContent } from "@/lib/game/schemas/cutsceneContentSchema";

/** Single cutscene authoring problem (operator-facing; logged and returned on 502). */
export type CutscenePayloadErrorDetail = {
  questSlug: string;
  questId: string;
  stepId: string;
  templateKey: string;
  issues: string;
};

/**
 * Shape of `details` when `code === "payload_invalid"` for cutscene schema failures.
 * Bootstrap returns batched `cutscenePayloadErrors`; start/get-run return one flat detail object.
 */
export type CutscenePayloadInvalidApiDetails =
  | { cutscenePayloadErrors: CutscenePayloadErrorDetail[] }
  | CutscenePayloadErrorDetail;

export type QuestStepCutsceneRowInput = {
  id: string;
  step_kind: "cutscene" | "task";
  template_key: string | null;
  content_payload: unknown;
};

export type QuestRowRef = { id: string; slug: string };

/** Shared cutscene row check: non-cutscene steps always succeed. */
export function parseCutsceneStepContent(
  row: Pick<QuestStepCutsceneRowInput, "step_kind" | "content_payload">,
): { ok: true } | { ok: false; issues: string } {
  if (row.step_kind !== "cutscene") return { ok: true };
  const parsed = parseCutsceneContent(row.content_payload);
  if (!parsed.ok) return { ok: false, issues: parsed.issues };
  return { ok: true };
}

export function collectCutscenePayloadErrors(
  questRows: QuestRowRef[],
  stepsByQuest: Map<string, QuestStepCutsceneRowInput[]>,
): CutscenePayloadErrorDetail[] {
  const out: CutscenePayloadErrorDetail[] = [];
  for (const quest of questRows) {
    const stepRows = stepsByQuest.get(quest.id) ?? [];
    for (const row of stepRows) {
      const parsed = parseCutsceneStepContent(row);
      if (!parsed.ok) {
        out.push({
          questSlug: quest.slug,
          questId: quest.id,
          stepId: row.id,
          templateKey: row.template_key ?? "",
          issues: parsed.issues,
        });
      }
    }
  }
  return out;
}
