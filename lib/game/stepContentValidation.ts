import { parseClozeTextContent } from "@/lib/game/schemas/clozeTextContentSchema";
import { parseCutsceneContent } from "@/lib/game/schemas/cutsceneContentSchema";
import { parseDragDropAuthoringContent } from "@/lib/game/schemas/dragDropContentSchema";
import { parseErrorSpottingContent } from "@/lib/game/schemas/errorSpottingContentSchema";
import { parseMatchingContent } from "@/lib/game/schemas/matchingContentSchema";
import { parseMultipleChoiceContent } from "@/lib/game/schemas/multipleChoiceContentSchema";
import { parseFreitextLlmStepContent } from "@/lib/llm/freitextLlmContentSchema";
import { parseSpecialScreenContent } from "@/lib/game/schemas/specialScreenContentSchema";

const SPECIAL_SCREEN_TASK_TYPES = new Set([
  "SpecialScreen",
  "SpecialScreenSms",
  "SpecialScreenMailEditor",
  "SpecialScreenPhotoViewer",
  "SpecialScreenReader",
]);

export type StepPayloadErrorDetail = {
  questSlug: string;
  questId: string;
  stepId: string;
  templateKey: string;
  taskType: string | null;
  issues: string;
};

export type QuestStepRowInput = {
  id: string;
  step_kind: "cutscene" | "task";
  task_type: string | null;
  template_key: string | null;
  content_payload: unknown;
};

export type QuestRowRef = { id: string; slug: string };

function parseTaskContent(taskType: string, payload: unknown): { ok: true } | { ok: false; issues: string } {
  const t = taskType.trim();
  switch (t) {
    case "ClozeText": {
      const r = parseClozeTextContent(payload);
      return r.ok ? { ok: true } : { ok: false, issues: r.issues };
    }
    case "DragDrop": {
      const r = parseDragDropAuthoringContent(payload);
      return r.ok ? { ok: true } : { ok: false, issues: r.issues };
    }
    case "MultipleChoice": {
      const r = parseMultipleChoiceContent(payload);
      return r.ok ? { ok: true } : { ok: false, issues: r.issues };
    }
    case "Matching": {
      const r = parseMatchingContent(payload);
      return r.ok ? { ok: true } : { ok: false, issues: r.issues };
    }
    case "ErrorSpotting": {
      const r = parseErrorSpottingContent(payload);
      return r.ok ? { ok: true } : { ok: false, issues: r.issues };
    }
    case "FreitextLlm": {
      const r = parseFreitextLlmStepContent(payload);
      return r.ok ? { ok: true } : { ok: false, issues: r.issues };
    }
  }

  if (SPECIAL_SCREEN_TASK_TYPES.has(t)) {
    const r = parseSpecialScreenContent(payload, t);
    return r.ok ? { ok: true } : { ok: false, issues: r.issues };
  }

  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, issues: "task content_payload must be an object" };
  }

  return { ok: true };
}

export function parseStepContent(
  row: Pick<QuestStepRowInput, "step_kind" | "task_type" | "content_payload">,
): { ok: true } | { ok: false; issues: string } {
  if (row.step_kind === "cutscene") {
    const parsed = parseCutsceneContent(row.content_payload);
    return parsed.ok ? { ok: true } : { ok: false, issues: parsed.issues };
  }

  if (row.step_kind !== "task") {
    return { ok: false, issues: `unsupported step_kind: ${row.step_kind}` };
  }

  const taskType = row.task_type?.trim() ?? "";
  if (!taskType) {
    return { ok: false, issues: "task step missing task_type" };
  }

  return parseTaskContent(taskType, row.content_payload);
}

export function collectStepPayloadErrors(
  questRows: QuestRowRef[],
  stepsByQuest: Map<string, QuestStepRowInput[]>,
): StepPayloadErrorDetail[] {
  const out: StepPayloadErrorDetail[] = [];
  for (const quest of questRows) {
    const stepRows = stepsByQuest.get(quest.id) ?? [];
    for (const row of stepRows) {
      const parsed = parseStepContent(row);
      if (!parsed.ok) {
        out.push({
          questSlug: quest.slug,
          questId: quest.id,
          stepId: row.id,
          templateKey: row.template_key ?? "",
          taskType: row.task_type,
          issues: parsed.issues,
        });
      }
    }
  }
  return out;
}
