"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";
import { isMcMultiSelect } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import type { McOptionView } from "@/lib/game/tasks/multiple-choice/mc-types";

type McOptionListProps = {
  selectionMode: string;
  options: McOptionView[];
  selectedIds: string[];
  groupLabelId: string;
  disabled?: boolean;
  onChange: (selectedIds: string[]) => void;
};

function optionControlId(listId: string, optionId: string) {
  return `${listId}-${optionId}`;
}

export function McOptionList({
  selectionMode,
  options,
  selectedIds,
  groupLabelId,
  disabled,
  onChange,
}: McOptionListProps) {
  const multi = isMcMultiSelect(selectionMode);
  const listId = useId();

  if (multi) {
    return (
      <ul className="space-y-2" aria-labelledby={groupLabelId}>
        {options.map((option) => {
          const controlId = optionControlId(listId, option.id);
          const checked = selectedIds.includes(option.id);
          return (
            <li key={option.id}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-3",
                  checked ? "border-primary bg-primary/5" : "border-border bg-background/80",
                  disabled && "opacity-60",
                )}
              >
                <Checkbox
                  id={controlId}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(next) => {
                    if (disabled) return;
                    if (next === true) {
                      onChange([...selectedIds, option.id]);
                      return;
                    }
                    onChange(selectedIds.filter((id) => id !== option.id));
                  }}
                  className="shrink-0"
                />
                <Label
                  htmlFor={controlId}
                  className={cn(
                    "flex-1 cursor-pointer font-normal",
                    TASK_PLAY_BODY_TEXT,
                    disabled && "cursor-not-allowed",
                  )}
                >
                  {option.label}
                </Label>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  const selectedValue = selectedIds[0] ?? "";

  return (
    <RadioGroup
      value={selectedValue}
      onValueChange={(value) => {
        if (disabled || !value) return;
        onChange([value]);
      }}
      disabled={disabled}
      className="space-y-2"
      aria-labelledby={groupLabelId}
    >
      {options.map((option) => {
        const controlId = optionControlId(listId, option.id);
        const checked = selectedValue === option.id;
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-3",
              checked ? "border-primary bg-primary/5" : "border-border bg-background/80",
              disabled && "opacity-60",
            )}
          >
            <RadioGroupItem id={controlId} value={option.id} className="shrink-0" />
            <Label
              htmlFor={controlId}
              className={cn(
                "flex-1 cursor-pointer font-normal",
                TASK_PLAY_BODY_TEXT,
                disabled && "cursor-not-allowed",
              )}
            >
              {option.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
