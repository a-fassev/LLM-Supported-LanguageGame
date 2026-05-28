import { z } from "zod";

export const referenceDocumentSchema = z
  .object({
    documentId: z.string().optional(),
    title: z.string().min(1),
    bodyText: z.string().min(1),
    buttonLabel: z.string().optional(),
  })
  .strict();

