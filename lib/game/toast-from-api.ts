"use client";

import { toast } from "sonner";
import type { ApiErrorResult } from "@/lib/api-client";

const BLOCKING_CODES = new Set<string>([
  "catalog_unavailable",
  "leaderboard_load_failed",
  "profile_load_failed",
  "run_not_found",
  "scene_missing",
  "active_run_exists",
  "quest_locked",
  "invalid_session",
  "missing_token",
]);

export function shouldToastApiError(error: ApiErrorResult): boolean {
  if (error.status >= 500) return true;
  if (!error.code) return false;
  return BLOCKING_CODES.has(error.code);
}

export function toastBlockingApiError(error: ApiErrorResult): void {
  if (!shouldToastApiError(error)) return;
  toast.error(error.error);
}
