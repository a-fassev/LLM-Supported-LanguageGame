import { NextResponse } from "next/server";

export function jsonError(status: number, message: string, code?: string) {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json({ ok: true, ...body }, { status });
}

export function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}
