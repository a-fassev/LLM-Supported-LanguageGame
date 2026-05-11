import { BarChart3, CheckCircle2, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KpiScoreCards } from "@/components/kpi/KpiScoreCards";
import type { LanguageFeedback } from "@/lib/types/evaluation";

interface KpiPanelProps {
  feedback: LanguageFeedback | null;
  isAnalyzing: boolean;
  canAnalyze: boolean;
  error: string | null;
  onAnalyze: () => void;
  onReset: () => void;
}

export function KpiPanel({
  feedback,
  isAnalyzing,
  canAnalyze,
  error,
  onAnalyze,
  onReset,
}: KpiPanelProps) {
  return (
    <Card className="panel flex h-full min-h-0 flex-col rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
      <CardHeader className="shrink-0 space-y-0 border-b border-[var(--color-border)] pb-4">
        <CardTitle className="text-lg">Conversation KPIs</CardTitle>
        <CardDescription>
          Structured analysis of the full conversation (grammar, vocabulary, fluency, comprehension).
        </CardDescription>
      </CardHeader>
      <CardContent className="kpi-panel-content flex flex-1 flex-col pt-4">
        <div className="kpi-actions shrink-0">
          <Button onClick={onAnalyze} disabled={!canAnalyze || isAnalyzing}>
            <BarChart3 className="h-4 w-4" />
            {isAnalyzing ? "Analyzing…" : "Analyze conversation"}
          </Button>
          <Button variant="outline" onClick={onReset}>
            Reset chat
          </Button>
        </div>

        {error ? <p className="error-text text-sm">{error}</p> : null}

        {feedback ? (
          <div className="kpi-feedback min-h-0 flex-1 overflow-y-auto pr-1">
            <KpiScoreCards feedback={feedback} />
            <Separator />
            <div>
              <p className="leading-relaxed">{feedback.summary}</p>
            </div>
            <Separator />
            <div>
              <h4 className="kpi-section-title">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden />
                Strengths
              </h4>
              <ul className="list-disc pl-5 text-sm leading-relaxed">
                {feedback.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="kpi-section-title">
                <Target className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                Next steps
              </h4>
              <ul className="list-disc pl-5 text-sm leading-relaxed">
                {feedback.encouragingNextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="coach-callout border-[var(--color-border)]">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                <span className="text-sm font-semibold">Coach message</span>
              </div>
              <p className="coach-message text-[var(--color-foreground)]">
                {feedback.coachMessageForChild}
              </p>
            </div>
          </div>
        ) : (
          <div className="empty-state mt-2 flex-1 justify-center py-10">
            <div className="empty-state-icon">
              <BarChart3 className="h-7 w-7" aria-hidden />
            </div>
            <p className="font-medium">No analysis yet</p>
            <p className="text-muted max-w-xs text-sm">
              Chat with the NPC first, then run &quot;Analyze conversation&quot; to see scores and tips.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
