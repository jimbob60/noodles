import type { Swimmer } from "./swimmer";

export type Mode = "wander" | "float" | "rest";

export interface World {
  width: number;
  height: number;
  /** Size unit: the spine spacing, so behaviour scales with the dragon. */
  unit: number;
}

/** How long each mood lasts, in seconds [min, max]. */
const LENGTH: Record<Mode, [number, number]> = {
  wander: [6, 10],
  float: [6, 9],
  rest: [10, 15],
};
/** Seconds spent curling up before falling asleep, and stretching awake after. */
export const CURL_TIME = 5;
const WAKE_TIME = 1.2;

/**
 * Decides what the dragon does when nobody is touching it: wander about, float dreamily,
 * or curl up for a nap. Drives a Swimmer.
 */
export class IdleBrain {
  mode: Mode = "wander";
  /** Seconds into the current mood. */
  clock = 0;
  asleep = false;
  private length: number;
  private target = { x: 0, y: 0 };
  private floatCenter = { x: 0, y: 0 };
  private nest: { x: number; y: number; dir: 1 | -1; reached: boolean; curlClock: number } | null =
    null;

  constructor(private random: () => number = Math.random) {
    this.length = this.pickLength("wander");
  }

  /** Starts a mood now (also used to calm down after the finger lets go). */
  start(mode: Mode, swimmer: Swimmer, world: World): void {
    this.mode = mode;
    this.clock = 0;
    this.asleep = false;
    this.length = this.pickLength(mode);
    this.target = this.randomSpot(world);
    this.floatCenter = { x: swimmer.x, y: swimmer.y };
    this.nest = null;
    if (mode === "rest") {
      // Nap somewhere roomy, away from the edges, so the curl fits on screen.
      const nest = this.randomSpot(world, 0.3);
      this.nest = { ...nest, dir: this.random() < 0.5 ? 1 : -1, reached: false, curlClock: 0 };
    }
  }

  /** True while in bed for the night (sleeps until woken, instead of a short nap). */
  get inBed(): boolean {
    return this.mode === "rest" && this.length === Infinity;
  }

  /** Bedtime: swim to the bed, curl up, and stay asleep until `wake`. */
  bedtime(bed: { x: number; y: number }, swimmer: Swimmer, world: World): void {
    this.start("rest", swimmer, world);
    this.length = Infinity;
    this.nest = {
      x: bed.x,
      y: bed.y,
      dir: this.random() < 0.5 ? 1 : -1,
      reached: false,
      curlClock: 0,
    };
  }

  /** Good morning: back to wandering. */
  wake(swimmer: Swimmer, world: World): void {
    this.start("wander", swimmer, world);
  }

  update(dt: number, swimmer: Swimmer, world: World): void {
    this.clock += dt;
    const u = world.unit;
    if (this.mode === "wander") {
      if (Math.hypot(this.target.x - swimmer.x, this.target.y - swimmer.y) < u * 3) {
        this.target = this.randomSpot(world);
      }
      swimmer.swimTo(dt, this.target.x, this.target.y, {
        speed: u * 9,
        turnRate: 2.4,
        swayAmp: 0.35,
        swayFreq: 4,
        slowRadius: u * 4,
      });
    } else if (this.mode === "float") {
      // A slow, dreamy loop around where it started floating, bobbing as it goes.
      const t = this.clock * 0.35;
      const tx = this.floatCenter.x + Math.sin(t) * u * 9;
      const ty = this.floatCenter.y + Math.sin(t * 2) * u * 3;
      const safe = this.clampToScreen({ x: tx, y: ty }, world, 0.12);
      swimmer.swimTo(dt, safe.x, safe.y, {
        speed: u * 3.2,
        turnRate: 1.4,
        swayAmp: 0.6,
        swayFreq: 1.6,
        slowRadius: u * 2,
      });
    } else {
      this.updateRest(dt, swimmer, world);
    }

    if (this.clock >= this.length) this.start(this.nextMode(), swimmer, world);
  }

  private updateRest(dt: number, swimmer: Swimmer, world: World): void {
    const nest = this.nest!;
    const u = world.unit;
    if (!nest.reached) {
      swimmer.swimTo(dt, nest.x, nest.y, {
        speed: u * 7,
        turnRate: 2.4,
        swayAmp: 0.2,
        swayFreq: 3,
        slowRadius: u * 1,
      });
      if (Math.hypot(nest.x - swimmer.x, nest.y - swimmer.y) < u * 2) nest.reached = true;
      // Don't let a long trip eat the whole nap.
      this.clock = Math.min(this.clock, 1);
      return;
    }
    nest.curlClock += dt;
    const k = Math.min(nest.curlClock / CURL_TIME, 1);
    // Spiral inward while slowing down: the body follows the head's path into a coil.
    // Long enough at speed to wrap the whole body once around (the body is about 25 units long).
    const radius = u * (5 - 2.2 * k);
    const speed = u * 7.5 * (1 - k * k);
    swimmer.curl(dt, speed, radius, nest.dir);
    const wakeAt = this.length - WAKE_TIME;
    this.asleep = nest.curlClock > CURL_TIME && this.clock < wakeAt;
  }

  private nextMode(): Mode {
    const r = this.random();
    if (this.mode === "rest") return r < 0.6 ? "wander" : "float";
    if (r < 0.45) return this.mode === "wander" ? "float" : "wander";
    if (r < 0.75) return "rest";
    return this.mode;
  }

  private pickLength(mode: Mode): number {
    const [a, b] = LENGTH[mode];
    return a + this.random() * (b - a);
  }

  /** A random spot, keeping `margin` (share of the screen) away from the edges. */
  private randomSpot(world: World, margin = 0.12): { x: number; y: number } {
    return {
      x: world.width * (margin + this.random() * (1 - 2 * margin)),
      y: world.height * (margin + this.random() * (1 - 2 * margin)),
    };
  }

  private clampToScreen(p: { x: number; y: number }, world: World, margin: number) {
    return {
      x: Math.min(world.width * (1 - margin), Math.max(world.width * margin, p.x)),
      y: Math.min(world.height * (1 - margin), Math.max(world.height * margin, p.y)),
    };
  }
}
