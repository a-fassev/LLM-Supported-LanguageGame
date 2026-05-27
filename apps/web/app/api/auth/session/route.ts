import { hashToken } from "@/lib/session-token";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";

function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() ?? null;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`session:${ip}`, 120, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const token = extractBearer(request);
  if (!token) {
    return jsonError(401, "Missing token", "missing_token");
  }

  const supabase = getSupabaseAdmin();
  const tokenHash = hashToken(token);
  const nowIso = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from("student_sessions")
    .select("id, account_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (sessionError) {
    console.error("[session] lookup", sessionError);
    return jsonError(500, "Could not validate session");
  }

  if (!session || session.revoked_at != null || session.expires_at <= nowIso) {
    return jsonError(401, "Invalid or expired session", "invalid_session");
  }

  const { data: account, error: accountError } = await supabase
    .from("student_accounts")
    .select("username, team")
    .eq("id", session.account_id)
    .maybeSingle();

  if (accountError || !account?.username) {
    return jsonError(401, "Invalid or expired session", "invalid_session");
  }

  const team =
    account.team === "blue" || account.team === "red" ? account.team : undefined;

  return jsonOk({
    username: account.username,
    expiresAt: session.expires_at,
    ...(team ? { team } : {}),
  });
}
