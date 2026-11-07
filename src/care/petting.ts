import { seededRandom } from "../noodle/look";
import type { PointerState } from "../engine/input";

type Point = { x: number; y: number };

/** Love gained per pixel rubbed (about +10 for a good 600 px of rubbing). */
export const LOVE_PER_PX = 1 / 60;
/** Most Love petting can give per second, however wildly you rub. */
export const MAX_LOVE_PER_SECOND = 8;
/** Pixels of rubbing for the purr to go from nothing to full. */
const PURR_PER_PX = 1 / 450;
/** How fast the purr fades when the rubbing stops (per second). */
const PURR_FADE = 0.5;
/**
 * Seconds without rubbing before the purr starts to fade. Fingers report movement less often
 * than the game updates (and less evenly on busy or 120 Hz screens), so a pause between two
 * reports must not count as stopping.
 */
export const PURR_GRACE = 0.3;
/** How close (along the body, 0 = nose, 1 = tail tip) counts as rubbing a tickle spot. */
export const TICKLE_REACH = 0.07;
/** Pixels of rubbing on a tickle spot before it sets off a giggle. */
export const TICKLE_RUB = 140;
export const GIGGLE_LOVE = 3;
/** Seconds of giggling and squirming. */
export const GIGGLE_TIME = 1.3;
/** A sparkle pops out every this many pixels rubbed. */
const SPARKLE_EVERY = 45;

/** Each dragon's secret tickle spots, as places along its body (0 = nose, 1 = tail tip). */
export function tickleSpots(seed: number): number[] {
  const r = seededRandom(seed ^ 0x71c_c1e);
  const count = r() < 0.5 ? 1 : 2;
  return Array.from({ length: count }, () => 0.06 + r() * 0.84);
}

export interface PetResult {
  /** True while a finger is petting (so it must not steer the dragon). */
  active: boolean;
  love: number;
  sparkles: Point[];
  tickled: boolean;
}

/**
 * Rubbing the dragon. A press that starts on the dragon pets instead of steering. Rubbing builds
 * a purr and slowly fills the Love orb; rubbing a tickle spot sets off a giggle.
 */
export class Petting {
  active = false;
  /** 0–1: how deep the purr is. */
  purr = 0;
  /** Seconds of giggle left. */
  giggle = 0;
  private last: Point = { x: 0, y: 0 };
  private tickleRub = 0;
  private sparkleRub = 0;
  private sinceRub = Infinity;
  /** Love allowed but not yet given (builds between finger reports; see the bath sponge). */
  private allowance = 0;

  /**
   * @param spotAt where on the body a point is (0 nose – 1 tail), or null if it isn't on the dragon
   * @param tickles the dragon's tickle spots
   */
  update(
    dt: number,
    input: PointerState,
    pressAt: Point | null,
    spotAt: (x: number, y: number) => number | null,
    tickles: number[],
  ): PetResult {
    const result: PetResult = { active: false, love: 0, sparkles: [], tickled: false };
    this.giggle = Math.max(0, this.giggle - dt);
    this.allowance = Math.min(
      this.allowance + MAX_LOVE_PER_SECOND * dt,
      MAX_LOVE_PER_SECOND * 0.25,
    );
    if (pressAt && spotAt(pressAt.x, pressAt.y) !== null) {
      this.active = true;
      this.last = { x: input.x, y: input.y };
      this.tickleRub = 0;
    }
    if (this.active && !input.down) this.active = false;

    let rubbed = 0;
    if (this.active) {
      const d = Math.hypot(input.x - this.last.x, input.y - this.last.y);
      this.last = { x: input.x, y: input.y };
      const spot = spotAt(input.x, input.y);
      if (spot !== null && d > 0) {
        rubbed = d;
        result.love = Math.min(d * LOVE_PER_PX, this.allowance);
        this.allowance -= result.love;
        this.purr = Math.min(1, this.purr + d * PURR_PER_PX);
        this.sparkleRub += d;
        while (this.sparkleRub >= SPARKLE_EVERY) {
          this.sparkleRub -= SPARKLE_EVERY;
          result.sparkles.push({ x: input.x, y: input.y });
        }
        if (tickles.some((t) => Math.abs(t - spot) <= TICKLE_REACH)) {
          this.tickleRub += d;
          if (this.tickleRub >= TICKLE_RUB && this.giggle === 0) {
            this.tickleRub = 0;
            this.giggle = GIGGLE_TIME;
            result.love += GIGGLE_LOVE;
            result.tickled = true;
          }
        }
      }
    }
    this.sinceRub = rubbed > 0 ? 0 : this.sinceRub + dt;
    if (this.sinceRub > PURR_GRACE) this.purr = Math.max(0, this.purr - PURR_FADE * dt);
    result.active = this.active;
    return result;
  }
}
