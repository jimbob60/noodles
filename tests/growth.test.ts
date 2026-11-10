import { describe, expect, it } from "vitest";
import {
  GROWN_HOURS,
  freshGrowth,
  grow,
  growAway,
  growthShare,
  parseGrowth,
  stageOf,
} from "../src/care/growth";

const happy = { fullness: 80, happiness: 80, energy: 80, cleanliness: 80 };
const neglected = { fullness: 20, happiness: 20, energy: 30, cleanliness: 20 };

describe("growing up", () => {
  it("goes baby → kid → teen → grown-up over about four days of good care", () => {
    let g = freshGrowth();
    const seen: string[] = [stageOf(g).id];
    for (let h = 0; h < 120; h++) {
      g = grow(g, 1, happy);
      if (stageOf(g).id !== seen[seen.length - 1]) seen.push(stageOf(g).id);
    }
    expect(seen).toEqual(["baby", "kid", "teen", "adult"]);
    expect(GROWN_HOURS).toBeGreaterThanOrEqual(72);
    expect(GROWN_HOURS).toBeLessThanOrEqual(120);
    expect(growthShare(g)).toBe(1);
  });

  it("only pauses when neglected: never shrinks, never stuck", () => {
    const g = grow(freshGrowth(), 10, happy);
    expect(grow(g, 50, neglected)).toEqual(g);
    expect(grow(grow(g, 50, neglected), 1, happy).hours).toBe(11);
  });

  it("counts time away, but at most 12 hours at once", () => {
    expect(growAway(freshGrowth(), 3 * 3_600_000, happy).hours).toBe(3);
    expect(growAway(freshGrowth(), 40 * 3_600_000, happy).hours).toBe(12);
    expect(growAway(freshGrowth(), 40 * 3_600_000, neglected).hours).toBe(0);
  });

  it("reads saved growth carefully", () => {
    expect(parseGrowth({ hours: 50 })).toEqual({ hours: 50 });
    expect(parseGrowth({ hours: 5000 })).toEqual({ hours: GROWN_HOURS });
    expect(parseGrowth({ hours: -3 })).toEqual({ hours: 0 });
    expect(parseGrowth(null)).toEqual({ hours: 0 });
  });
});
