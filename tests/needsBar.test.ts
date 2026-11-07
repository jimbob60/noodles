import { describe, expect, it } from "vitest";
import { brightness, LOW, NeedsBar, ringFill, wobble } from "../src/ui/needsBar";

const needs = (v: number) => ({ fullness: v, happiness: v, energy: v, cleanliness: v });

describe("needs display", () => {
  it("fills each ring in proportion to the need", () => {
    expect(ringFill(100)).toBe(1);
    expect(ringFill(50)).toBe(0.5);
    expect(ringFill(15)).toBeCloseTo(0.15);
    expect(ringFill(500)).toBe(1);
  });

  it("dims low needs but never makes them invisible", () => {
    expect(brightness(100)).toBe(1);
    expect(brightness(15)).toBeGreaterThan(0.6);
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
