import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateSuggestedUsername } from "@/lib/username-generator";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { authClientMessages as authMsg, apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

const bodySchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9-]+$/, authMsg.invalidUsernameCharacters)
      .optional(),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: authMsg.passwordsDoNotMatch,
        path: ["passwordConfirm"],
      });
    }
  });

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === "23505";
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`register:${ip}`, 20, 60_000)) {
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
    return jsonError(400, routeMsg.invalidRequest, "validation_error");
  }

  const { password, username: requestedUsername } = parsed.data;

  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return jsonError(503, authMsg.couldNotProcess, "config_error");
  }

  const attempts = 12;
  let lastError: unknown;
  const normalizedRequestedUsername = requestedUsername
    ? normalizeUsername(requestedUsername)
    : null;

  for (let i = 0; i < attempts; i++) {
    const username =
      i === 0 && normalizedRequestedUsername
        ? normalizedRequestedUsername
        : normalizeUsername(generateSuggestedUsername());

    const { data, error } = await supabase
      .from("student_accounts")
      .insert({ username, password })
      .select("username, team")
      .single();

    if (!error && data?.username) {
      const team =
        data.team === "blue" || data.team === "red" ? data.team : undefined;
      return jsonOk({
        username: data.username,
        ...(team ? { team } : {}),
      });
    }

    lastError = error;
    if (isUniqueViolation(error)) {
      continue;
    }
    return jsonError(500, authMsg.couldNotCreateAccount);
  }

  console.error("[register] exhausted username attempts", lastError);
  return jsonError(500, authMsg.couldNotCreateAccount);
}
