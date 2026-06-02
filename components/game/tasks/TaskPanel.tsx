"use client";

import type { RunSceneDto } from "@/lib/api-client";
import { readNonEmptyString } from "@/lib/game/read-non-empty-string";

type TaskPanelProps = {
  scene: RunSceneDto;
  attemptText: string;
  onAttemptTextChange: (value: string) => void;
};

function taskTitle(scene: RunSceneDto): string | null {
  const content = scene.content;
  return (
    readNonEmptyString(content.title) ??
    readNonEmptyString((content.task as { title?: unknown } | undefined)?.title) ??
    null
  );
}

function taskInstruction(scene: RunSceneDto): string | null {
  const content = scene.content;
  const task = content.task as Record<string, unknown> | undefined;
  return (
    readNonEmptyString(content.instruction) ??
    readNonEmptyString(content.instructions) ??
    readNonEmptyString(task?.instruction) ??
    readNonEmptyString(task?.instructions) ??
    null
  );
}

export function TaskPanel({ scene, attemptText, onAttemptTextChange }: TaskPanelProps) {
  const title = taskTitle(scene);
  const instruction = taskInstruction(scene);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold md:text-lg">{title ?? "Attività"}</h2>
      </div>
      {instruction ? (
        <p className="text-sm leading-relaxed">{instruction}</p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Completa l&apos;attività e premi «Controlla» per continuare.
        </p>
      )}
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
