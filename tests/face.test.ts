import { describe, expect, it } from "vitest";
import { BLINK_TIME, blinkAmount, Face, lookOffset, nextFacing } from "../src/noodle/face";

describe("face", () => {
  it("blinks shut halfway through and open at both ends", () => {
    expect(blinkAmount(0)).toBeCloseTo(0);
    expect(blinkAmount(BLINK_TIME / 2)).toBeCloseTo(1);
    expect(blinkAmount(BLINK_TIME)).toBeCloseTo(0);
    expect(blinkAmount(BLINK_TIME * 3)).toBe(0);
  });

  it("only turns around once the head clearly moves the other way", () => {
    expect(nextFacing(1, -0.1)).toBe(1);
    expect(nextFacing(1, -0.5)).toBe(-1);
    expect(nextFacing(-1, 0.1)).toBe(-1);
    expect(nextFacing(-1, 0.9)).toBe(1);
  });

  it("looks toward the target, never further than fully turned", () => {
    const near = lookOffset({ x: 0, y: 0 }, { x: 10, y: 0 }, 100);
    expect(near.x).toBeCloseTo(0.1);
    const far = lookOffset({ x: 0, y: 0 }, { x: 0, y: -900 }, 100);
    expect(far).toEqual({ x: 0, y: -1 });
    expect(lookOffset({ x: 5, y: 5 }, { x: 5, y: 5 }, 100)).toEqual({ x: 0, y: 0 });
  });

  it("blinks every few seconds, not constantly and not never", () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const face = new Face(random);
    let blinks = 0;
    let wasShut = false;
    for (let i = 0; i < 60 * 60; i++) {
      face.update(1 / 60, { x: 10, y: 0 }, { x: 0, y: 0 }, { x: 50, y: 0 }, 100);
      const shut = face.blink > 0.75;
      if (shut && !wasShut) blinks++;
      wasShut = shut;
    }
    // One minute: gaps of 2–5.5 s, with some double blinks.
    expect(blinks).toBeGreaterThanOrEqual(10);
    expect(blinks).toBeLessThanOrEqual(40);
  });

  it("keeps the head upright: tilt stays small while swimming straight down", () => {
    const face = new Face(() => 0.5);
    for (let i = 0; i < 120; i++)
      face.update(1 / 60, { x: 0, y: 10 }, { x: 0, y: 0 }, { x: 0, y: 99 }, 100);
    expect(Math.abs(face.tilt)).toBeLessThanOrEqual(0.35 + 1e-9);
  });
});
