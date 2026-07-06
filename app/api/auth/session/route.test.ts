import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const accountMaybeSingle = vi.fn();
  const accountEq = vi.fn(() => ({ maybeSingle: accountMaybeSingle }));
  const accountSelect = vi.fn(() => ({ eq: accountEq }));
  const sessionMaybeSingle = vi.fn();
  const sessionEq = vi.fn(() => ({ maybeSingle: sessionMaybeSingle }));
  const sessionSelect = vi.fn(() => ({ eq: sessionEq }));
  const from = vi.fn((table: string) => {
    if (table === "student_sessions") {
      return { select: sessionSelect };
    }
    if (table === "student_accounts") {
      return { select: accountSelect };
    }
    return {};
  });

  return {
    accountMaybeSingle,
    sessionMaybeSingle,
    from,
    getSupabaseAdmin: vi.fn(() => ({ from })),
    checkRateLimit: vi.fn(),
    hashToken: vi.fn(),
  };
});

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));
vi.mock("@/lib/session-token", () => ({
  hashToken: mocks.hashToken,
}));

import { GET } from "./route";

function sessionRequest() {
  return GET(
    new Request("http://localhost/api/auth/session", {
      headers: { authorization: "Bearer test-token" },
    }),
  );
}

describe("GET /api/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockReturnValue(true);
    mocks.hashToken.mockReturnValue("hashed-token");
    mocks.sessionMaybeSingle.mockResolvedValue({
      data: {
        id: "session-1",
        account_id: "account-1",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        revoked_at: null,
      },
      error: null,
    });
  });

  it("returns leaderboardEligible true for whitelisted usernames", async () => {
    mocks.accountMaybeSingle.mockResolvedValue({
      data: { username: "lively-fox-2088", team: "red" },
      error: null,
    });

    const response = await sessionRequest();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      username: "lively-fox-2088",
      team: "red",
      leaderboardEligible: true,
    });
  });

  it("returns leaderboardEligible false for non-whitelisted usernames", async () => {
    mocks.accountMaybeSingle.mockResolvedValue({
      data: { username: "quick-eagle-1813", team: "red" },
      error: null,
    });

    const response = await sessionRequest();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      username: "quick-eagle-1813",
      team: "red",
      leaderboardEligible: false,
    });
  });
});
