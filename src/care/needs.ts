/**
 * The four needs, each 0–100 where 100 means perfectly cared for. They change slowly with the
 * real clock, including while the app is closed, but gently: they never fall below FLOOR, and time
 * away counts for at most OFFLINE_CAP_HOURS. No dying, no punishment (see VISION.md).
 */
export type NeedName = "fullness" | "happiness" | "energy" | "cleanliness";
export const NEED_NAMES: NeedName[] = ["fullness", "happiness", "energy", "cleanliness"];

export type Needs = Record<NeedName, number>;

export interface NeedsState {
  values: Needs;
  /** When the needs were last brought up to date (milliseconds since 1970). */
  lastSeen: number;
  /** In bed for the night: time away counts as sleep (Energy refills). */
  inBed?: boolean;
}

export const MAX = 100;
/** The lowest any need can go: a neglected dragon is just sleepy and a bit sad, never in danger. */
export const FLOOR = 15;
/** Time away beyond this counts as this much, so a week away is no worse than a long night. */
export const OFFLINE_CAP_HOURS = 12;

/** Change per hour while awake. */
export const AWAKE_RATES: Needs = { fullness: -10, happiness: -8, energy: -6, cleanliness: -5 };
/** Change per hour while asleep: energy refills, and everything else slows down. */
export const ASLEEP_RATES: Needs = { fullness: -5, happiness: -2, energy: 40, cleanliness: -2.5 };

const HOUR = 3_600_000;

export function freshNeeds(now: number): NeedsState {
  return { values: { fullness: 90, happiness: 90, energy: 90, cleanliness: 90 }, lastSeen: now };
}

const clamp = (v: number) => Math.min(MAX, Math.max(FLOOR, v));

/** Brings the needs up to `now`. A clock that went backwards just restarts the count. */
export function advance(state: NeedsState, now: number, asleep = false): NeedsState {
  const elapsed = now - state.lastSeen;
  if (!Number.isFinite(elapsed) || elapsed <= 0)
    return { values: { ...state.values }, lastSeen: now, inBed: state.inBed };
  const hours = Math.min(elapsed / HOUR, OFFLINE_CAP_HOURS);
  const rates = asleep ? ASLEEP_RATES : AWAKE_RATES;
  const values = { ...state.values };
  for (const name of NEED_NAMES) values[name] = clamp(values[name] + rates[name] * hours);
  return { values, lastSeen: now, inBed: state.inBed };
}

/** Applies a care action's effects, e.g. { fullness: +25 } for a snack. */
export function change(state: NeedsState, deltas: Partial<Needs>): NeedsState {
  const values = { ...state.values };
  for (const name of NEED_NAMES) {
    const d = deltas[name];
    if (d !== undefined) values[name] = clamp(values[name] + d);
  }
  return { values, lastSeen: state.lastSeen, inBed: state.inBed };
}

/** The need that most wants attention (lowest value), for moods and the display. */
export function lowestNeed(values: Needs): NeedName {
  return NEED_NAMES.reduce((low, n) => (values[n] < values[low] ? n : low), NEED_NAMES[0]);
}

/**
 * Reads saved needs, accepting only sensible data: anything missing or broken is replaced with a
 * fresh value instead of crashing, and out-of-range numbers are pulled back into range.
 */
export function parseNeeds(raw: unknown, now: number): NeedsState {
  const fresh = freshNeeds(now);
  if (!raw || typeof raw !== "object") return fresh;
  const r = raw as { values?: Record<string, unknown>; lastSeen?: unknown; inBed?: unknown };
  const lastSeen =
    typeof r.lastSeen === "number" && Number.isFinite(r.lastSeen) && r.lastSeen <= now
      ? r.lastSeen
      : now;
  const values = { ...fresh.values };
  for (const name of NEED_NAMES) {
    const v = r.values?.[name];
    if (typeof v === "number" && Number.isFinite(v)) values[name] = clamp(v);
  }
  return { values, lastSeen, inBed: r.inBed === true };
}
