import { hashToken } from "@/lib/session-token";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { authClientMessages as authMsg, apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() ?? null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`logout:${ip}`, 60, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const fromHeader = extractBearer(request);
  let token = fromHeader;

  if (!token) {
    try {
      const body = (await request.json()) as { token?: string };
      token = typeof body.token === "string" ? body.token : null;
    } catch {
      token = null;
    }
  }

  if (!token) {
    return jsonError(400, authMsg.missingTokenBody);
  }

  const supabase = getSupabaseAdmin();
  const tokenHash = hashToken(token);
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("student_sessions")
    .update({ revoked_at: nowIso })
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", nowIso);

  if (error) {
    console.error("[logout]", error);
    return jsonError(500, authMsg.couldNotRevokeSession);
  }

  return jsonOk({});
}
