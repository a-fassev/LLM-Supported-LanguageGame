export type StudentTeam = "blue" | "red";

/** Mirrors Postgres assign_balanced_student_team() for unit tests and documentation. */
export function pickBalancedTeam(
  blueCount: number,
  redCount: number,
  random01: () => number,
): StudentTeam {
  if (blueCount < redCount) return "blue";
  if (redCount < blueCount) return "red";
  return random01() < 0.5 ? "blue" : "red";
}
