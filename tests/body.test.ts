import { describe, expect, it } from "vitest";
import { bodyOutline, bodyProfile, shineLine } from "../src/noodle/body";
import { Spine } from "../src/noodle/spine";

describe("noodle body", () => {
  it("is chubbiest just behind the head", () => {
    let best = 0;
    let bestT = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      if (bodyProfile(t) > best) {
        best = bodyProfile(t);
        bestT = t;
      }
    }
    expect(best).toBeCloseTo(1, 2);
    expect(bestT).toBeGreaterThan(0.1);
    expect(bestT).toBeLessThan(0.25);
  });

  it("tapers all the way from there to a thin but visible tail", () => {
    for (let t = 0.17; t < 1; t += 0.01) expect(bodyProfile(t + 0.01)).toBeLessThan(bodyProfile(t));
    expect(bodyProfile(1)).toBeGreaterThan(0.05);
    expect(bodyProfile(1)).toBeLessThan(0.25);
  });

  it("builds a closed outline with both sides, the tail tip and a round nose", () => {
    const spine = new Spine(0, 0, 26, 12);
    for (let t = 0; t < 200; t++) spine.follow(Math.cos(t * 0.05) * 200, Math.sin(t * 0.08) * 120);
    const outline = bodyOutline(spine.points, 17);
    expect(outline).toHaveLength(26 * 2 + 3);
    for (const p of outline) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });

  it("puts the shine on the side that faces up", () => {
    const spine = new Spine(0, 0, 10, 10);
    for (let x = 0; x <= 300; x += 5) spine.follow(x, 0); // lying flat, head to the right
    for (const p of shineLine(spine.points, 15)) expect(p.y).toBeLessThan(0);
  });
});
