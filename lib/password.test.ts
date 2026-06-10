import argon2 from "argon2";
import { describe, expect, it } from "vitest";
import {
  hashPassword,
  legacyArgon2HashOptions,
  needsPasswordHashUpgrade,
  verifyPassword,
} from "@/lib/password";

describe("password hashing", () => {
  it("hashes new passwords with bcrypt", async () => {
    const hash = await hashPassword("secret-pass-1");
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword(hash, "secret-pass-1")).toBe(true);
    expect(await verifyPassword(hash, "wrong-pass")).toBe(false);
  });

  it("verifies legacy argon2id hashes", async () => {
    const legacyHash = await argon2.hash("legacy-pass-1", legacyArgon2HashOptions);
    expect(needsPasswordHashUpgrade(legacyHash)).toBe(true);
    expect(await verifyPassword(legacyHash, "legacy-pass-1")).toBe(true);
    expect(await verifyPassword(legacyHash, "wrong-pass")).toBe(false);
  });

  it("does not flag bcrypt hashes for upgrade", async () => {
    const hash = await hashPassword("upgrade-check");
    expect(needsPasswordHashUpgrade(hash)).toBe(false);
  });

  it("rejects unknown hash formats", async () => {
    expect(await verifyPassword("not-a-real-hash", "plain")).toBe(false);
  });
});
