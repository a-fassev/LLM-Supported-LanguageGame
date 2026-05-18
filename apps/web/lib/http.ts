import { NextResponse } from "next/server";

export function jsonError(
  status: number,
  message: string,
  code?: string,
  /** Extra context for operators/clients (e.g. cutscene authoring failures). */
  details?: Record<string, unknown>,
) {
  const body: Record<string, unknown> = { ok: false, error: message };
  if (code !== undefined) body.code = code;
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json({ ok: true, ...body }, { status });
}

export function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}
