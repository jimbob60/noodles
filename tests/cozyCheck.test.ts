import { describe, expect, it } from "vitest";
import { bedRefill } from "../src/care/bedtime";
import { feedEffect } from "../src/care/food";
import { moodFrom } from "../src/care/mood";
import { advance, change, FLOOR, type NeedsState } from "../src/care/needs";
import { MAX_LOVE_PER_SECOND } from "../src/care/petting";
import { MAX_CLEAN_PER_SECOND } from "../src/ui/bath";
import { BOOP_ENERGY, BOOP_LOVE, BOOPS_PER_GAME } from "../src/ui/toys";

const T0 = Date.UTC(2026, 10, 7, 12);

describe("phase 20 gate: the cozy check", () => {
  it("has no dying and no punishment: a whole week alone only gets it sleepy", () => {
    const left: NeedsState = {
      values: { fullness: 100, happiness: 100, energy: 100, cleanliness: 100 },
      lastSeen: T0,
    };
    const back = advance(left, T0 + 7 * 24 * 3_600_000);
    for (const v of Object.values(back.values)) expect(v).toBeGreaterThanOrEqual(FLOOR);
    expect(moodFrom(back.values)).toBe("tired");
  });

  it("brings a neglected dragon all the way back to happy with one gentle care session", () => {
    let s: NeedsState = {
      values: { fullness: FLOOR, happiness: FLOOR, energy: FLOOR, cleanliness: FLOOR },
      lastSeen: T0,
    };
    let seconds = 0;
    // 1. A snack of each food (a few seconds of dragging each).
    for (const food of ["noodles", "dumpling", "fish"] as const) {
      s = change(s, feedEffect(food, food === "fish"));
      seconds += 5;
    }
    // 2. A bath: about 8 seconds of scrubbing at full speed.
    s = change(s, { cleanliness: MAX_CLEAN_PER_SECOND * 8 });
    seconds += 8;
    // 3. A good petting: 15 seconds of rubbing.
    s = change(s, { happiness: MAX_LOVE_PER_SECOND * 15 });
    seconds += 15;
    // 4. Bedtime until rested (the slowest part, watching it snore).
    let sleep = 0;
    while (s.values.energy < 100) {
      s = change(s, { energy: bedRefill(1, true) });
      sleep++;
    }
    seconds += sleep;
    // 5. A game of ball after waking up.
    s = change(s, { happiness: BOOP_LOVE * BOOPS_PER_GAME, energy: -BOOP_ENERGY * BOOPS_PER_GAME });
    seconds += 20;

    expect(moodFrom(s.values)).toBe("happy");
    // Gentle, not a chore: the whole thing fits in about five minutes, most of it a nap.
    expect(seconds).toBeLessThan(6 * 60);
  });

  it("recovers step by step: every bit of care helps the mood", () => {
    let s: NeedsState = {
      values: { fullness: FLOOR, happiness: FLOOR, energy: 80, cleanliness: FLOOR },
      lastSeen: T0,
    };
    expect(moodFrom(s.values)).toBe("tired");
    s = change(s, feedEffect("noodles", false));
    s = change(s, feedEffect("fish", false));
    expect(moodFrom(s.values)).not.toBe("hungry");
    s = change(s, { cleanliness: 80 });
    expect(moodFrom(s.values)).toBe("lonely"); // only Love left: puppy eyes
    s = change(s, { happiness: 60 });
    expect(["happy", "content"]).toContain(moodFrom(s.values));
  });
});
