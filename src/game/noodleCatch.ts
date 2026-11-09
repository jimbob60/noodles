import type { Point } from "../noodle/spine";

/** Seconds of the 3-2-1 countdown, and of play. */
export const COUNTDOWN = 3;
export const ROUND_TIME = 45;
/** Points for a dumpling and for a rare golden one. */
export const POINTS = { dumpling: 1, golden: 3 } as const;
/** Coins: one for every two points, up to this many a round. */
export const MAX_ROUND_COINS = 25;
/** What a round does to the needs: a bit of Love and Food, a bit of tiredness. */
export const ROUND_LOVE = 6;
export const ROUND_ENERGY = -8;
export const FOOD_PER_CATCH = 0.6;

export type Treat = "dumpling" | "golden";

export interface Faller {
  kind: Treat;
  x: number;
  y: number;
  vy: number;
  spin: number;
  /** Missed ones bounce once on the floor and fade away. */
  landed: number;
}

export function coinsFor(score: number): number {
  return Math.min(MAX_ROUND_COINS, Math.floor(score / 2));
}

/** How hard the round is at time t (0–1 through the round): faster and busier near the end. */
export function pace(t: number): { spawnEvery: number; fallSpeed: number } {
  const k = Math.min(1, Math.max(0, t));
  return { spawnEvery: 0.9 - 0.45 * k, fallSpeed: 160 + 160 * k };
}

/**
 * Noodle Catch: dumplings fall from the sky and the dragon catches them in its mouth. Nothing
 * bad ever falls; a missed dumpling just bounces off the floor.
 */
export class NoodleCatch {
  phase: "countdown" | "playing" | "done" = "countdown";
  clock = 0;
  score = 0;
  caught = 0;
  fallers: Faller[] = [];
  /** Little "+1"/"+3" pops where a dumpling was caught. */
  pops: { x: number; y: number; text: string; age: number }[] = [];
  private spawnClock = 0;

  constructor(
    private width: number,
    private height: number,
    private random: () => number = Math.random,
  ) {}

  /** Seconds of play left (whole round while counting down). */
  get timeLeft(): number {
    if (this.phase === "countdown") return ROUND_TIME;
    return Math.max(0, ROUND_TIME - this.clock);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Steps the round. `mouth` is where the dragon's mouth is. Returns what was caught. */
  update(dt: number, mouth: Point, reach: number): Treat[] {
    const caughtNow: Treat[] = [];
    for (const p of this.pops) p.age += dt;
    this.pops = this.pops.filter((p) => p.age < 0.9);
    if (this.phase === "done") return caughtNow;
    this.clock += dt;
    if (this.phase === "countdown") {
      if (this.clock >= COUNTDOWN) {
        this.phase = "playing";
        this.clock = 0;
      }
      return caughtNow;
    }
    const t = this.clock / ROUND_TIME;
    const { spawnEvery, fallSpeed } = pace(t);
    this.spawnClock += dt;
    if (this.spawnClock >= spawnEvery && this.clock < ROUND_TIME - 0.5) {
      this.spawnClock = 0;
      const golden = this.random() < 0.12;
      this.fallers.push({
        kind: golden ? "golden" : "dumpling",
        x: this.width * (0.1 + 0.8 * this.random()),
        y: -30,
        vy: fallSpeed * (golden ? 1.25 : 1) * (0.85 + 0.3 * this.random()),
        spin: this.random() * 6,
        landed: 0,
      });
    }
    const floor = this.height * 0.86;
    for (const f of this.fallers) {
      if (f.landed > 0) {
        f.landed += dt;
        continue;
      }
      f.y += f.vy * dt;
      f.spin += dt * 2;
      if (Math.hypot(f.x - mouth.x, f.y - mouth.y) < reach) {
        f.landed = -1; // eaten
        const pts = POINTS[f.kind];
        this.score += pts;
        this.caught++;
        caughtNow.push(f.kind);
        this.pops.push({ x: f.x, y: f.y, text: `+${pts}`, age: 0 });
      } else if (f.y >= floor) {
        f.y = floor;
        f.landed = 0.001;
      }
    }
    this.fallers = this.fallers.filter((f) => f.landed >= 0 && f.landed < 0.8);
    if (this.clock >= ROUND_TIME) {
      this.phase = "done";
      this.fallers = [];
    }
    return caughtNow;
  }
}

/** Reads a saved best score. */
export function parseBest(v: unknown): number {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? Math.min(v, 9999) : 0;
}
