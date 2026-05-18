import { z } from "zod";

export type RoundingMode = "floor" | "ceil" | "nearest";

const roundingSchema = z.enum(["floor", "ceil", "nearest"]);

const linearMappingSchema = z.object({
  kind: z.literal("linear"),
});

const bandSchema = z.object({
  minRatio: z.number(),
  slices: z.number(),
});

const bandsMappingSchema = z.object({
  kind: z.literal("bands"),
  /** Bands sorted by minRatio ascending in authoring; parser sorts defensively. */
  bands: z.array(bandSchema).min(1),
});

const mappingSchema = z.discriminatedUnion("kind", [linearMappingSchema, bandsMappingSchema]);

const pizzaFlatSchema = z.object({
  mode: z.literal("flat"),
  /** Legacy key used by existing seeds. */
  value: z.number().optional(),
  /** Alias some authors may prefer. */
  slices: z.number().optional(),
});

const pizzaScoredSchema = z.object({
  mode: z.literal("scored"),
  maxSlices: z.number().min(0).max(5),
  minRatioToComplete: z.number().min(0).max(1).optional(),
  rounding: roundingSchema.optional(),
  mapping: mappingSchema,
});

export const pizzaRulesSchema = z.discriminatedUnion("mode", [pizzaFlatSchema, pizzaScoredSchema]);

export type ParsedPizzaRules =
  | { kind: "flat"; slices: number }
  | {
      kind: "scored";
      maxSlices: number;
      minRatioToComplete: number;
      rounding: RoundingMode;
      mapping: z.infer<typeof mappingSchema>;
    };

function clampInt(n: number, lo: number, hi: number): number {
  const t = Math.trunc(n);
  return Math.min(hi, Math.max(lo, t));
}

export function applyRounding(raw: number, mode: RoundingMode): number {
  if (!Number.isFinite(raw)) return 0;
  switch (mode) {
    case "ceil":
      return Math.ceil(raw - 1e-9);
    case "nearest":
      return Math.round(raw);
    case "floor":
    default:
      return Math.floor(raw + 1e-9);
  }
}

/** True when ratio meets scored-pizza completion bar (ignored for flat pizza rules). */
export function meetsScoredPizzaMinimum(ratio: number, pizzaRules: ParsedPizzaRules): boolean {
  if (pizzaRules.kind !== "scored") return true;
  return ratio + 1e-9 >= pizzaRules.minRatioToComplete;
}

/** Maps a 0..1 performance ratio to integer pizza slices using step reward_rules.pizza. */
export function slicesFromRatio(ratio: number, rules: ParsedPizzaRules): number {
  const r = Math.min(1, Math.max(0, ratio));
  if (rules.kind === "flat") {
    return clampInt(rules.slices, 0, 5);
  }

  const rounding = rules.rounding ?? "floor";
  if (rules.mapping.kind === "linear") {
    const rawLinear = r * rules.maxSlices;
    const rounded = applyRounding(rawLinear, rounding);
    return clampInt(rounded, 0, rules.maxSlices);
  }

  const bands = [...rules.mapping.bands].sort((a, b) => a.minRatio - b.minRatio);
  let chosen = 0;
  for (const b of bands) {
    if (r + 1e-9 >= b.minRatio) {
      chosen = b.slices;
    }
  }
  return clampInt(chosen, 0, rules.maxSlices);
}

/**
 * Reads pizza configuration from game_quest_steps.reward_rules JSON.
 * When pizza is missing or unscorable, falls back to legacy flat parsing (mode flat, value-only).
 */
export function parsePizzaRewardRules(rewardRules: Record<string, unknown> | null | undefined): ParsedPizzaRules {
  const pizzaRaw = rewardRules && typeof rewardRules === "object" ? (rewardRules as { pizza?: unknown }).pizza : undefined;
  const parsed = pizzaRulesSchema.safeParse(pizzaRaw);
  if (!parsed.success) {
    const legacy = pizzaRaw as Record<string, unknown> | undefined;
    const mode = typeof legacy?.mode === "string" ? legacy.mode.toLowerCase().trim() : "";
    if (mode === "flat" || mode === "") {
      const v =
        typeof legacy?.value === "number"
          ? legacy.value
          : typeof legacy?.slices === "number"
            ? legacy.slices
            : 0;
      return { kind: "flat", slices: clampInt(v, 0, 5) };
    }
    return { kind: "flat", slices: 0 };
  }

  const p = parsed.data;
  if (p.mode === "flat") {
    const v = p.value ?? p.slices ?? 0;
    return { kind: "flat", slices: clampInt(v, 0, 5) };
  }

  return {
    kind: "scored",
    maxSlices: clampInt(p.maxSlices, 0, 5),
    minRatioToComplete: p.minRatioToComplete ?? 1,
    rounding: p.rounding ?? "floor",
    mapping: p.mapping,
  };
}

export function requiresTaskAttemptPayload(rules: ParsedPizzaRules): boolean {
  return rules.kind === "scored";
}
