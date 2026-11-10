import type { Needs } from "./needs";

/** The four life stages, and how many hours of good care it takes to reach each. */
export const STAGES = [
  { id: "baby", name: "baby", hours: 0 },
  { id: "kid", name: "kid", hours: 24 },
  { id: "teen", name: "teen", hours: 60 },
  { id: "adult", name: "grown-up", hours: 96 },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

/** Hours of good care to grow all the way up (about four days). */
export const GROWN_HOURS = STAGES[STAGES.length - 1].hours;
/** Time away counts toward growing, but no more than this much at once (like the needs). */
export const AWAY_CAP_HOURS = 12;
/** Cared for well enough to grow: the needs average at least this. */
export const GROW_ABOVE = 45;

export interface Growth {
  /** Hours spent well cared for since hatching. */
  hours: number;
}

export const freshGrowth = (): Growth => ({ hours: 0 });

/** Well cared for: needs are, on average, comfortably full. Sleep counts too. */
export function wellCared(values: Needs): boolean {
  const avg = (values.fullness + values.happiness + values.energy + values.cleanliness) / 4;
  return avg >= GROW_ABOVE;
}

/**
 * Grows a little while the dragon is well cared for. Neglect just pauses growing: a dragon
 * never shrinks and never gets stuck.
 */
export function grow(g: Growth, hours: number, values: Needs): Growth {
  if (hours <= 0 || !wellCared(values)) return g;
  return { hours: Math.min(GROWN_HOURS, g.hours + hours) };
}

/** Time away from the game counts, capped, if the dragon was left well cared for. */
export function growAway(g: Growth, awayMs: number, values: Needs): Growth {
  return grow(g, Math.min(AWAY_CAP_HOURS, Math.max(0, awayMs) / 3_600_000), values);
}

/** How grown up, 0 (just hatched) to 1 (fully grown). */
export function growthShare(g: Growth): number {
  return Math.max(0, Math.min(1, g.hours / GROWN_HOURS));
}

export function stageOf(g: Growth): (typeof STAGES)[number] {
  let s: (typeof STAGES)[number] = STAGES[0];
  for (const t of STAGES) if (g.hours >= t.hours) s = t;
  return s;
}

/** Reads saved growth, accepting only sensible numbers. */
export function parseGrowth(raw: unknown): Growth {
  const h = (raw as { hours?: unknown } | null)?.hours;
  return typeof h === "number" && Number.isFinite(h)
    ? { hours: Math.max(0, Math.min(GROWN_HOURS, h)) }
    : freshGrowth();
}
