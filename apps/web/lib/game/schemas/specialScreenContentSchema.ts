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
    messages: z.array(z.object({ direction: z.string().optional() }).passthrough()).optional(),
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

export type SpecialScreenModeFlags = {
  useReader: boolean;
  useMail: boolean;
  usePhoto: boolean;
  useMessenger: boolean;
};

function mailChromeHasAuthoringContent(mail: unknown): boolean {
  if (mail == null || typeof mail !== "object" || Array.isArray(mail)) return false;
  const record = mail as Record<string, unknown>;
  return MAIL_CONTENT_KEYS.some((key) => {
    const value = record[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function isMessengerVariant(screenVariant: string | undefined): boolean {
  const v = screenVariant?.trim().toLowerCase() ?? "";
  return v === "sms" || v === "whatsapp";
}

export function resolveSpecialScreenModes(
  data: {
    screenVariant?: string;
    smsChrome?: { messages?: unknown[] };
    readerChrome?: { bodyText?: string };
    photoViewerChrome?: { items?: unknown[] };
    mailChrome?: unknown;
    blocks?: unknown[];
  },
  taskType: string | null | undefined,
): SpecialScreenModeFlags {
  const tt = taskType?.trim() ?? "";
  const sv = data.screenVariant?.trim().toLowerCase() ?? "";
  const smsCount = data.smsChrome?.messages?.length ?? 0;

  const useReader = tt === "SpecialScreenReader" || sv === "reader";
  const useMail =
    !useReader &&
    (tt === "SpecialScreenMailEditor" || sv === "mail" || sv === "letter");
  const usePhoto =
    !useReader &&
    !useMail &&
    (tt === "SpecialScreenPhotoViewer" || sv === "photo");
  const useMessenger =
    !useReader &&
    !usePhoto &&
    smsCount > 0 &&
    (tt === "SpecialScreenSms" || isMessengerVariant(data.screenVariant));

  return { useReader, useMail, usePhoto, useMessenger };
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
  .passthrough();

function refineSpecialScreenByTaskType(
  data: z.infer<typeof specialScreenContentSchema>,
  taskType: string | null | undefined,
  ctx: z.RefinementCtx,
): void {
  const blockCount = data.blocks?.length ?? 0;
  const photoItems = data.photoViewerChrome?.items?.length ?? 0;
  const readerBody = data.readerChrome?.bodyText?.trim() ?? "";
  const smsMessages = data.smsChrome?.messages?.length ?? 0;
  const hasMailContent = mailChromeHasAuthoringContent(data.mailChrome);
  const modes = resolveSpecialScreenModes(data, taskType);

  if (readerBody.length > 0 && blockCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocks"],
      message: "readerChrome.bodyText cannot be combined with blocks[]",
    });
  }

  if (modes.useReader) {
    if (!readerBody) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["readerChrome", "bodyText"],
        message: "readerChrome.bodyText is required for reader mode",
      });
    }
    return;
  }

  if (modes.usePhoto) {
    if (photoItems < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photoViewerChrome", "items"],
        message: "photoViewerChrome.items is required for photo mode",
      });
    }
    if (smsMessages > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["smsChrome", "messages"],
        message: "smsChrome.messages cannot be combined with photo mode",
      });
    }
    return;
  }

  if (modes.useMail) {
    if (smsMessages > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["smsChrome", "messages"],
        message: "smsChrome.messages cannot be combined with mail mode",
      });
    }
    if (!hasMailContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mailChrome"],
        message: "mailChrome requires at least one authored field",
      });
    }
    if (blockCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blocks"],
        message: "blocks[] is required for mail editor mode",
      });
    }
    return;
  }

  if (!modes.useReader && blockCount < 1 && photoItems < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocks"],
      message: "special screen requires blocks[], photoViewerChrome.items, or readerChrome.bodyText",
    });
    return;
  }

  if (modes.useMessenger && blockCount < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocks"],
      message: "blocks[] is required for SMS/messenger mode",
    });
  }
}

export function parseSpecialScreenContent(
  raw: unknown,
  taskType?: string | null,
): { ok: true; value: z.infer<typeof specialScreenContentSchema> } | { ok: false; issues: string } {
  const parsed = specialScreenContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid special screen payload" };
  }

  const issues: z.ZodIssue[] = [];
  const ctx: z.RefinementCtx = {
    addIssue: (issue) => issues.push(issue),
    path: [],
  };
  refineSpecialScreenByTaskType(parsed.data, taskType, ctx);

  if (issues.length > 0) {
    const message = issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: message || "invalid special screen payload" };
  }

  return { ok: true, value: parsed.data };
}
