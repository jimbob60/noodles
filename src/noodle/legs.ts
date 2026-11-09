import { bodyProfile } from "./body";
import type { Point } from "./spine";

/** Seconds one step takes. */
export const STEP_TIME = 0.13;

/** Unit vector pointing toward the head at spine point i. */
export function forwardAt(p: Point[], i: number): Point {
  const a = p[Math.min(i + 1, p.length - 1)];
  const b = p[Math.max(i - 1, 0)];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
}

export interface Leg {
  /** Which spine point the hip is on. */
  hip: number;
  /**
   * Which side of the body the leg hangs from, -1 to +1. Seen side-on, every leg hangs from the
   * belly (the lower side on screen), so this slides across when the body turns over.
   */
  side: number;
  /** The far leg of the pair: just behind its partner, and drawn darker, as seen side-on. */
  far: boolean;
  foot: Point;
  /** Set while the foot is in the air. */
  step: { from: Point; to: Point; t: number } | null;
}

export interface LegSizes {
  /** Body half-width at its chubbiest. */
  bodyHalf: number;
  /** How far the paw reaches past the body's edge. */
  reach: number;
  /** How far the hip can get from the foot before the foot steps. */
  stride: number;
}

export function legSizes(bodyHalf: number): LegSizes {
  return { bodyHalf, reach: bodyHalf * 0.42, stride: bodyHalf * 0.95 };
}

/** Where the foot would rest right now: below the belly, the near one a little forward. */
export function restSpot(spine: Point[], leg: Leg, s: LegSizes): Point {
  const hip = spine[leg.hip];
  const f = forwardAt(spine, leg.hip);
  const out = s.bodyHalf * bodyProfile(leg.hip / (spine.length - 1)) + s.reach;
  const ahead = s.reach * (leg.far ? -0.7 : 0.7);
  return {
    x: hip.x - f.y * out * leg.side + f.x * ahead,
    y: hip.y + f.x * out * leg.side + f.y * ahead,
  };
}

/**
 * Which side is the belly at a hip: the side facing down the screen, from -1 to +1. It slides
 * smoothly through 0 (feet tucked right under) as the body turns upright, so feet never jump.
 */
export function bellySide(spine: Point[], hip: number): number {
  return Math.max(-1, Math.min(1, forwardAt(spine, hip).x * 2.5));
}

/**
 * Two pairs of legs: front pair just behind the head, back pair partway down the body. Seen
 * side-on, both legs of a pair hang from the belly, one near and one far.
 */
export function makeLegs(spine: Point[], s: LegSizes): Leg[] {
  const front = Math.round(spine.length * 0.17);
  const back = Math.round(spine.length * 0.42);
  const legs: Leg[] = [];
  for (const hip of [front, back]) {
    const side = bellySide(spine, hip);
    for (const far of [false, true]) {
      const leg: Leg = { hip, side, far, foot: { x: 0, y: 0 }, step: null };
      leg.foot = restSpot(spine, leg, s);
      legs.push(leg);
    }
  }
  return legs;
}

/**
 * Plants and lifts the feet. A foot steps when the body has moved too far from it, but only
 * while its partner is on the ground, so the legs take turns.
 */
export function updateLegs(legs: Leg[], spine: Point[], s: LegSizes, dt: number): void {
  for (const leg of legs) leg.side = bellySide(spine, leg.hip);
  for (const leg of legs) {
    if (leg.step) {
      leg.step.t += dt / STEP_TIME;
      // Aim at where the foot should land now, in case the body kept moving.
      const target = leadSpot(spine, leg, s);
      leg.step.to = target;
      const t = Math.min(leg.step.t, 1);
      const e = t * t * (3 - 2 * t);
      leg.foot = {
        x: leg.step.from.x + (leg.step.to.x - leg.step.from.x) * e,
        y: leg.step.from.y + (leg.step.to.y - leg.step.from.y) * e,
      };
      if (leg.step.t >= 1) leg.step = null;
      continue;
    }
    const rest = restSpot(spine, leg, s);
    const away = Math.hypot(leg.foot.x - rest.x, leg.foot.y - rest.y);
    const partner = legs.find((o) => o !== leg && o.hip === leg.hip)!;
    const tooFar = away > s.stride * 2.5;
    if ((away > s.stride && !partner.step) || tooFar) {
      leg.step = { from: { ...leg.foot }, to: leadSpot(spine, leg, s), t: 0 };
    }
  }
}

/** Where a stepping foot lands: past the rest spot, so it starts the next stride ahead. */
function leadSpot(spine: Point[], leg: Leg, s: LegSizes): Point {
  const rest = restSpot(spine, leg, s);
  const f = forwardAt(spine, leg.hip);
  return { x: rest.x + f.x * s.stride * 0.5, y: rest.y + f.y * s.stride * 0.5 };
}

/** How high a foot is lifted (0 planted, 1 top of the step), for drawing it a bit bigger. */
export function liftOf(leg: Leg): number {
  return leg.step ? Math.sin(Math.min(leg.step.t, 1) * Math.PI) : 0;
}
