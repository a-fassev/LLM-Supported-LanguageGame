import { describe, expect, it } from "vitest";
import { plainPasswordsMatch } from "@/lib/plain-password-match";

describe("plainPasswordsMatch", () => {
  it("returns true for equal passwords", () => {
    expect(plainPasswordsMatch("password123", "password123")).toBe(true);
  });

  it("returns false for different passwords", () => {
    expect(plainPasswordsMatch("password123", "wrong-pass")).toBe(false);
  });

  it("returns false when lengths differ", () => {
    expect(plainPasswordsMatch("short", "much-longer-value")).toBe(false);
  });
});
