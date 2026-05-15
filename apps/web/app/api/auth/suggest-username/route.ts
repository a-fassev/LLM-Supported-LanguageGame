import { generateSuggestedUsername } from "@/lib/username-generator";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonOk, jsonError } from "@/lib/http";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`suggest:${ip}`, 60, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  return jsonOk({ username: generateSuggestedUsername() });
}
