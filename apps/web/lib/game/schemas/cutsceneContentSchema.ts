import { z } from "zod";
import { optionalSceneBackgroundAssetSchema } from "@/lib/game/schemas/gameArtAssetSchema";

export const cutscenePresentationModeSchema = z.enum([
  "narrator",
  "npcDialog",
  "innerMonologue",
  "gameInfo",
]);

export const cutsceneBeatSchema = z
  .object({
    presentationMode: cutscenePresentationModeSchema,
    body: z.string().min(1),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    speakerId: z.string().optional(),
    autoAdvanceMs: z.number().int().positive().optional(),
    primaryCtaLabel: z.string().optional(),
  })
  .strict();

export const cutsceneNpcCastEntrySchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    portraitId: z.string().optional(),
    side: z.enum(["left", "right"]).optional(),
  })
  .strict();

export const cutsceneNavigationSchema = z
  .object({
    blockBack: z.boolean().optional(),
    primaryCtaLabel: z.string().optional(),
  })
  .strict();

/** Cutscene `content_payload` / Unity `contentJson` for `step_kind = cutscene`. */
export const cutsceneContentSchema = z
  .object({
    sceneBackgroundAsset: optionalSceneBackgroundAssetSchema,
    beats: z.array(cutsceneBeatSchema).min(1),
    npcCast: z.array(cutsceneNpcCastEntrySchema).optional(),
    navigation: cutsceneNavigationSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const castIds = new Set((data.npcCast ?? []).map((entry) => entry.id));
    const hasCast = castIds.size > 0;

    data.beats.forEach((beat, index) => {
      if (beat.presentationMode !== "npcDialog")
        return;

      const speakerId = beat.speakerId?.trim() ?? "";
      if (!speakerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["beats", index, "speakerId"],
          message: "speakerId is required when presentationMode is npcDialog",
        });
        return;
      }

      if (hasCast && !castIds.has(speakerId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["beats", index, "speakerId"],
          message: "speakerId must match an id in npcCast",
        });
      }
    });
  });

export type CutsceneContentParsed = z.infer<typeof cutsceneContentSchema>;
export type CutsceneBeatParsed = z.infer<typeof cutsceneBeatSchema>;

export function parseCutsceneContent(raw: unknown):
  | { ok: true; value: CutsceneContentParsed }
  | { ok: false; issues: string } {
  const parsed = cutsceneContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid cutscene payload" };
  }
  return { ok: true, value: parsed.data };
}
