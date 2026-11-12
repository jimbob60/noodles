import type { Dragon } from "./dragon";
import type { World } from "./idleBrain";
import type { Point } from "./spine";

/** What two dragons are doing together. */
export type Together = "apart" | "meeting" | "nuzzle" | "chase" | "tangle";

/** Seconds each get-together lasts. */
export const NUZZLE_TIME = 2.8;
export const CHASE_TIME = 7;
export const TANGLE_TIME = 3.2;
const MEET_TIMEOUT = 7;
/** Love each dragon gets from a nuzzle, a chase and a tangle. */
export const FRIEND_LOVE = { nuzzle: 4, chase: 3, tangle: 2 } as const;

export interface FriendEvent {
  /** Something lovely just finished: both get this much Love. */
  love: number;
  kind: "nuzzle" | "chase" | "tangle";
}

/**
 * Two dragons in the den together. Most of the time each does its own thing; every so often
 * they get together: swim up for a nose-to-nose nuzzle (hearts!), play chase (taking turns to be
 * "it"), and now and then a chase ends in a giggly tangle that they wriggle out of.
 *
 * It only ever steers a dragon that is free to play (awake, not being held, fed or petted), by
 * setting its `lure`, the same gentle pull food uses; the moment either gets busy, they part.
 */
export class Friendship {
  mode: Together = "apart";
  /** Seconds into the current mode. */
  clock = 0;
  /** Seconds until the next get-together. */
  private wait: number;
  /** Which of the two is "it" in a chase (0 = the first dragon). */
  private it: 0 | 1 = 0;
  private swapped = false;
  private meetAt: Point = { x: 0, y: 0 };
  private runTo: Point = { x: 0, y: 0 };
  private runClock = 0;
  private centre: Point = { x: 0, y: 0 };
  /** How many of each they've done (for checks and, later, friendship levels). */
  count = { nuzzle: 0, chase: 0, tangle: 0 };

  constructor(private random: () => number = Math.random) {
    this.wait = 3 + this.random() * 4;
  }

  private part(): void {
    this.mode = "apart";
    this.clock = 0;
    this.wait = 7 + this.random() * 9;
  }

  private begin(mode: Together): void {
    this.mode = mode;
    this.clock = 0;
  }

