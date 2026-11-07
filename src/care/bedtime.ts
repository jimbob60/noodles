import type { Needs } from "./needs";

/**
 * Energy refilled per second while asleep in bed with the app open: about 4 minutes from low to
 * full, so a bedtime can be watched. (With the app closed, the slower overnight rate in needs.ts
 * applies.)
 */
export const BED_REFILL_PER_S = 0.35;
/** At this Energy a sleeping dragon wakes up by itself. */
export const WAKE_AT = 100;

/** Energy gained this frame while sleeping in bed. */
export function bedRefill(dt: number, asleepInBed: boolean): number {
  return asleepInBed ? BED_REFILL_PER_S * dt : 0;
}

export function rested(needs: Needs): boolean {
  return needs.energy >= WAKE_AT;
}

/** At or above this Energy it isn't sleepy, and politely won't go to bed. */
export const NOT_SLEEPY = 90;

export function sleepy(needs: Needs): boolean {
  return needs.energy < NOT_SLEEPY;
}
