type CaptionInput = {
  errorCount: number;
  expectedErrorRange: { min: number; max: number };
  counterCaption?: string;
};

/** When `expectedErrorRange.min !== max`, `{count}` uses the normalized `errorCount` (range max), not the exact authored error tally. */
export function formatErrorSpottingCaption(input: CaptionInput): string {
  const { errorCount, expectedErrorRange, counterCaption } = input;

  if (counterCaption?.trim()) {
    return counterCaption
      .trim()
      .replaceAll("{count}", String(errorCount))
      .replaceAll("{min}", String(expectedErrorRange.min))
      .replaceAll("{max}", String(expectedErrorRange.max));
  }

  if (errorCount === 1) {
    return "Nel testo c'è 1 errore. Trovalo.";
  }

  if (expectedErrorRange.min !== expectedErrorRange.max) {
    return `Nel testo ci sono tra ${expectedErrorRange.min} e ${expectedErrorRange.max} errori. Trovali.`;
  }

  return `Nel testo ci sono ${errorCount} errori. Trovali.`;
}
