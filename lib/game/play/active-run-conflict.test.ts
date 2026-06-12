import { describe, expect, it } from "vitest";
import {
  buildActiveRunResumePath,
  buildPlayLoadErrorBackPath,
  readActiveRunConflict,
  shouldShowActiveRunConflictPanel,
  shouldShowPlayLoadErrorPanel,
} from "@/lib/game/play/active-run-conflict";

describe("active-run-conflict", () => {
  it("reads chapter and quest ids from active_run_exists details", () => {
    expect(
      readActiveRunConflict({
        ok: false,
        status: 409,
        error: "Hai gia una partita in corso.",
        code: "active_run_exists",
        details: {
          existingChapterId: "chapter-00",
          existingQuestId: "quest-01",
        },
      }),
    ).toEqual({ chapterId: "chapter-00", questId: "quest-01" });
  });

  it("returns null when conflict details are missing", () => {
    expect(
      readActiveRunConflict({
        ok: false,
        status: 409,
        error: "Hai gia una partita in corso.",
        code: "active_run_exists",
      }),
    ).toBeNull();
  });

  it("builds encoded resume play URL", () => {
    expect(
      buildActiveRunResumePath({ chapterId: "chapter-00", questId: "quest-01" }),
    ).toBe("/play?chapterId=chapter-00&questId=quest-01");
  });

  it("shows conflict panel only when idle without a run", () => {
    const conflict = { chapterId: "chapter-00", questId: "quest-01" };
    expect(shouldShowActiveRunConflictPanel({ loading: true, hasRun: false, conflict })).toBe(
      false,
    );
    expect(shouldShowActiveRunConflictPanel({ loading: false, hasRun: true, conflict })).toBe(
      false,
    );
    expect(shouldShowActiveRunConflictPanel({ loading: false, hasRun: false, conflict: null })).toBe(
      false,
    );
    expect(shouldShowActiveRunConflictPanel({ loading: false, hasRun: false, conflict })).toBe(
      true,
    );
  });

  it("shows load error panel only when idle without a run or conflict", () => {
    expect(
      shouldShowPlayLoadErrorPanel({
        loading: false,
        hasRun: false,
        conflict: null,
        error: "Capitolo bloccato.",
      }),
    ).toBe(true);
    expect(
      shouldShowPlayLoadErrorPanel({
        loading: true,
        hasRun: false,
        conflict: null,
        error: "Capitolo bloccato.",
      }),
    ).toBe(false);
    expect(
      shouldShowPlayLoadErrorPanel({
        loading: false,
        hasRun: true,
        conflict: null,
        error: "Capitolo bloccato.",
      }),
    ).toBe(false);
    expect(
      shouldShowPlayLoadErrorPanel({
        loading: false,
        hasRun: false,
        conflict: { chapterId: "chapter-00", questId: "quest-01" },
        error: "Capitolo bloccato.",
      }),
    ).toBe(false);
    expect(
      shouldShowPlayLoadErrorPanel({
        loading: false,
        hasRun: false,
        conflict: null,
        error: null,
      }),
    ).toBe(false);
  });

  it("builds chapter detail or hub back path for load errors", () => {
    expect(buildPlayLoadErrorBackPath("chapter-01")).toBe("/chapters/chapter-01");
    expect(buildPlayLoadErrorBackPath(null)).toBe("/chapters");
  });
});
