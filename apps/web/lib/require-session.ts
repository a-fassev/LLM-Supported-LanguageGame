import type { NextResponse } from "next/server";
import { hashToken } from "@/lib/session-token";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/http";

export type SessionAccount = {
  accountId: string;
};

export function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() ?? null;
}

/** Validates bearer token and returns account id, or an HTTP error response. */
export async function requireSessionAccount(
  request: Request,
): Promise<{ ok: true; accountId: string } | { ok: false; response: NextResponse }> {
  const token = extractBearer(request);
  if (!token) {
    return { ok: false, response: jsonError(401, "Missing token", "missing_token") };
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
    console.error("[require-session] lookup", sessionError);
    return { ok: false, response: jsonError(500, "Impossibile verificare la sessione.") };
  }

  if (!session || session.revoked_at != null || session.expires_at <= nowIso) {
    return { ok: false, response: jsonError(401, "Invalid or expired session", "invalid_session") };
  }

  return { ok: true, accountId: session.account_id as string };
}
