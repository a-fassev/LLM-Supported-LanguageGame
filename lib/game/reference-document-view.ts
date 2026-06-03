import { parseReferenceDocument } from "@/lib/game/schemas/referenceDocumentSchema";

export type ReferenceDocumentSectionView = {
  title: string;
  body: string;
};

export type ReferenceDocumentFigureView = {
  image: string;
  caption: string;
  alt?: string;
};

export type ReferenceDocumentView = {
  title: string;
  body?: string;
  sections?: ReferenceDocumentSectionView[];
  figures?: ReferenceDocumentFigureView[];
};

/** Parses catalog/snapshot `referenceDocument` into play overlay props (fail-closed). */
export function toReferenceDocumentView(raw: unknown): ReferenceDocumentView | null {
  const parsed = parseReferenceDocument(raw);
  if (!parsed.ok) return null;

  const value = parsed.value;
  const body =
    (typeof value.bodyText === "string" ? value.bodyText.trim() : "") ||
    (typeof value.body === "string" ? value.body.trim() : "");

  return {
    title: value.title,
    ...(body ? { body } : {}),
    ...(value.sections?.length ? { sections: value.sections } : {}),
    ...(value.figures?.length ? { figures: value.figures } : {}),
  };
}
