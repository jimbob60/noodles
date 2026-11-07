import { NEED_NAMES, type NeedName, type Needs } from "./needs";

export type Mood = "happy" | "content" | "hungry" | "tired" | "lonely" | "grubby";

/** Below this, a need sets the mood. */
export const LOW_NEED = 40;
/** With every need at or above this, the dragon is happy. */
export const HAPPY_ABOVE = 70;

const MOOD_FOR: Record<NeedName, Mood> = {
  fullness: "hungry",
  energy: "tired",
  happiness: "lonely",
  cleanliness: "grubby",
};

/**
 * How the dragon feels, from its needs. The lowest need under LOW_NEED wins (ties go in order:
 * hungry, lonely, tired, grubby); otherwise it's happy when everything is high, else content.
 */
export function moodFrom(needs: Needs): Mood {
  let low: NeedName | null = null;
  for (const n of NEED_NAMES) {
    if (needs[n] < LOW_NEED && (low === null || needs[n] < needs[low])) low = n;
  }
  if (low) return MOOD_FOR[low];
  return NEED_NAMES.every((n) => needs[n] >= HAPPY_ABOVE) ? "happy" : "content";
}

/** The need behind a mood (for the thought bubble), or null for happy and content. */
export function needOf(mood: Mood): NeedName | null {
  const found = NEED_NAMES.find((n) => MOOD_FOR[n] === mood);
  return found ?? null;
}

/** How a mood changes the way it swims and how often it naps. */
export interface Pace {
  speed: number;
  sway: number;
  /** Chance a finished mood leads to a nap instead of the usual mix. */
  napChance: number;
}

export const PACE: Record<Mood, Pace> = {
  happy: { speed: 1.25, sway: 1.7, napChance: 0.15 },
  content: { speed: 1, sway: 1, napChance: 0.3 },
  hungry: { speed: 0.9, sway: 0.8, napChance: 0.2 },
  tired: { speed: 0.55, sway: 0.5, napChance: 0.7 },
  lonely: { speed: 0.75, sway: 0.7, napChance: 0.25 },
  grubby: { speed: 0.95, sway: 1, napChance: 0.3 },
};
