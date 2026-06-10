import argon2 from "argon2";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

const legacyArgon2Options: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

/** True when the stored hash should be rewritten to bcrypt after a successful login. */
export function needsPasswordHashUpgrade(storedHash: string): boolean {
  return storedHash.startsWith("$argon2");
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    if (hash.startsWith("$argon2")) {
      return await argon2.verify(hash, plain);
    }
    if (hash.startsWith("$2")) {
      return await bcrypt.compare(plain, hash);
    }
    return false;
  } catch {
    return false;
  }
}

export const legacyArgon2HashOptions = legacyArgon2Options;
