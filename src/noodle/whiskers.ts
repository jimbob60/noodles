import type { Face } from "./face";
import { Spine, type Point } from "./spine";

/** Turns a point in the head's own drawing space (facing right, upright) into screen space. */
export function headToWorld(at: Point, face: Face, local: Point): Point {
  const c = Math.cos(face.tilt);
  const s = Math.sin(face.tilt);
  return {
    x: at.x + face.facing * (local.x * c - local.y * s),
    y: at.y + (local.x * s + local.y * c),
  };
}

/** Where each whisker grows from, in head space (as a share of the head radius). */
const ROOTS: Point[] = [
  // From the sides of the nose, near the tip, like an Eastern dragon's long whiskers.
  { x: 1.32, y: 0.08 },
  { x: 1.18, y: 0.2 },
];

/**
 * Two long whiskers, each a tiny chain that trails from the tip of the snout. They drift down and a little
 * back on their own, so they hang and sway even while the head holds still.
 */
export class Whiskers {
  readonly strands: Spine[];
  private time = 0;

  constructor(at: Point, segment: number) {
    this.strands = ROOTS.map(() => new Spine(at.x, at.y, 7, segment, Math.PI / 5));
  }

  resize(segment: number): void {
    for (const s of this.strands) s.resize(segment);
  }

  update(dt: number, at: Point, headRadius: number, face: Face): void {
    this.time += dt;
    const drift = headRadius * 3 * dt;
    this.strands.forEach((strand, k) => {
      const root = headToWorld(at, face, {
        x: ROOTS[k].x * headRadius,
        y: ROOTS[k].y * headRadius,
      });
      // Gentle drift mostly down and a little back, so they hang below the face, with a lazy sway.
      const sway = Math.sin(this.time * 2.2 + k * 1.7) * 0.6;
      for (let i = 1; i < strand.points.length; i++) {
        const p = strand.points[i];
        // Points further out drift back more, so the whisker curves instead of hanging straight.
        const out = i / strand.points.length;
        p.x += -face.facing * drift * (0.25 + out * 0.9 + sway * 0.25);
        p.y += drift * (0.8 + k * 0.1 - out * 0.35);
      }
      strand.follow(root.x, root.y);
    });
  }
}
