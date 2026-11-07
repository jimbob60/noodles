import { describe, expect, it } from "vitest";
import { Dragon, LURE_TOP_SPEED } from "../src/noodle/dragon";

const world = { width: 1280, height: 800, unit: 16 };
const noFinger = { x: 0, y: 0, down: false };

describe("dragon going after food", () => {
  it("swims to food at a watchable speed, not a zoom", () => {
    const d = new Dragon(100, 400, 16, world, undefined, () => 0.5);
    d.lure = { x: 1200, y: 400 };
    let fastest = 0;
    for (let i = 0; i < 60; i++) {
      const before = { ...d.spine.head };
      d.update(1 / 60, noFinger, world);
      fastest = Math.max(
        fastest,
        Math.hypot(d.spine.head.x - before.x, d.spine.head.y - before.y) * 60,
      );
    }
    expect(fastest).toBeLessThanOrEqual(LURE_TOP_SPEED * 16 + 1e-6);
  });

  it("gets its mouth to the food in the end", () => {
    const d = new Dragon(100, 400, 16, world, undefined, () => 0.5);
    d.lure = { x: 900, y: 300 };
    for (let i = 0; i < 60 * 8; i++) d.update(1 / 60, noFinger, world);
    const m = d.mouth;
    expect(Math.hypot(m.x - 900, m.y - 300)).toBeLessThan(d.headRadius * 0.85);
  });
});
