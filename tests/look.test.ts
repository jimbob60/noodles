import { describe, expect, it } from "vitest";
import { makeLook, MIN_CONTRAST, PATTERNS, seededRandom } from "../src/noodle/look";

describe("dragon looks", () => {
  it("are the same every time for the same seed", () => {
    expect(makeLook(1234)).toEqual(makeLook(1234));
    expect(seededRandom(9)()).toBe(seededRandom(9)());
  });

  it("are different for different seeds", () => {
    const bodies = new Set(Array.from({ length: 50 }, (_, i) => makeLook(i + 1).body.h.toFixed(0)));
    expect(bodies.size).toBeGreaterThan(30);
  });

  it("follow the palette rules: bright glowy bodies, patterns that show, no muddy hues", () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const look = makeLook(seed);
      expect(look.body.l).toBeGreaterThanOrEqual(70);
      expect(look.body.s).toBeGreaterThanOrEqual(80);
      expect(Math.abs(look.pattern.l - look.body.l)).toBeGreaterThanOrEqual(MIN_CONTRAST);
      // Muddy yellow-green and dull orange ranges are left out.
      const h = look.body.h;
      expect(h > 55 && h < 135).toBe(false);
      expect(h > 0 && h < 15).toBe(false);
    }
  });

  it("use every pattern kind across many dragons", () => {
    const kinds = new Set(Array.from({ length: 200 }, (_, i) => makeLook(i + 1).patternKind));
    expect([...kinds].sort()).toEqual([...PATTERNS].sort());
  });
});
