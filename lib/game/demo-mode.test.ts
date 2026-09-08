import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_ACCOUNT_USERNAME, isDemoAccountUsername, isGameDemoMode } from "./demo-mode";

describe("demo-mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off unless GAME_DEMO_MODE is true", () => {
    vi.stubEnv("GAME_DEMO_MODE", "");
    expect(isGameDemoMode()).toBe(false);
    vi.stubEnv("GAME_DEMO_MODE", "false");
    expect(isGameDemoMode()).toBe(false);
  });

  it("is on when GAME_DEMO_MODE is true", () => {
    vi.stubEnv("GAME_DEMO_MODE", "true");
    expect(isGameDemoMode()).toBe(true);
  });

  it("recognizes the showcase username", () => {
    expect(isDemoAccountUsername(DEMO_ACCOUNT_USERNAME)).toBe(true);
    expect(isDemoAccountUsername("lively-fox-2088")).toBe(false);
  });
});
