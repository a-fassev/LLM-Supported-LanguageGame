import type { NextConfig } from "next";

/** Host:port entries for Next.js dev when opening the app via LAN IP (iPad, etc.). */
function allowedDevOriginsFromEnv(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw?.trim()) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).host;
      } catch {
        return null;
      }
    })
    .filter((host): host is string => host !== null);
}

const allowedDevOrigins = allowedDevOriginsFromEnv();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["argon2"],
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
