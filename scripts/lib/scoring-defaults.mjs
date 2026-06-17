/** Shared pizza/backpack scoring defaults for chapter catalog generators. */

/** @type {Record<string, number>} */
export const PIZZA_MAX_SLICES_BY_SCREEN_TYPE = {
  matching: 5,
  drag_drop: 5,
  multiple_choice: 5,
  cloze: 10,
  error_spotting: 10,
  free_text: 15,
};

/**
 * @param {string} screenType
 * @returns {number}
 */
export function pizzaMaxSlicesForScreenType(screenType) {
  const maxSlices = PIZZA_MAX_SLICES_BY_SCREEN_TYPE[screenType];
  if (maxSlices === undefined) {
    throw new Error(`[scoring-defaults] unknown screen_type '${screenType}'`);
  }
  return maxSlices;
}

/**
 * @param {string} screenType
 * @param {Record<string, unknown>} [pizzaOverrides]
 */
export function taskScoring(screenType, pizzaOverrides = {}) {
  return {
    backpack: { pieces: 1 },
    pizza: {
      mode: "scored",
      maxSlices: pizzaMaxSlicesForScreenType(screenType),
      rounding: "nearest",
      mapping: { kind: "linear" },
      ...pizzaOverrides,
    },
  };
}
