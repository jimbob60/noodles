import { wrapAngle } from "./spine";

/**
 * Moves the head like a swimming animal: it has a heading and a speed, turns no faster than
 * its turn rate, and sways side to side as it goes, so paths come out as gentle waves.
 */
export class Swimmer {
  speed = 0;
  private time = 0;

  constructor(
    public x: number,
    public y: number,
    public heading: number,
  ) {}

  /** Swims toward (tx, ty), easing off near it. */
  swimTo(
    dt: number,
    tx: number,
    ty: number,
    o: { speed: number; turnRate: number; swayAmp: number; swayFreq: number; slowRadius: number },
  ): void {
    this.time += dt;
    const dist = Math.hypot(tx - this.x, ty - this.y);
    const want = wrapAngle(Math.atan2(ty - this.y, tx - this.x) - this.heading);
    const maxTurn = o.turnRate * dt;
    this.heading = wrapAngle(this.heading + Math.max(-maxTurn, Math.min(maxTurn, want)));
    // Slow down near the target, and while facing away from it, so it turns in instead of
    // circling the target forever.
    const facing = Math.max(0.25, Math.cos(want));
    const wantSpeed = o.speed * Math.min(1, dist / o.slowRadius) * facing;
    this.speed += (wantSpeed - this.speed) * (1 - Math.exp(-2.5 * dt));
    const move = this.heading + Math.sin(this.time * o.swayFreq) * o.swayAmp;
    this.x += Math.cos(move) * this.speed * dt;
    this.y += Math.sin(move) * this.speed * dt;
  }

  /** Swims in a circle of the given radius (dir +1 clockwise on screen, -1 counter-clockwise). */
  curl(dt: number, speed: number, radius: number, dir: 1 | -1): void {
    this.time += dt;
    this.speed += (speed - this.speed) * (1 - Math.exp(-3 * dt));
    this.heading = wrapAngle(this.heading + (dir * this.speed * dt) / radius);
    this.x += Math.cos(this.heading) * this.speed * dt;
    this.y += Math.sin(this.heading) * this.speed * dt;
  }

  /** Takes over from wherever the head is now (after the finger lets go). */
  reset(x: number, y: number, heading: number, speed: number): void {
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.speed = speed;
  }
}
