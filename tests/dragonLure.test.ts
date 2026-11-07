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

  it("doesn't chase a hovering mouse after food is dropped", () => {
    const d = new Dragon(640, 400, 16, world, undefined, () => 0.5);
    d.lure = { x: 700, y: 400 };
    for (let i = 0; i < 30; i++) d.update(1 / 60, noFinger, world);
    d.lure = null; // food dropped or eaten
    const hover = { x: 100, y: 700, down: false }; // the mouse wanders off, no button
    const start = Math.hypot(d.spine.head.x - hover.x, d.spine.head.y - hover.y);
    for (let i = 0; i < 60; i++) d.update(1 / 60, hover, world);
    const end = Math.hypot(d.spine.head.x - hover.x, d.spine.head.y - hover.y);
    expect(end).toBeGreaterThan(start * 0.7); // it did not swoop over to the mouse
  });

  it("after a finger drag, settles where the finger was, not where the mouse hovers", () => {
    const d = new Dragon(640, 400, 16, world, undefined, () => 0.5);
    for (let i = 0; i < 60; i++) d.update(1 / 60, { x: 900, y: 300, down: true }, world);
    for (let i = 0; i < 60; i++) d.update(1 / 60, { x: 100, y: 700, down: false }, world);
    expect(Math.hypot(d.spine.head.x - 900, d.spine.head.y - 300)).toBeLessThan(20);
  });
});
