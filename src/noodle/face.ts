import type { Point } from "./spine";

/** Seconds a blink takes, closing and opening. */
export const BLINK_TIME = 0.18;
/** How much sideways movement it takes to turn the face the other way (stops flickering). */
export const TURN_THRESHOLD = 0.3;
/** How quickly the eyes catch up with what they look at. */
const LOOK_RATE = 10;

/** How shut the eyes are (0 open, 1 shut) at `t` seconds into a blink. */
export function blinkAmount(t: number): number {
  if (t < 0 || t > BLINK_TIME) return 0;
  return Math.sin((t / BLINK_TIME) * Math.PI);
}

/**
 * Which way the face points: +1 right, -1 left. It only turns once the head clearly moves the
 * other way, so swimming straight up or down doesn't make it flip back and forth.
 */
export function nextFacing(current: 1 | -1, forwardX: number): 1 | -1 {
  if (forwardX > TURN_THRESHOLD) return 1;
  if (forwardX < -TURN_THRESHOLD) return -1;
  return current;
}

/** Where the eyes look, as an offset of at most 1 (pointing at `target` from `from`). */
export function lookOffset(from: Point, target: Point, reach: number): Point {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return { x: 0, y: 0 };
  const strength = Math.min(dist / reach, 1);
  return { x: (dx / dist) * strength, y: (dy / dist) * strength };
}

/** The face's moving parts: which way it faces, its tilt, where it looks and its blinks. */
export class Face {
  facing: 1 | -1 = 1;
  /** Head tilt in radians (nose up or down a little, never upside-down). */
  tilt = 0;
  look: Point = { x: 0, y: 0 };
  blink = 0;
  private blinkClock = 0;
  private nextBlinkIn: number;
  private blinksLeft = 0;

  constructor(private random: () => number = Math.random) {
    this.nextBlinkIn = this.blinkGap();
  }

  /**
   * @param head the head point, @param neck the spine point behind it
   * @param target what the eyes look at (the finger, or straight ahead)
   * @param reach distance at which the eyes are turned all the way
   */
  update(dt: number, head: Point, neck: Point, target: Point, reach: number): void {
    const fx = head.x - neck.x;
    const fy = head.y - neck.y;
    const len = Math.hypot(fx, fy) || 1;
    this.facing = nextFacing(this.facing, fx / len);
    const wantTilt = Math.max(-0.35, Math.min(0.35, (fy / len) * 0.4)) * this.facing;
    this.tilt += (wantTilt - this.tilt) * (1 - Math.exp(-6 * dt));

    const want = lookOffset(head, target, reach);
    const k = 1 - Math.exp(-LOOK_RATE * dt);
    this.look.x += (want.x - this.look.x) * k;
    this.look.y += (want.y - this.look.y) * k;

    this.blinkClock += dt;
    if (this.blinksLeft > 0 || this.blinkClock >= this.nextBlinkIn) {
      if (this.blinksLeft === 0) {
        // Every so often a quick double blink, which reads as extra cute.
        this.blinksLeft = this.random() < 0.25 ? 2 : 1;
        this.blinkClock = 0;
      }
      this.blink = blinkAmount(this.blinkClock);
      if (this.blinkClock > BLINK_TIME) {
        this.blinksLeft--;
        this.blinkClock = 0;
        this.nextBlinkIn = this.blinksLeft > 0 ? 0.08 : this.blinkGap();
        this.blink = 0;
      }
    } else {
      this.blink = 0;
    }
  }

  private blinkGap(): number {
    return 2 + this.random() * 3.5;
  }
}
