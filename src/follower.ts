/** How quickly the dot catches up with the finger (higher = snappier). */
export const FOLLOW_RATE = 10;

/**
 * Moves `from` toward `to` by a frame-rate-independent fraction: the same feel at 30 or 120 fps.
 */
export function ease(from: number, to: number, rate: number, dt: number): number {
  return to + (from - to) * Math.exp(-rate * dt);
}

export interface Sparkle {
  x: number;
  y: number;
  life: number;
}

/** The glowing dot of phase 5: chases the finger and leaves a short sparkly trail. */
export class Follower {
  x: number;
  y: number;
  sparkles: Sparkle[] = [];
  private time = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, targetX: number, targetY: number, rate = FOLLOW_RATE): void {
    this.time += dt;
    const px = this.x;
    const py = this.y;
    this.x = ease(this.x, targetX, rate, dt);
    this.y = ease(this.y, targetY, rate, dt);
    // Drop sparkles along the path, more when moving fast.
    const speed = Math.hypot(this.x - px, this.y - py) / dt;
    if (speed > 30 || Math.floor(this.time * 20) !== Math.floor((this.time - dt) * 20)) {
      this.sparkles.push({ x: this.x, y: this.y, life: 1 });
    }
    for (const s of this.sparkles) s.life -= dt * 1.6;
    this.sparkles = this.sparkles.filter((s) => s.life > 0);
  }
}
