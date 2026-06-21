import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chapterNotReleasedMessage,
  chapterNotReleasedMessageFromUnlocksAt,
  formatChapterReleaseLabel,
  getChapterReleaseAt,
  getChapterUnlocksAtIso,
  isChapterReleasedBySchedule,
  isChapterReleaseScheduleEnforced,
  isChapterScheduleLocked,
} from "@/lib/game/chapter-release-schedule";

describe("chapter-release-schedule", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv ?? "test");
  });

  it("releases chapter-00 immediately", () => {
    expect(getChapterReleaseAt("chapter-00")).toBeNull();
    expect(isChapterReleasedBySchedule("chapter-00", new Date("2026-01-01T00:00:00Z"))).toBe(true);
  });

  it("locks chapter-01 until wave 1", () => {
    const before = new Date("2026-06-29T06:29:59+02:00");
    const at = new Date("2026-06-29T08:30:00+02:00");
    expect(isChapterReleasedBySchedule("chapter-01", before)).toBe(false);
    expect(isChapterReleasedBySchedule("chapter-01", at)).toBe(true);
    expect(isChapterScheduleLocked("chapter-01", before)).toBe(true);
    expect(isChapterScheduleLocked("chapter-01", at)).toBe(false);
  });

  it("releases chapter-03 and chapter-04 on wave 2", () => {
    const before = new Date("2026-06-30T09:29:59+02:00");
    const at = new Date("2026-06-30T09:30:00+02:00");
    expect(isChapterReleasedBySchedule("chapter-03", before)).toBe(false);
    expect(isChapterReleasedBySchedule("chapter-04", at)).toBe(true);
  });

  it("releases chapter-05 and chapter-06 on wave 3", () => {
    const before = new Date("2026-07-02T09:29:59+02:00");
    const at = new Date("2026-07-02T09:30:00+02:00");
    expect(isChapterReleasedBySchedule("chapter-05", before)).toBe(false);
    expect(isChapterReleasedBySchedule("chapter-06", at)).toBe(true);
  });

  it("returns unlocksAt ISO only while schedule-locked", () => {
    const before = new Date("2026-06-29T06:00:00+02:00");
    const after = new Date("2026-06-29T09:00:00+02:00");
    expect(getChapterUnlocksAtIso("chapter-02", before)).toBe("2026-06-29T06:30:00.000Z");
    expect(getChapterUnlocksAtIso("chapter-02", after)).toBeNull();
  });

  it("formats Italian release label in Europe/Berlin", () => {
    const releaseAt = getChapterReleaseAt("chapter-01");
    expect(releaseAt).not.toBeNull();
    if (!releaseAt) return;
    expect(formatChapterReleaseLabel(releaseAt)).toMatch(/29 giugno, ore 08:30/);
  });

  it("builds chapter_not_released copy with release date", () => {
    const before = new Date("2026-06-29T06:00:00+02:00");
    expect(chapterNotReleasedMessage("chapter-01", before)).toMatch(
      /Questo capitolo si apre il 29 giugno, ore 08:30/,
    );
  });

  it("builds chapter_not_released copy from bootstrap unlocksAt ISO", () => {
    expect(chapterNotReleasedMessageFromUnlocksAt("2026-06-29T06:30:00.000Z")).toMatch(
      /Questo capitolo si apre il 29 giugno, ore 08:30/,
    );
  });

  it("does not enforce schedule in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isChapterReleaseScheduleEnforced()).toBe(false);
    expect(isChapterScheduleLocked("chapter-06", new Date("2026-01-01T00:00:00Z"))).toBe(false);
  });
});