  /**
   * Call every frame, after anything else that sets a dragon's lure (food, toys). Returns what
   * just finished, if anything. `free[i]` says whether dragon i may be steered right now.
   */
  update(
    dt: number,
    a: Dragon,
    b: Dragon,
    free: [boolean, boolean],
    world: World,
  ): FriendEvent | null {
    this.clock += dt;
    const both = free[0] && free[1];
    if (this.mode !== "apart" && !both) {
      // One of them got busy (your finger, food, a nap): no hard feelings.
      this.part();
      return null;
    }
    const d: [Dragon, Dragon] = [a, b];
    const clamp = (p: Point, m = 0.1): Point => ({
      x: Math.min(world.width * (1 - m), Math.max(world.width * m, p.x)),
      y: Math.min(world.height * 0.82, Math.max(world.height * 0.14, p.y)),
    });

    if (this.mode === "apart") {
      if (both && this.clock >= this.wait) {
        if (this.random() < 0.5) {
          // Meet in the middle, each coming in from its own side.
          const ha = a.spine.head;
          const hb = b.spine.head;
          this.meetAt = clamp({ x: (ha.x + hb.x) / 2, y: (ha.y + hb.y) / 2 }, 0.2);
          this.begin("meeting");
        } else {
          this.it = this.random() < 0.5 ? 0 : 1;
          this.swapped = false;
          this.runClock = 99;
          this.begin("chase");
        }
      }
      return null;
    }

    if (this.mode === "meeting" || this.mode === "nuzzle") {
      // Noses meet at the meeting point: the one on the left comes from the left.
      const aLeft = a.spine.head.x <= b.spine.head.x;
      const gap = (a.headRadius + b.headRadius) * 0.5;
      const ta = { x: this.meetAt.x + (aLeft ? -gap : gap) * 0.5, y: this.meetAt.y };
      const tb = { x: this.meetAt.x + (aLeft ? gap : -gap) * 0.5, y: this.meetAt.y };
      a.lure = ta;
      b.lure = tb;
      if (this.mode === "meeting") {
        const near =
          Math.hypot(a.mouth.x - ta.x, a.mouth.y - ta.y) < a.headRadius * 0.7 &&
          Math.hypot(b.mouth.x - tb.x, b.mouth.y - tb.y) < b.headRadius * 0.7;
        if (near) {
          this.begin("nuzzle");
          a.cuddle = NUZZLE_TIME;
          b.cuddle = NUZZLE_TIME;
          a.hearts(5);
          b.hearts(5);
        } else if (this.clock > MEET_TIMEOUT) this.part();
        return null;
      }
      if (this.clock >= NUZZLE_TIME) {
        this.count.nuzzle++;
        this.part();
        return { love: FRIEND_LOVE.nuzzle, kind: "nuzzle" };
      }
      return null;
    }

    if (this.mode === "chase") {
      const chaser = d[this.it];
      const runner = d[1 - this.it];
      // "It" goes for the other's tail; the other dashes for somewhere far from "it".
      chaser.lure = { ...runner.tail };
      this.runClock += dt;
      const rh = runner.spine.head;
      if (this.runClock > 1.6 || Math.hypot(rh.x - this.runTo.x, rh.y - this.runTo.y) < 40) {
        this.runClock = 0;
        let best = this.runTo;
        let far = -1;
        for (let k = 0; k < 5; k++) {
          const p = {
            x: world.width * (0.12 + this.random() * 0.76),
            y: world.height * (0.16 + this.random() * 0.62),
          };
          const away = Math.hypot(p.x - chaser.spine.head.x, p.y - chaser.spine.head.y);
          if (away > far) {
            far = away;
            best = p;
          }
        }
        this.runTo = best;
      }
      runner.lure = { ...this.runTo };
      // Tag! Halfway through they swap, so both get a turn to be "it".
      if (!this.swapped && this.clock > CHASE_TIME / 2) {
        this.swapped = true;
        this.it = this.it === 0 ? 1 : 0;
        this.runClock = 99;
        d[this.it].hearts(1);
      }
      if (this.clock >= CHASE_TIME) {
        this.count.chase++;
        const close =
          Math.hypot(a.spine.head.x - b.spine.head.x, a.spine.head.y - b.spine.head.y) <
          (a.headRadius + b.headRadius) * 5;
        if (close && this.random() < 0.45) {
          // Whoops: they've run rings round each other.
          this.centre = clamp(
            {
              x: (a.spine.head.x + b.spine.head.x) / 2,
              y: (a.spine.head.y + b.spine.head.y) / 2,
            },
            0.2,
          );
          this.begin("tangle");
        } else this.part();
        return { love: FRIEND_LOVE.chase, kind: "chase" };
      }
      return null;
    }

    // Tangled: round and round each other in a tight knot, then a giggle and they pop free.
    const turn = this.clock * 5.5;
    const r = (a.halfWidth + b.halfWidth) * 1.1;
    a.lure = { x: this.centre.x + Math.cos(turn) * r, y: this.centre.y + Math.sin(turn) * r * 0.8 };
    b.lure = {
      x: this.centre.x + Math.cos(turn + Math.PI) * r,
      y: this.centre.y + Math.sin(turn + Math.PI) * r * 0.8,
    };
    if (this.clock >= TANGLE_TIME) {
      this.count.tangle++;
      a.giggle();
      b.giggle();
      this.part();
      return { love: FRIEND_LOVE.tangle, kind: "tangle" };
    }
    return null;
  }
}
