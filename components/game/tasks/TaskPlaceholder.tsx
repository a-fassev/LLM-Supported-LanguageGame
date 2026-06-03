type TaskPlaceholderProps = {
  screenType: string;
};

export function TaskPlaceholder({ screenType }: TaskPlaceholderProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background/60 px-3 py-4 text-sm text-muted-foreground">
      Tipo di attività non ancora disponibile: <span className="font-medium text-foreground">{screenType}</span>
    </div>
  );
}
