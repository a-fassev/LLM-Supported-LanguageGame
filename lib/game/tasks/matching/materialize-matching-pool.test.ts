import { describe, expect, it } from "vitest";
import { materializeMatchingPool } from "@/lib/game/tasks/matching/materialize-matching-pool";

const pool = [
  { id: "v01", leftLabel: "ciao", rightLabel: "hello" },
  { id: "v02", leftLabel: "grazie", rightLabel: "thanks" },
  { id: "v03", leftLabel: "notte", rightLabel: "good night" },
  { id: "v04", leftLabel: "binario", rightLabel: "platform" },
];

describe("materializeMatchingPool", () => {
  it("materializes sampleSize pairs with stable ids", () => {
    const result = materializeMatchingPool(
      { poolPairs: pool, sampleSize: 2, prompt: "Bonus" },
      { pickIndices: [1, 3] },
    );
    expect(result.leftItems).toHaveLength(2);
    expect(result.rightItems).toHaveLength(2);
    expect(result.correctPairs).toEqual([
      { leftItemId: "left_v02", rightItemId: "right_v02" },
      { leftItemId: "left_v04", rightItemId: "right_v04" },
    ]);
    expect(result.prompt).toBe("Bonus");
    expect("poolPairs" in result).toBe(false);
  });

  it("clamps sampleSize to pool length", () => {
    const result = materializeMatchingPool(
      { poolPairs: pool.slice(0, 2), sampleSize: 99 },
      { pickIndices: [0, 1] },
    );
    expect(result.leftItems).toHaveLength(2);
  });

  it("produces deterministic output with pickIndices", () => {
    const a = materializeMatchingPool({ poolPairs: pool, sampleSize: 3 }, { pickIndices: [0, 2, 1] });
    const b = materializeMatchingPool({ poolPairs: pool, sampleSize: 3 }, { pickIndices: [0, 2, 1] });
    expect(a).toEqual(b);
  });
});
