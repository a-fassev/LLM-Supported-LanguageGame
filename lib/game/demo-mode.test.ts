import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_ACCOUNT_USERNAME, isDemoAccountUsername, isGameDemoMode } from "./demo-mode";

describe("demo-mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is hardcoded on", () => {
    vi.stubEnv("GAME_DEMO_MODE", "");
    expect(isGameDemoMode()).toBe(true);
  });

  it("can be turned off with GAME_DEMO_MODE=false for tests or a later revert", () => {
    vi.stubEnv("GAME_DEMO_MODE", "false");
    expect(isGameDemoMode()).toBe(false);
  });

  it("recognizes the showcase username", () => {
    expect(isDemoAccountUsername(DEMO_ACCOUNT_USERNAME)).toBe(true);
    expect(isDemoAccountUsername("lively-fox-2088")).toBe(false);
  });
});
