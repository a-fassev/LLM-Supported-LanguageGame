import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LanguageFeedback } from "@/lib/types/evaluation";

/** Matches `kpiScoreSchema` (0–100) */
const MAX_SCORE = 100;

interface KpiScoreCardsProps {
  feedback: LanguageFeedback;
}

function scoreTone(value: number) {
  if (value >= 80) {
    return {
      accent: "var(--color-success)",
      fillClass: "bg-[var(--color-success)]",
    };
  }
  if (value >= 60) {
    return {
      accent: "var(--color-warning)",
      fillClass: "bg-[var(--color-warning)]",
    };
  }
  return {
    accent: "#dc2626",
    fillClass: "bg-[#dc2626]",
  };
}

export function KpiScoreCards({ feedback }: KpiScoreCardsProps) {
  const scoreItems = [
    { label: "Grammar", value: feedback.grammar.value },
    { label: "Vocabulary", value: feedback.vocabulary.value },
    { label: "Fluency", value: feedback.fluency.value },
    { label: "Comprehension", value: feedback.comprehension.value },
  ] as const;

  return (
    <div className="kpi-grid">
      {scoreItems.map((item) => {
        const tone = scoreTone(item.value);
        const pct = Math.min(100, Math.max(0, (item.value / MAX_SCORE) * 100));

        return (
          <Card
            key={item.label}
            className="overflow-hidden rounded-[var(--radius-md)] border-[var(--color-border)]"
          >
            <CardContent className="kpi-card-content">
              <p className="kpi-label">{item.label}</p>
              <div className="kpi-value-row">
                <p className="kpi-value" style={{ color: tone.accent }}>
                  {item.value}
                </p>
                <span className="kpi-max">/ {MAX_SCORE}</span>
              </div>
              <div className="kpi-bar">
                <div
                  className={cn("kpi-bar-fill", tone.fillClass)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
