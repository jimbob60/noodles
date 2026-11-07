import { describe, expect, it } from "vitest";
import { IdleBrain, type Mode } from "../src/noodle/idleBrain";
import { Swimmer } from "../src/noodle/swimmer";
import { wrapAngle } from "../src/noodle/spine";

function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

const world = { width: 1280, height: 800, unit: 14 };
const opts = { speed: 120, turnRate: 2, swayAmp: 0, swayFreq: 1, slowRadius: 50 };

describe("swimmer", () => {
  it("never turns faster than its turn rate", () => {
    const s = new Swimmer(0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const before = s.heading;
      s.swimTo(1 / 60, -500, 0, opts); // target straight behind
      expect(Math.abs(wrapAngle(s.heading - before))).toBeLessThanOrEqual(2 / 60 + 1e-9);
    }
  });

  it("gets to where it is going", () => {
    const s = new Swimmer(0, 0, Math.PI);
    for (let i = 0; i < 600; i++) s.swimTo(1 / 60, 400, 300, opts);
    expect(Math.hypot(s.x - 400, s.y - 300)).toBeLessThan(20);
  });

  it("curls into a tight, bounded spiral", () => {
    const s = new Swimmer(0, 0, 0);
    let far = 0;
    for (let i = 0; i < 300; i++) {
      s.curl(1 / 60, 80, 50, 1);
      far = Math.max(far, Math.hypot(s.x, s.y));
    }
    expect(far).toBeLessThanOrEqual(101);
  });
});

describe("idle brain", () => {
  function run(seed: number, seconds: number) {
    const random = seeded(seed);
    const brain = new IdleBrain(random);
    const s = new Swimmer(640, 400, 0);
    brain.start("wander", s, world);
    const seen = new Set<Mode>();
    let offscreen = false;
    let sleptOutsideRest = false;
    let sleptAtAll = false;
    for (let i = 0; i < seconds * 60; i++) {
      brain.update(1 / 60, s, world);
      seen.add(brain.mode);
      if (s.x < 0 || s.y < 0 || s.x > world.width || s.y > world.height) offscreen = true;
      if (brain.asleep && brain.mode !== "rest") sleptOutsideRest = true;
      if (brain.asleep) sleptAtAll = true;
    }
    return { seen, offscreen, sleptOutsideRest, sleptAtAll };
  }

  it("wanders, floats and naps over a few minutes", () => {
    const r = run(7, 240);
    expect([...r.seen].sort()).toEqual(["float", "rest", "wander"]);
    expect(r.sleptAtAll).toBe(true);
  });

  it("stays on screen and only sleeps while resting", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = run(seed, 180);
      expect(r.offscreen).toBe(false);
      expect(r.sleptOutsideRest).toBe(false);
    }
  });
});
