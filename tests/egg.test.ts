import { describe, expect, it } from "vitest";
import { CRACKS, Egg, HATCH_TIME, TAP_GAP, WARM_PX } from "../src/egg/egg";

const warmUp = (e: Egg) => {
  for (let i = 0; i < 200 && e.phase === "warming"; i++) e.update(1 / 60, WARM_PX / 60, false);
};

describe("egg", () => {
  it("warms up when rubbed, and taps do nothing until it's warm", () => {
    const e = new Egg();
    e.update(1 / 60, 0, true);
    expect(e.cracks).toBe(0);
    warmUp(e);
    expect(e.warmth).toBe(1);
    expect(e.phase).toBe("cracking");
  });

  it("cools gently when left alone, but never below cold", () => {
    const e = new Egg();
    e.update(1 / 60, WARM_PX / 2, false);
    for (let i = 0; i < 60 * 60; i++) e.update(1 / 60, 0, false);
    expect(e.warmth).toBe(0);
  });

  it("cracks once per tap, and hatches after the last crack and the animation", () => {
    const e = new Egg();
    warmUp(e);
    let hatched = false;
    for (let c = 0; c < CRACKS; c++) {
      expect(e.update(1 / 60, 0, true).cracked).toBe(true);
      for (let i = 0; i < 60 * TAP_GAP + 1; i++) e.update(1 / 60, 0, false);
    }
    expect(e.phase).toBe("hatching");
    for (let i = 0; i < 60 * (HATCH_TIME + 0.2) && !hatched; i++)
      hatched = e.update(1 / 60, 0, false).hatched;
    expect(hatched).toBe(true);
    expect(e.phase).toBe("done");
  });

  it("doesn't count one held tap twice", () => {
    const e = new Egg();
    warmUp(e);
    e.update(1 / 60, 0, true);
    e.update(1 / 60, 0, true);
    expect(e.cracks).toBe(1);
  });

  it("wiggles more as it warms and cracks", () => {
    const e = new Egg();
    const cold = e.wiggle;
    warmUp(e);
    expect(e.wiggle).toBeGreaterThan(cold);
  });
});
