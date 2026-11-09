/** How much rubbing warms the egg: px of rubbing for 0 → fully warm. */
export const WARM_PX = 600;
/** Warmth lost per second while nobody is rubbing (it cools gently, never below 0). */
export const COOL_PER_S = 0.04;
/** Taps needed to crack it open once it is warm. */
export const CRACKS = 3;
/** Seconds between taps that count (so one tap isn't counted twice). */
export const TAP_GAP = 0.25;
/** Seconds of the hatching animation. */
export const HATCH_TIME = 1.8;

export type EggPhase = "warming" | "cracking" | "hatching" | "done";

/**
 * An egg waiting to hatch. Rub it to warm it up; once warm, tap it to crack it; the third crack
 * hatches it. Nothing can go wrong: it only ever cools a little, and cracks never undo.
 */
export class Egg {
  phase: EggPhase = "warming";
  warmth = 0;
  cracks = 0;
  /** Seconds into the hatching animation. */
  hatchClock = 0;
  /** Seconds since the last crack, for a little jolt. */
  sinceCrack = 9;
  time = 0;
  private lastTap = -9;

  /** 0–1: how much the egg wiggles (more as it warms and when cracked). */
  get wiggle(): number {
    if (this.phase === "hatching") return 1;
    return Math.min(1, this.warmth * 0.7 + this.cracks * 0.15);
  }

  /** `rubbed`: px rubbed on the egg this frame. `tapped`: a fresh tap on the egg this frame. */
  update(dt: number, rubbed: number, tapped: boolean): { cracked: boolean; hatched: boolean } {
    this.time += dt;
    this.sinceCrack += dt;
    const out = { cracked: false, hatched: false };
    if (this.phase === "done") return out;
    if (this.phase === "hatching") {
      this.hatchClock += dt;
      if (this.hatchClock >= HATCH_TIME) {
        this.phase = "done";
        out.hatched = true;
      }
      return out;
    }
    if (rubbed > 0) this.warmth = Math.min(1, this.warmth + rubbed / WARM_PX);
    else if (this.phase === "warming") this.warmth = Math.max(0, this.warmth - COOL_PER_S * dt);
    if (this.phase === "warming" && this.warmth >= 1) this.phase = "cracking";
    if (this.phase === "cracking" && tapped && this.time - this.lastTap >= TAP_GAP) {
      this.lastTap = this.time;
      this.cracks++;
      this.sinceCrack = 0;
      out.cracked = true;
      if (this.cracks >= CRACKS) this.phase = "hatching";
    }
    return out;
  }
}
