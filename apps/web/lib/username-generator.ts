const ADJECTIVES = [
  "swift",
  "bright",
  "calm",
  "clever",
  "curious",
  "gentle",
  "happy",
  "jolly",
  "lively",
  "merry",
  "noble",
  "polite",
  "proud",
  "quick",
  "rustic",
  "sunny",
  "witty",
];

const ANIMALS = [
  "lion",
  "fox",
  "bear",
  "deer",
  "eagle",
  "falcon",
  "otter",
  "panda",
  "rabbit",
  "raven",
  "seal",
  "shark",
  "tiger",
  "turtle",
  "wolf",
  "zebra",
];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Privacy-friendly display name: no PII, easy to read/write. */
export function generateSuggestedUsername(): string {
  const adj = pick(ADJECTIVES);
  const animal = pick(ANIMALS);
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `${adj}-${animal}-${n}`;
}
