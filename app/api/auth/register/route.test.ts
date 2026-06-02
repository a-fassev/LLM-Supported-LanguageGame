import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const insertSingle = vi.fn();
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: insertSingle,
    })),
  }));
  const from = vi.fn(() => ({
    insert,
  }));
  const getSupabaseAdmin = vi.fn(() => ({ from }));
  return {
    insertSingle,
    insert,
    from,
    getSupabaseAdmin,
    hashPassword: vi.fn(),
    checkRateLimit: vi.fn(),
    generateSuggestedUsername: vi.fn(),
  };
});

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock("@/lib/password", () => ({
  hashPassword: mocks.hashPassword,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));
vi.mock("@/lib/username-generator", () => ({
  generateSuggestedUsername: mocks.generateSuggestedUsername,
}));

import { POST } from "@/app/api/auth/register/route";

describe("register route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseAdmin.mockImplementation(() => ({ from: mocks.from }));
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.checkRateLimit.mockReturnValue(true);
  });

  it("returns config_error when Supabase client is unavailable", async () => {
    mocks.getSupabaseAdmin.mockImplementation(() => {
      throw new Error("missing config");
    });

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "nuovo-utente",
          password: "password123",
          passwordConfirm: "password123",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "config_error",
    });
  });

  it("retries with generated username when requested one collides", async () => {
    mocks.generateSuggestedUsername.mockReturnValue("nuovo-utente-2");
    mocks.insertSingle
      .mockResolvedValueOnce({ data: null, error: { code: "23505" } })
      .mockResolvedValueOnce({
        data: { username: "nuovo-utente-2", team: "blue" },
        error: null,
      });

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "nuovo-utente",
          password: "password123",
          passwordConfirm: "password123",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      username: "nuovo-utente-2",
      team: "blue",
    });
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    expect(mocks.insert).toHaveBeenNthCalledWith(1, {
      username: "nuovo-utente",
      password_hash: "hashed-password",
    });
    expect(mocks.insert).toHaveBeenNthCalledWith(2, {
      username: "nuovo-utente-2",
      password_hash: "hashed-password",
    });
  });
});
