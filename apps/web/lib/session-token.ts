import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;

export function createOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
