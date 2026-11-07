import { describe, expect, it } from "vitest";
import { FLOOR } from "../src/care/needs";
import { brightness, fillLevel, LOW, NeedsBar, surfaceY, wobble } from "../src/ui/needsBar";

const needs = (v: number) => ({ fullness: v, happiness: v, energy: v, cleanliness: v });

describe("needs display", () => {
  it("drains from 100% all the way down to a 1% puddle at the floor", () => {
    expect(fillLevel(100)).toBe(1);
    expect(fillLevel(FLOOR)).toBe(0.01);
    expect(fillLevel(0)).toBe(0.01);
    expect(fillLevel(500)).toBe(1);
  });

  it("moves in whole 1% stages, and every stage from 1% to 100% is reachable", () => {
    const seen = new Set<number>();
    for (let v = FLOOR; v <= 100; v += 0.01) {
      const level = fillLevel(v);
      expect(Math.round(level * 100)).toBeCloseTo(level * 100, 9);
      seen.add(Math.round(level * 100));
    }
    expect(seen.size).toBe(100);
    for (let v = FLOOR; v < 100; v += 0.5)
      expect(fillLevel(v + 0.5)).toBeGreaterThanOrEqual(fillLevel(v));
  });

  it("drains the liquid downward as a need drops", () => {
    expect(surfaceY(1, 20)).toBe(-20); // full: surface at the top
    expect(surfaceY(0.5, 20)).toBe(0); // half: surface in the middle
    expect(surfaceY(0, 20)).toBe(20); // empty: surface at the bottom
    expect(surfaceY(0.3, 20)).toBeGreaterThan(surfaceY(0.7, 20));
  });

  it("dims low needs but never makes them invisible", () => {
    expect(brightness(100)).toBe(1);
    expect(brightness(15)).toBeGreaterThan(0.55);
    expect(brightness(15)).toBeLessThan(brightness(80));
  });

  it("keeps happy needs still, and nudges low ones only now and then", () => {
    for (let t = 0; t < 8; t += 0.05) expect(wobble(LOW + 1, t, 0)).toBe(0);
    let moving = 0;
    for (let t = 0; t < 8; t += 0.05) if (wobble(20, t, 0) !== 0) moving++;
    expect(moving).toBeGreaterThan(0);
    expect(moving / 160).toBeLessThan(0.2); // still more than 80% of the time
  });

  it("glides to new values instead of jumping", () => {
    const bar = new NeedsBar();
    bar.update(1 / 60, needs(40));
    bar.update(1 / 60, needs(90)); // a big snack
    expect(bar.shownValue("fullness")).toBeGreaterThan(40);
    expect(bar.shownValue("fullness")).toBeLessThan(45);
    for (let i = 0; i < 120; i++) bar.update(1 / 60, needs(90));
    expect(bar.shownValue("fullness")).toBeCloseTo(90, 0);
  });
});
