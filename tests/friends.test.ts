import { describe, expect, it } from "vitest";
import { Dragon } from "../src/noodle/dragon";
import { Friendship } from "../src/noodle/friends";
import { genesFromSeed } from "../src/noodle/genes";
import { seededRandom } from "../src/noodle/look";

const world = { width: 1280, height: 800, unit: 16 };
const idle = { x: 0, y: 0, down: false };

function pair(seedA = 28, seedB = 31337, grownB = 1) {
  const a = new Dragon(400, 400, 16, world, genesFromSeed(seedA), seededRandom(1));
  const b = new Dragon(900, 450, 16, world, genesFromSeed(seedB), seededRandom(2));
  b.setGrowth(grownB);
  return { a, b, f: new Friendship(seededRandom(3)) };
}

function play(seconds: number, p: ReturnType<typeof pair>, each?: (t: number) => void) {
  const seen = new Set<string>();
  let love = 0;
  let closestNoses = Infinity;
  for (let t = 0; t < seconds * 30; t++) {
    p.a.lure = null;
    p.b.lure = null;
    const e = p.f.update(1 / 30, p.a, p.b, [p.a.canPlay, p.b.canPlay], world);
    if (e) love += e.love;
    seen.add(p.f.mode);
    p.a.update(1 / 30, idle, world);
    p.b.update(1 / 30, idle, world);
    if (p.f.mode === "nuzzle")
      closestNoses = Math.min(
        closestNoses,
        Math.hypot(p.a.mouth.x - p.b.mouth.x, p.a.mouth.y - p.b.mouth.y),
      );
    for (const d of [p.a, p.b]) {
      const h = d.spine.head;
      expect(Number.isFinite(h.x) && Number.isFinite(h.y)).toBe(true);
      // Nobody gets dragged off the screen.
      expect(h.x).toBeGreaterThan(-50);
      expect(h.x).toBeLessThan(world.width + 50);
      expect(h.y).toBeGreaterThan(-50);
      expect(h.y).toBeLessThan(world.height + 50);
    }
    each?.(t / 30);
  }
  return { seen, love, closestNoses };
}

describe("dragon friends", () => {
  it("two dragons left together nuzzle, chase and sometimes get tangled", () => {
    const p = pair();
    const r = play(600, p);
    expect(r.seen).toEqual(new Set(["apart", "meeting", "nuzzle", "chase", "tangle"]));
    expect(p.f.count.nuzzle).toBeGreaterThanOrEqual(3);
    expect(p.f.count.chase).toBeGreaterThanOrEqual(3);
    expect(p.f.count.tangle).toBeGreaterThanOrEqual(1);
    // Tangles are the rare treat.
    expect(p.f.count.tangle).toBeLessThanOrEqual(p.f.count.chase);
    expect(r.love).toBeGreaterThan(20);
    // A nuzzle really is nose to nose.
    expect(r.closestNoses).toBeLessThan(p.a.headRadius + p.b.headRadius);
    // Most of the time they still do their own thing.
    expect(r.seen.has("apart")).toBe(true);
  });

  it("a baby and a grown-up can be friends too", () => {
    const p = pair(5, 9, 0);
    play(400, p);
    expect(p.f.count.nuzzle + p.f.count.chase).toBeGreaterThanOrEqual(3);
  });

  it("they part at once when one of them gets busy, and a napping friend is left to sleep", () => {
    const p = pair();
    let parted = false;
    let busyFrom = -1;
    for (let t = 0; t < 120 * 30 && !parted; t++) {
      p.a.lure = null;
      p.b.lure = null;
      const together = p.f.mode !== "apart";
      if (together && busyFrom < 0) busyFrom = t;
      // Once they're together, the first one is "busy" (as if held by a finger).
      const free: [boolean, boolean] = [busyFrom < 0, p.b.canPlay];
      p.f.update(1 / 30, p.a, p.b, free, world);
      if (busyFrom >= 0 && t > busyFrom) {
        expect(p.f.mode).toBe("apart");
        expect(p.a.lure).toBeNull();
        parted = true;
      }
      p.a.update(1 / 30, idle, world);
      p.b.update(1 / 30, idle, world);
    }
    expect(parted).toBe(true);
    // In bed: never steered.
    const q = pair();
    q.b.goToBed({ x: 300, y: 600 }, world);
    play(120, q, () => expect(q.b.lure).toBeNull());
    expect(q.f.count.nuzzle + q.f.count.chase).toBe(0);
    expect(q.b.inBed).toBe(true);
  });
});
