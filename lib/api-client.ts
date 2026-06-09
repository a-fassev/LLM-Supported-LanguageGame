export type ApiErrorResult = {
  ok: false;
  status: number;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

export type ApiOkResult<T> = { ok: true; status: number; data: T };
export type ApiResult<T> = ApiOkResult<T> | ApiErrorResult;

type ApiEnvelope<T extends Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; code?: string; details?: Record<string, unknown> };

export type TeamColor = "blue" | "red";

export type SessionAccountDto = {
  username: string;
  expiresAt: string;
  team?: TeamColor;
};

export type LoginDto = {
  token: string;
  expiresAt: string;
  username: string;
};

export type RegisterDto = {
  username: string;
  team?: TeamColor;
};

export type BootstrapQuestDto = {
  id: string;
  title: string;
  order: number;
  kind: "main" | "bonus";
  requiresQuestId: string | null;
  background: string;
};

export type BootstrapChapterDto = {
  id: string;
  title: string;
  order: number;
  locked: boolean;
  reference: boolean;
  gameFinale: boolean;
  background: string;
  quests: BootstrapQuestDto[];
};

export type BootstrapDto = {
  totalSlices: number;
  totalBackpackPieces: number;
  completedQuestIds: string[];
  chapters: BootstrapChapterDto[];
};

export type LeaderboardSelfDto = {
  username: string;
  team: TeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  overallRank: number;
};

export type LeaderboardPlayerDto = {
  rank: number;
  username: string;
  team: TeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  isSelf: boolean;
};

export type LeaderboardTeamMemberDto = {
  username: string;
  isSelf: boolean;
};

export type LeaderboardTeamDto = {
  rank: number;
  team: TeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  memberCount: number;
  members: LeaderboardTeamMemberDto[];
};

export type LeaderboardDto = {
  self: LeaderboardSelfDto;
  overall: LeaderboardPlayerDto[];
  teams: LeaderboardTeamDto[];
};

export type RunSceneDto = {
  id: string;
  sceneNumber: number;
  scene_type: "story" | "task";
  screen_type: string;
  background: string;
  content: Record<string, unknown>;
  scoring?: Record<string, unknown>;
};

export type RunDto = {
  runId: string;
  chapterId: string;
  questId: string;
  currentSceneId: string;
  status: "in_progress" | "completed" | "abandoned";
  completedSceneIds: string[];
  canRetreat: boolean;
  /** Last quest of a `gameFinale` chapter — use with `status === "completed"` for finale overlay. */
  isGameFinaleQuest: boolean;
  currentScene: RunSceneDto;
  /** Next scene background key from catalog, when present (client preload). */
  nextSceneBackground: string | null;
};

export type TaskOutcomeDto = {
  kind: "success" | "retry";
  ratio: number;
  awardedSlices: number;
  awardedBackpackPieces: number;
  headline: string;
  body: string;
};

export type {
  ClozeGapReview,
  ClozeTaskReview,
  DragDropTargetReview,
  DragDropTaskReview,
  ErrorSpottingSegmentReview,
  ErrorSpottingTaskReview,
  FreitextDimensionReview,
  FreitextTaskReview,
  MatchingPairReview,
  MatchingTaskReview,
  McQuestionReview,
  MultipleChoiceTaskReview,
  TaskReviewDto,
} from "@/lib/game/task-review";

export type RunSnapshotDto = {
  totalSlices: number;
  totalBackpackPieces: number;
  run: RunDto | null;
};

export type AttemptRunDto = RunSnapshotDto & {
  taskOutcome?: TaskOutcomeDto;
  taskReview?: import("@/lib/game/task-review").TaskReviewDto;
};

type RequestOptions = {
  method?: "GET" | "POST";
  token?: string | null;
  body?: unknown;
  cache?: RequestCache;
};

function authHeader(token?: string | null): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const NETWORK_ERROR_MESSAGE = "Impossibile contattare il server. Controlla la connessione.";

async function requestJson<T extends Record<string, unknown>>(
  path: string,
  options?: RequestOptions,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(options?.token),
      },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
      cache: options?.cache ?? "no-store",
    });
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR_MESSAGE };
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!payload) {
    return {
      ok: false,
      status: response.status,
      error: "Risposta del server non valida.",
    };
  }

  if (!payload.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload.error,
      code: payload.code,
      details: payload.details,
    };
  }

  const data = payload as Record<string, unknown>;
  delete data.ok;
  return { ok: true, status: response.status, data: data as T };
}

export function suggestUsername() {
  return requestJson<{ username: string }>("/api/auth/suggest-username");
}

export function login(input: { username: string; password: string }) {
  return requestJson<LoginDto>("/api/auth/login", { method: "POST", body: input });
}

export function register(input: {
  username?: string;
  password: string;
  passwordConfirm: string;
}) {
  return requestJson<RegisterDto>("/api/auth/register", { method: "POST", body: input });
}

export function logout(token: string | null) {
  return requestJson<Record<string, never>>("/api/auth/logout", {
    method: "POST",
    token,
    body: token ? undefined : {},
  });
}

export function getSession(token: string | null) {
  return requestJson<SessionAccountDto>("/api/auth/session", { token });
}

export function getBootstrap(token: string) {
  return requestJson<BootstrapDto>("/api/game/bootstrap", { token });
}

export function getLeaderboard(token: string) {
  return requestJson<LeaderboardDto>("/api/game/leaderboard", { token });
}

export function startRun(token: string, input: { chapterId: string; questId: string }) {
  return requestJson<RunSnapshotDto>("/api/game/runs/start", {
    method: "POST",
    token,
    body: input,
  });
}

export function getRunSnapshot(token: string) {
  return requestJson<RunSnapshotDto>("/api/game/runs/snapshot", { token });
}

export function advanceRun(token: string, runId: string, input: { sceneId: string }) {
  return requestJson<AttemptRunDto>(`/api/game/runs/${runId}/advance`, {
    method: "POST",
    token,
    body: input,
  });
}

export function retreatRun(token: string, runId: string, input: { sceneId: string }) {
  return requestJson<RunSnapshotDto>(`/api/game/runs/${runId}/retreat`, {
    method: "POST",
    token,
    body: input,
  });
}

export function attemptRun(
  token: string,
  runId: string,
  input: { sceneId: string; attempt?: unknown },
) {
  return requestJson<AttemptRunDto>(`/api/game/runs/${runId}/attempt`, {
    method: "POST",
    token,
    body: input,
  });
}

export function readTaskReview(
  error: ApiErrorResult,
): import("@/lib/game/task-review").TaskReviewDto | null {
  const raw = error.details?.taskReview;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const screenType = (raw as { screenType?: unknown }).screenType;
  if (typeof screenType !== "string") return null;
  return raw as import("@/lib/game/task-review").TaskReviewDto;
}
