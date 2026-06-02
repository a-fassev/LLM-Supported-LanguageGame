"use client";

import type { RunSceneDto } from "@/lib/api-client";

type TaskPanelProps = {
  scene: RunSceneDto;
  attemptText: string;
  onAttemptTextChange: (value: string) => void;
};

export function TaskPanel({ scene, attemptText, onAttemptTextChange }: TaskPanelProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold md:text-lg">Attività in arrivo</h2>
        <p className="text-sm text-muted-foreground">
          Tipo attività: <span className="font-medium">{scene.screen_type}</span>
        </p>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Questo è un placeholder temporaneo. La UI specifica per ogni tipo di esercizio verrà aggiunta in
        una fase successiva.
      </p>
      <textarea
        value={attemptText}
        onChange={(event) => onAttemptTextChange(event.target.value)}
        rows={6}
        placeholder="Scrivi qui una risposta temporanea per il test del flusso."
        className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
