import { timingSafeEqual } from "node:crypto";

export function plainPasswordsMatch(stored: string, input: string): boolean {
  const storedBuf = Buffer.from(stored, "utf8");
  const inputBuf = Buffer.from(input, "utf8");
  if (storedBuf.length !== inputBuf.length) {
    return false;
  }
  return timingSafeEqual(storedBuf, inputBuf);
}
