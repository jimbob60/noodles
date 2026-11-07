export interface Point {
  x: number;
  y: number;
}

/**
 * The noodle's backbone: a chain of points a fixed distance apart. The head goes where it is
 * told and every other point is dragged along behind it, so the body trails like a ribbon.
 */
export class Spine {
  readonly points: Point[];

  /**
   * @param count number of points, head included
   * @param segment distance between neighbouring points, in CSS pixels
   * @param maxBend sharpest turn allowed between two neighbouring segments, in radians
   */
  constructor(
    x: number,
    y: number,
    count: number,
    public segment: number,
    public maxBend = Math.PI / 7,
  ) {
    // Start laid out straight, trailing down from the head.
    this.points = Array.from({ length: count }, (_, i) => ({ x, y: y + i * segment }));
  }

  get head(): Point {
    return this.points[0];
  }

  /** Moves the head to (x, y) and drags the rest of the body after it. */
  follow(x: number, y: number): void {
    const p = this.points;
    p[0].x = x;
    p[0].y = y;
    for (let i = 1; i < p.length; i++) {
      const prev = p[i - 1];
      let angle = Math.atan2(p[i].y - prev.y, p[i].x - prev.x);
      if (p[i].x === prev.x && p[i].y === prev.y) {
        // Landed exactly on the point ahead: keep the direction of the segment before.
        angle = i >= 2 ? Math.atan2(prev.y - p[i - 2].y, prev.x - p[i - 2].x) : Math.PI / 2;
      }
      if (i >= 2) {
        // No sharp kinks: limit how far this segment can turn from the one ahead of it.
        const ahead = Math.atan2(prev.y - p[i - 2].y, prev.x - p[i - 2].x);
        const bend = wrapAngle(angle - ahead);
        if (Math.abs(bend) > this.maxBend) angle = ahead + Math.sign(bend) * this.maxBend;
      }
      p[i].x = prev.x + Math.cos(angle) * this.segment;
      p[i].y = prev.y + Math.sin(angle) * this.segment;
    }
  }

  /** Changes the spacing (when the screen size changes) without changing the shape. */
  resize(segment: number): void {
    this.segment = segment;
    this.follow(this.head.x, this.head.y);
  }
}

/** Wraps an angle into the range -PI..PI. */
export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
