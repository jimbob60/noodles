import { describe, expect, it } from "vitest";
import { legSizes, makeLegs, restSpot, updateLegs } from "../src/noodle/legs";
import { Spine } from "../src/noodle/spine";

function walk(frames: number, move: (t: number) => [number, number]) {
  const spine = new Spine(0, 0, 26, 12);
  const sizes = legSizes(20);
  for (let i = 0; i < 100; i++) spine.follow(...move(0)); // settle
  const legs = makeLegs(spine.points, sizes);
  const log: { steps: number; pairClash: boolean; maxAway: number } = {
    steps: 0,
    pairClash: false,
    maxAway: 0,
  };
  for (let f = 1; f <= frames; f++) {
    spine.follow(...move(f));
    const before = legs.map((l) => l.step !== null);
    updateLegs(legs, spine.points, sizes, 1 / 60);
    legs.forEach((l, i) => {
      if (l.step && !before[i]) log.steps++;
      const rest = restSpot(spine.points, l, sizes);
      log.maxAway = Math.max(log.maxAway, Math.hypot(l.foot.x - rest.x, l.foot.y - rest.y));
    });
    for (let i = 0; i < legs.length; i += 2)
      if (legs[i].step && legs[i + 1].step) log.pairClash = true;
  }
  return { legs, log, sizes };
}

describe("legs", () => {
  it("keep feet planted while the dragon holds still", () => {
    const { log } = walk(120, () => [0, 0]);
    expect(log.steps).toBe(0);
  });

  it("take steps while the dragon walks", () => {
    const { log } = walk(240, (f) => [f * 4, 0]);
    expect(log.steps).toBeGreaterThan(8);
  });

  it("never lift both feet of a pair together at a walking pace", () => {
    const { log } = walk(240, (f) => [f * 3, Math.sin(f * 0.05) * 40]);
    expect(log.pairClash).toBe(false);
  });

  it("keep every foot close to its hip, even when swimming in circles", () => {
    const { log, sizes } = walk(600, (f) => [Math.cos(f * 0.03) * 200, Math.sin(f * 0.03) * 200]);
    expect(log.maxAway).toBeLessThan(sizes.stride * 3);
  });
});
