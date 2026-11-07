import type { Point } from "./spine";

/** Seconds of chewing per snack, and how many chomps fit in it. */
export const CHEW_TIME = 1.2;
export const CHOMPS = 3;
/** Seconds of a big wake-up yawn. */
export const YAWN_TIME = 1.6;
/** Seconds of the "no thanks" head shake. */
export const SHAKE_TIME = 0.8;
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
  /** While asleep the eyes stay shut. */
  asleep = false;
  /** While being petted: happy closed "^ ^" eyes. */
  happy = false;
  /** Seconds of chewing left (three big chomps). */
  chewLeft = 0;
  /** Seconds of "no thanks" head shake left. */
  shakeLeft = 0;
  /** Seconds of yawn left (one big slow open-and-close). */
  yawnLeft = 0;
  /** How droopy the eyelids are (0 wide awake, about 0.55 very tired). */
  droop = 0;
  /** The mouth when it isn't eating or yawning. */
  mouthShape: "w" | "smile" | "pout" = "w";
  /** Big pleading puppy eyes (when lonely). */
  pleading = false;
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
    if (this.asleep || this.happy) this.blink = 1;
    this.chewLeft = Math.max(0, this.chewLeft - dt);
    this.shakeLeft = Math.max(0, this.shakeLeft - dt);
    this.yawnLeft = Math.max(0, this.yawnLeft - dt);
    if (this.yawnLeft > 0) this.blink = 1;
  }

  /** How open the mouth is (0 shut, 1 wide) while chewing. */
  get mouthOpen(): number {
    if (this.yawnLeft > 0)
      return Math.sin(((YAWN_TIME - this.yawnLeft) / YAWN_TIME) * Math.PI) * 1.3;
    if (this.chewLeft <= 0) return 0;
    const t = CHEW_TIME - this.chewLeft;
    return Math.max(0, Math.sin(t * Math.PI * (CHOMPS / CHEW_TIME)));
  }

  /** Side-to-side head turn (radians) for a polite "no thanks". */
  get shakeAngle(): number {
    if (this.shakeLeft <= 0) return 0;
    const t = SHAKE_TIME - this.shakeLeft;
    return Math.sin(t * Math.PI * 6) * 0.3 * (this.shakeLeft / SHAKE_TIME);
  }

  private blinkGap(): number {
    return 2 + this.random() * 3.5;
  }
}
