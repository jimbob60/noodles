import { describe, expect, it } from "vitest";
import { ease, Follower } from "../src/follower";

describe("glowing dot", () => {
  it("feels the same at 30 fps and 120 fps", () => {
    let slow = 0;
    let fast = 0;
    for (let i = 0; i < 30; i++) slow = ease(slow, 100, 14, 1 / 30);
    for (let i = 0; i < 120; i++) fast = ease(fast, 100, 14, 1 / 120);
    expect(slow).toBeCloseTo(fast, 6);
  });
  it("reaches the finger within half a second", () => {
    const dot = new Follower(0, 0);
    for (let i = 0; i < 30; i++) dot.update(1 / 60, 300, 200);
    expect(Math.hypot(dot.x - 300, dot.y - 200)).toBeLessThan(2);
  });
  it("keeps the sparkle trail short", () => {
    const dot = new Follower(0, 0);
    for (let i = 0; i < 600; i++) dot.update(1 / 60, (i % 2) * 500, 0);
    expect(dot.sparkles.length).toBeLessThan(80);
  });
});
