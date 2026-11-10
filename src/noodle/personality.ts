import { TRAITS, type Personality } from "./genes";

/** What each trait is called on screen. */
export const TRAIT_LABEL: Record<keyof Personality, string> = {
  playful: "Playful",
  sleepy: "Sleepy",
  greedy: "Greedy",
  shy: "Shy",
};

/** The trait that shows most: the strongest one (ties go in the order playful, sleepy, …). */
export function mainTrait(p: Personality): keyof Personality {
  let best = TRAITS[0];
  for (const t of TRAITS) if (p[t] > p[best]) best = t;
  return best;
}

/**
 * How strongly a trait shows, 0–1. Below 0.4 a trait doesn't show at all, and only the
 * strongest one shows fully (the others at half), so each dragon has one clear personality.
 */
export function expressed(p: Personality, trait: keyof Personality): number {
  const v = trait === mainTrait(p) ? p[trait] : p[trait] * 0.5;
  return Math.max(0, Math.min(1, (v - 0.4) / 0.6));
}

/** How a personality changes the way a dragon behaves. All 1 / 0 / Infinity means "no change". */
export interface Temper {
  /** Swimming speed and wiggle, as multipliers. */
  speed: number;
  sway: number;
  /** Added to the chance a finished mood leads to a nap, and naps last this many times longer. */
  napBonus: number;
  napLength: number;
  /** Shy: how much it keeps to the edges of the den, and keeps its distance from a finger, 0–1. */
  shyness: number;
  /** Seconds between surprise zoomies (playful), yawns (sleepy) and begging (greedy). */
  zoomEvery: number;
  yawnEvery: number;
  begEvery: number;
  /** Greedy: how much faster it rushes to food. */
  lureBoost: number;
  /** Greedy: a happy wiggle after every snack. */
  snackWiggle: boolean;
  /** Sleepy: eyes a little heavy even when not tired, 0–0.3. */
  droop: number;
}

export const NEUTRAL: Temper = {
  speed: 1,
  sway: 1,
  napBonus: 0,
  napLength: 1,
  shyness: 0,
  zoomEvery: Infinity,
  yawnEvery: Infinity,
  begEvery: Infinity,
  lureBoost: 1,
  snackWiggle: false,
  droop: 0,
};

export function temperOf(p: Personality): Temper {
  const playful = expressed(p, "playful");
  const sleepy = expressed(p, "sleepy");
  const greedy = expressed(p, "greedy");
  const shy = expressed(p, "shy");
  const every = (k: number, slow: number, fast: number) =>
    k > 0 ? slow - (slow - fast) * k : Infinity;
  return {
    speed: 1 + 0.4 * playful - 0.3 * sleepy - 0.1 * shy,
    sway: 1 + 0.8 * playful - 0.3 * sleepy,
    napBonus: 0.45 * sleepy - 0.15 * playful,
    napLength: 1 + sleepy,
    shyness: shy,
    zoomEvery: every(playful, 45, 12),
    yawnEvery: every(sleepy, 40, 12),
    begEvery: every(greedy, 40, 14),
    lureBoost: 1 + 0.6 * greedy,
    snackWiggle: greedy > 0.4,
    droop: 0.3 * sleepy,
  };
}
