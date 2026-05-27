import { z } from "zod";
import { generateSuggestedUsername } from "@/lib/username-generator";
import { hashPassword } from "@/lib/password";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";

const bodySchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9-]+$/, "Invalid username characters")
      .optional(),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
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
    return jsonError(429, "Too many requests");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "Invalid request", "validation_error");
  }

  const { password, username: requestedUsername } = parsed.data;
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch {
    return jsonError(500, "Could not process request");
  }

  const supabase = getSupabaseAdmin();
  const attempts = 12;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    const username = requestedUsername
      ? normalizeUsername(requestedUsername)
      : normalizeUsername(generateSuggestedUsername());

    const { data, error } = await supabase
      .from("student_accounts")
      .insert({ username, password_hash: passwordHash })
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
    if (requestedUsername && isUniqueViolation(error)) {
      return jsonError(409, "Username already taken", "username_taken");
    }
    if (!requestedUsername && isUniqueViolation(error)) {
      continue;
    }
    return jsonError(500, "Could not create account");
  }

  console.error("[register] exhausted username attempts", lastError);
  return jsonError(500, "Could not create account");
}
