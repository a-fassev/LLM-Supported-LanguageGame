/** Play-scene body size — shared by story and task copy. */
export const TASK_PLAY_BODY_SIZE = "text-base md:text-lg";

/** Play-scene readable copy — matches StoryPanel body text. */
export const TASK_PLAY_BODY_TEXT = `${TASK_PLAY_BODY_SIZE} leading-relaxed`;

/** Inline gap/correction fields — same size, tight line height for baseline alignment. */
export const TASK_PLAY_INLINE_FIELD_TEXT = `${TASK_PLAY_BODY_SIZE} leading-none`;

export const TASK_PLAY_INSTRUCTION_TEXT =
  `${TASK_PLAY_BODY_TEXT} font-semibold text-foreground`;

export const TASK_PLAY_PROMPT_TEXT =
  `${TASK_PLAY_BODY_TEXT} font-normal text-foreground`;

export const TASK_PLAY_ERROR_TEXT =
  `${TASK_PLAY_BODY_TEXT} text-destructive`;

/** Pre-submit validation under prompt (meta size, destructive — e.g. incomplete draft). */
export const TASK_PLAY_VALIDATION_ERROR_TEXT =
  "text-sm leading-relaxed text-destructive md:text-base";

export const TASK_PLAY_META_TEXT =
  "text-sm leading-relaxed text-muted-foreground md:text-base";

/** Sub-section labels (column headers, drag-drop category titles). */
export const TASK_PLAY_SECTION_LABEL_TEXT =
  `${TASK_PLAY_BODY_TEXT} font-bold text-foreground`;
