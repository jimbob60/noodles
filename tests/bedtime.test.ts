import { describe, expect, it } from "vitest";
import { BED_REFILL_PER_S, bedRefill, NOT_SLEEPY, rested, sleepy } from "../src/care/bedtime";
import { Dragon } from "../src/noodle/dragon";
import { bedButton, bedSpot, onBedButton } from "../src/ui/bedtime";

const world = { width: 1280, height: 800, unit: 16 };
const noFinger = { x: 0, y: 0, down: false };

describe("bedtime rules", () => {
  it("refills Energy only while asleep in bed, about low-to-full in 4 minutes", () => {
    expect(bedRefill(1, false)).toBe(0);
    expect(bedRefill(1, true)).toBe(BED_REFILL_PER_S);
    expect(80 / BED_REFILL_PER_S / 60).toBeGreaterThan(3);
    expect(80 / BED_REFILL_PER_S / 60).toBeLessThan(5);
  });

  it("only lets a sleepy dragon go to bed", () => {
    const needs = { fullness: 50, happiness: 50, energy: NOT_SLEEPY - 1, cleanliness: 50 };
    expect(sleepy(needs)).toBe(true);
    expect(sleepy({ ...needs, energy: NOT_SLEEPY })).toBe(false);
  });

  it("wakes the dragon once it's fully rested", () => {
    expect(rested({ fullness: 50, happiness: 50, energy: 99, cleanliness: 50 })).toBe(false);
    expect(rested({ fullness: 50, happiness: 50, energy: 100, cleanliness: 50 })).toBe(true);
  });

  it("has a tappable button that doesn't overlap the toy tray", () => {
    for (const [w, h] of [
      [1280, 800],
      [800, 1280],
      [390, 844],
    ]) {
      const b = bedButton(w, h);
      expect(onBedButton(b, w, h)).toBe(true);
      expect(b.y + b.r).toBeLessThan(h - 14 - 2 * b.r); // above the bottom row
    }
  });
});

describe("a dragon at bedtime", () => {
  it("goes to bed, curls up and stays asleep well past a normal nap", () => {
    const d = new Dragon(200, 200, 16, world, undefined, () => 0.5);
    d.goToBed(bedSpot(1280, 800), world);
    let asleepAt = -1;
    for (let i = 0; i < 60 * 60; i++) {
      d.update(1 / 60, noFinger, world);
      if (d.asleep && asleepAt < 0) asleepAt = i / 60;
    }
    expect(asleepAt).toBeGreaterThan(0);
    expect(d.asleep).toBe(true); // still asleep a minute later
    expect(d.inBed).toBe(true);
    const bed = bedSpot(1280, 800);
    expect(Math.hypot(d.spine.head.x - bed.x, d.spine.head.y - bed.y)).toBeLessThan(150);
  });

  it("wakes up with a yawn and goes back to its day", () => {
    const d = new Dragon(640, 500, 16, world, undefined, () => 0.5);
    d.goToBed(bedSpot(1280, 800), world);
    for (let i = 0; i < 60 * 12; i++) d.update(1 / 60, noFinger, world);
    d.wakeUp(world);
    d.update(1 / 60, noFinger, world);
    expect(d.inBed).toBe(false);
    expect(d.asleep).toBe(false);
    expect(d.face.mouthOpen).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    expect(d.face.mouthOpen).toBeGreaterThan(0.5); // mid-yawn
  });

  it("stays in bed when petted while settling in", () => {
    const d = new Dragon(640, 500, 16, world, undefined, () => 0.5);
    d.goToBed(bedSpot(1280, 800), world);
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: true, purr: 0.5, giggle: 0 };
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    d.pet = { active: false, purr: 0.4, giggle: 0 };
    d.update(1 / 60, noFinger, world);
    expect(d.inBed).toBe(true);
  });
});
