import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getAllowedOrigin(request: NextRequest): string {
  const configured = process.env.CORS_ALLOWED_ORIGINS?.split(",")[0]?.trim();
  if (configured) return configured;

  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return "*";
  return origin;
}

function applyCors(response: NextResponse, request: NextRequest) {
  const allowOrigin = getAllowedOrigin(request);
  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    return applyCors(res, request);
  }

  const res = NextResponse.next();
  return applyCors(res, request);
}

export const config = {
  matcher: ["/api/:path*"],
};
