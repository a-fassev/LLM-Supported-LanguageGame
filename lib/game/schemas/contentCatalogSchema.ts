import { z } from "zod";
import { pizzaRulesSchema } from "@/lib/game/scoring/pizzaReward";

const idPartSchema = z.string().regex(/^[a-z0-9-]+$/);
export const chapterIdSchema = idPartSchema.regex(/^chapter-\d+$/);
export const questIdSchema = idPartSchema.regex(/^quest-\d+(?:-bonus)?$/);

export const chapterFileSchema = z
  .object({
    id: chapterIdSchema,
    title: z.string().min(1),
    order: z.number().int().min(1),
    quests: z.array(questIdSchema).min(1),
  })
  .strict();

export const questFileSchema = z
  .object({
    id: questIdSchema,
    title: z.string().min(1),
    order: z.number().int().min(1),
    kind: z.enum(["main", "bonus"]),
    requiresQuestId: questIdSchema.nullable(),
    autoStartQuestId: questIdSchema.nullable(),
  })
  .strict();

export const storyScreenTypeSchema = z.enum(["info"]);
export const taskScreenTypeSchema = z.enum([
  "cloze",
  "error_spotting",
  "drag_drop",
  "free_text",
  "matching",
  "multiple_choice",
  "bonus",
]);

export const referenceDocumentSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
  })
  .strict();

const taskContentSchema = z
  .object({
    title: z.string().min(1),
    instruction: z.string().min(1).optional(),
    referenceDocument: referenceDocumentSchema.nullable().optional(),
    task: z.record(z.string(), z.unknown()),
  })
  .strict();

const taskScoringSchema = z
  .object({
    backpack: z
      .object({
        pieces: z.number().int().min(0),
      })
      .strict(),
    pizza: pizzaRulesSchema,
  })
  .strict();

const storySceneSchema = z
  .object({
    id: z.string().min(1),
    scene_type: z.literal("story"),
    screen_type: storyScreenTypeSchema,
    background: z.string().min(1),
    content: z
      .object({
        text: z.string().min(1),
      })
      .strict(),
  })
  .strict();

const taskSceneSchema = z
  .object({
    id: z.string().min(1),
    scene_type: z.literal("task"),
    screen_type: taskScreenTypeSchema,
    background: z.string().min(1),
    content: taskContentSchema,
    scoring: taskScoringSchema,
  })
  .strict();

export const sceneFileSchema = z.discriminatedUnion("scene_type", [storySceneSchema, taskSceneSchema]);

export type ChapterFileParsed = z.infer<typeof chapterFileSchema>;
export type QuestFileParsed = z.infer<typeof questFileSchema>;
export type SceneFileParsed = z.infer<typeof sceneFileSchema>;

export function parseChapterFile(raw: unknown):
  | { ok: true; value: ChapterFileParsed }
  | { ok: false; issues: string } {
  const parsed = chapterFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid chapter file" };
  }
  return { ok: true, value: parsed.data };
}

export function parseQuestFile(raw: unknown):
  | { ok: true; value: QuestFileParsed }
  | { ok: false; issues: string } {
  const parsed = questFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid quest file" };
  }
  return { ok: true, value: parsed.data };
}

export function parseSceneFile(raw: unknown):
  | { ok: true; value: SceneFileParsed }
  | { ok: false; issues: string } {
  const parsed = sceneFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid scene file" };
  }
  return { ok: true, value: parsed.data };
}
