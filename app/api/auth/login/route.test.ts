import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const accountEq = vi.fn(() => ({ maybeSingle }));
  const accountSelect = vi.fn(() => ({ eq: accountEq }));
  const accountUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const accountUpdate = vi.fn(() => ({ eq: accountUpdateEq }));
  const sessionInsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "student_accounts") {
      return { select: accountSelect, update: accountUpdate };
    }
    if (table === "student_sessions") {
      return { insert: sessionInsert };
    }
    return {};
  });
  return {
    maybeSingle,
    accountEq,
    accountSelect,
    accountUpdateEq,
    accountUpdate,
    sessionInsert,
    from,
    getSupabaseAdmin: vi.fn(() => ({ from })),
    checkRateLimit: vi.fn(),
    createOpaqueToken: vi.fn(),
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
  createOpaqueToken: mocks.createOpaqueToken,
  hashToken: mocks.hashToken,
}));

import { POST } from "@/app/api/auth/login/route";

function loginRequest(username: string, password: string) {
  return POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockReturnValue(true);
    mocks.createOpaqueToken.mockReturnValue("session-token");
    mocks.hashToken.mockReturnValue("hashed-session-token");
  });

  it("returns auth_failed when password does not match", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "account-1", password: "stored-pass" },
      error: null,
    });

    const response = await loginRequest("studente-1", "wrong-pass");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "auth_failed",
    });
    expect(mocks.sessionInsert).not.toHaveBeenCalled();
  });

  it("creates a session when password matches", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "account-1", password: "password123" },
      error: null,
    });

    const response = await loginRequest("studente-1", "password123");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      token: "session-token",
      username: "studente-1",
    });
    expect(mocks.accountEq).toHaveBeenCalledWith("username", "studente-1");
    expect(mocks.sessionInsert).toHaveBeenCalledWith({
      account_id: "account-1",
      token_hash: "hashed-session-token",
      expires_at: expect.any(String),
    });
    expect(mocks.accountUpdateEq).toHaveBeenCalledWith("id", "account-1");
  });
});
