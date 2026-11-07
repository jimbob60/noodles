import { describe, expect, it } from "vitest";
import { lightInSky, skyAt } from "../src/den/timeOfDay";

describe("day and night", () => {
  it("is a starry dark night at midnight", () => {
    const s = skyAt(0);
    expect(s.stars).toBe(1);
    expect(s.dark).toBe(1);
    expect(s.top.l).toBeLessThan(12);
  });

  it("is a soft twilight at noon, never harsh and bright", () => {
    const s = skyAt(12);
    expect(s.stars).toBeLessThan(0.1);
    for (let h = 0; h < 24; h += 0.25) {
      const k = skyAt(h);
      expect(k.top.l).toBeLessThanOrEqual(62);
      expect(k.bottom.l).toBeLessThanOrEqual(62);
    }
  });

  it("changes gently: no jumps from one minute to the next", () => {
    for (let m = 0; m < 24 * 60; m++) {
      const a = skyAt(m / 60);
      const b = skyAt((m + 1) / 60);
      expect(Math.abs(a.top.l - b.top.l)).toBeLessThan(0.6);
      expect(Math.abs(a.stars - b.stars)).toBeLessThan(0.03);
    }
  });

  it("wraps round midnight smoothly", () => {
    expect(skyAt(23.999).top.l).toBeCloseTo(skyAt(0).top.l, 1);
    expect(skyAt(24).stars).toBe(skyAt(0).stars);
  });

  it("has dawn pinks and dusk peach", () => {
    expect(skyAt(6).bottom.h).toBeGreaterThan(300); // pink
    const dusk = skyAt(18.5).bottom.h;
    expect(dusk).toBeGreaterThan(5);
    expect(dusk).toBeLessThan(40); // peach-orange
  });

  it("puts a soft sun up by day and the moon up by night", () => {
    expect(lightInSky(12)?.kind).toBe("sun");
    expect(lightInSky(0)?.kind).toBe("moon");
    expect(lightInSky(19)).toBeNull(); // between: just the glow of dusk
  });
});

describe("hill colours", () => {
  it("blend the short way round the colour wheel (orange with violet is never green)", async () => {
    const { mix } = await import("../src/noodle/drawBody");
    const dusk = mix({ h: 18, s: 70, l: 58 }, { h: 262, s: 35, l: 22 }, 0.55);
    expect(dusk.h > 90 && dusk.h < 200).toBe(false);
  });
});
