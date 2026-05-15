import { randomInt } from "node:crypto";

/** Temporary stand-in until real task evaluation / LLM exists. Inclusive 0–5. */
export function randomPizzaSliceAward(): number {
  return randomInt(0, 6);
}
