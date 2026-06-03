/** Standalone punctuation segments are invalid — attach to the preceding word segment. */
const PUNCTUATION_ONLY_PATTERN = /^[.,!?;:…«»"'()[\]-]+$/;

export function validateErrorSpottingSegmentText(
  text: string,
  index: number,
): { ok: true } | { ok: false; message: string } {
  if (text.length === 0) {
    return { ok: false, message: "segment text required" };
  }

  if (/\s$/.test(text)) {
    return {
      ok: false,
      message:
        "segment text must not end with whitespace; start the next segment with a leading space instead",
    };
  }

  if (index === 0 && /^\s/.test(text)) {
    return { ok: false, message: "first segment must not start with whitespace" };
  }

  if (index > 0) {
    if (!text.startsWith(" ")) {
      return {
        ok: false,
        message: "non-first segments must start with exactly one leading space",
      };
    }
    if (/^\s{2,}/.test(text)) {
      return {
        ok: false,
        message: "non-first segments must use a single leading space only",
      };
    }
  }

  const trimmed = text.trim();
  if (PUNCTUATION_ONLY_PATTERN.test(trimmed)) {
    return {
      ok: false,
      message: "punctuation must be part of the preceding word segment, not a separate segment",
    };
  }

  return { ok: true };
}
