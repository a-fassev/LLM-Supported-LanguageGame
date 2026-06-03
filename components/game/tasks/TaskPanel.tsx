"use client";

type TaskPanelProps = {
  attemptText: string;
  onAttemptTextChange: (value: string) => void;
};

export function TaskPanel({ attemptText, onAttemptTextChange }: TaskPanelProps) {
  return (
    <div className="space-y-3">
      <textarea
        value={attemptText}
        onChange={(event) => onAttemptTextChange(event.target.value)}
        rows={4}
        placeholder="Risposta opzionale per il test del flusso."
        className="min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
