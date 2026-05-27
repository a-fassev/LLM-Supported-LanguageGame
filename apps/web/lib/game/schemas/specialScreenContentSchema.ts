import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";

const photoItemSchema = z
  .object({
    id: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
    caption: z.string().optional(),
    requireLearnerCaption: z.boolean().optional(),
    acceptedCaptions: z.array(z.string()).optional(),
  })
  .passthrough();

const smsChromeSchema = z
  .object({
    messages: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough();

const readerChromeSchema = z
  .object({
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
    bodyText: z.string().optional(),
  })
  .passthrough();

const mailChromeSchema = z
  .object({
    format: z.string().optional(),
    from: z.string().optional(),
    fromText: z.string().optional(),
    to: z.string().optional(),
    toText: z.string().optional(),
    subject: z.string().optional(),
    subjectText: z.string().optional(),
    greeting: z.string().optional(),
    greetingText: z.string().optional(),
    closing: z.string().optional(),
    closingText: z.string().optional(),
    sendButtonText: z.string().optional(),
    sendSuccessText: z.string().optional(),
  })
  .passthrough();

const MAIL_CONTENT_KEYS = [
  "format",
  "from",
  "fromText",
  "to",
  "toText",
  "subject",
  "subjectText",
  "greeting",
  "greetingText",
  "closing",
  "closingText",
  "sendButtonText",
  "sendSuccessText",
] as const;

function mailChromeHasAuthoringContent(mail: unknown): boolean {
  if (mail == null || typeof mail !== "object" || Array.isArray(mail)) return false;
  const record = mail as Record<string, unknown>;
  return MAIL_CONTENT_KEYS.some((key) => {
    const value = record[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export const specialScreenContentSchema = z
  .object({
    ...taskContentCommonFields,
    screenVariant: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    smsChrome: smsChromeSchema.optional(),
    readerChrome: readerChromeSchema.optional(),
    photoViewerChrome: z
      .object({
        displayMode: z.string().optional(),
        showCaptions: z.boolean().optional(),
        items: z.array(photoItemSchema).min(1).optional(),
      })
      .passthrough()
      .optional(),
    mailChrome: mailChromeSchema.optional(),
    blocks: z.array(z.object({ blockType: z.string().optional() }).passthrough()).optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    const blockCount = data.blocks?.length ?? 0;
    const photoItems = data.photoViewerChrome?.items?.length ?? 0;
    const readerBody = data.readerChrome?.bodyText?.trim() ?? "";
    const smsMessages = data.smsChrome?.messages?.length ?? 0;
    const hasMail = mailChromeHasAuthoringContent(data.mailChrome);

    if (readerBody.length > 0 && blockCount > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blocks"],
        message: "readerChrome.bodyText cannot be combined with blocks[]",
      });
    }

    if (blockCount > 0 || photoItems > 0 || readerBody.length > 0 || smsMessages > 0 || hasMail) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocks"],
      message:
        "special screen requires blocks[], photoViewerChrome.items, readerChrome.bodyText, smsChrome.messages, or mailChrome content",
    });
  });

export function parseSpecialScreenContent(raw: unknown):
  | { ok: true; value: z.infer<typeof specialScreenContentSchema> }
  | { ok: false; issues: string } {
  const parsed = specialScreenContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid special screen payload" };
  }
  return { ok: true, value: parsed.data };
}
