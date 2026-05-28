import { z } from "zod";
import { verifyPassword } from "@/lib/password";
import { createOpaqueToken, hashToken } from "@/lib/session-token";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { authClientMessages as authMsg, apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
  password: z.string().min(1).max(128),
});

const SESSION_DAYS = 30;

export const runtime = "nodejs";

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`login:${ip}`, 40, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, routeMsg.invalidJson);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, routeMsg.invalidRequest);
  }

  const username = normalizeUsername(parsed.data.username);
  const supabase = getSupabaseAdmin();

  const { data: account, error: lookupError } = await supabase
    .from("student_accounts")
    .select("id, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (lookupError) {
    console.error("[login] lookup", lookupError);
    return jsonError(500, authMsg.couldNotProcess);
  }

  const valid =
    account && (await verifyPassword(account.password_hash, parsed.data.password));

  if (!valid) {
    return jsonError(401, authMsg.invalidCredentials, "auth_failed");
  }

  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const { error: sessionError } = await supabase.from("student_sessions").insert({
    account_id: account.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (sessionError) {
    console.error("[login] session insert", sessionError);
    return jsonError(500, authMsg.couldNotCreateSession);
  }

  await supabase
    .from("student_accounts")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", account.id);

  return jsonOk({
    token,
    expiresAt: expiresAt.toISOString(),
    username,
  });
}
