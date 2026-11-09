import { describe, expect, it } from "vitest";
import type { DecorItem } from "../src/den/decor";
import { Decorator } from "../src/ui/decorate";

const W = 1280;
const H = 800;
const up = (x = 0, y = 0) => ({ x, y, down: false });

/** Presses at `from`, drags through `path`, and lets go at the end. */
function gesture(
  d: Decorator,
  items: DecorItem[],
  from: { x: number; y: number },
  path: { x: number; y: number }[],
) {
  items = d.update(1 / 60, { ...from, down: true }, from, items, W, H);
  for (const p of path) items = d.update(1 / 60, { ...p, down: true }, null, items, W, H);
  const end = path[path.length - 1] ?? from;
  return d.update(1 / 60, up(end.x, end.y), null, items, W, H);
}

function decorating() {
  const d = new Decorator();
  d.active = true;
  d.storage = Object.fromEntries(d.kinds.map((k) => [k, 5]));
  return d;
}

describe("decorating", () => {
  it("places a decoration dragged out of the drawer", () => {
    const d = decorating();
    const lantern = d.slots(W, H).find((s) => s.kind === "lantern")!;
    const items = gesture(d, [], lantern, [
      { x: 500, y: 400 },
      { x: 640, y: 300 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "lantern", x: 640 / W, y: 300 / H });
  });

  it("doesn't place anything for a tap on the drawer, or a drag straight back into it", () => {
    const d = decorating();
    const plant = d.slots(W, H).find((s) => s.kind === "plant")!;
    expect(gesture(d, [], plant, [])).toHaveLength(0);
    expect(gesture(d, [], plant, [{ x: plant.x + 30, y: plant.y - 5 }])).toHaveLength(0);
  });

  it("moves a placed decoration, recolors it with a tap, and puts it away on the drawer", () => {
    const d = decorating();
    let items: DecorItem[] = [{ kind: "jar", x: 0.5, y: 0.4, color: 0 }];
    const at = { x: 0.5 * W, y: 0.4 * H };
    items = gesture(d, items, at, [{ x: 800, y: 300 }]);
    expect(items[0].x).toBeCloseTo(800 / W);
    items = gesture(d, items, { x: 800, y: 300 }, []);
    expect(items[0].color).toBe(1);
    const drawer = d.slots(W, H)[2];
    items = gesture(d, items, { x: 800, y: 300 }, [{ x: 700, y: 600 }, drawer]);
    expect(items).toHaveLength(0);
  });

  it("does nothing while not in decorating mode", () => {
    const d = new Decorator();
    const lantern = d.slots(W, H)[0];
    expect(gesture(d, [], lantern, [{ x: 640, y: 300 }])).toHaveLength(0);
  });
});

describe("buying from the drawer", () => {
  it("asks first, then buys on a second tap", () => {
    const d = new Decorator();
    d.active = true;
    const bought: string[] = [];
    d.onBuy = (k) => {
      bought.push(k);
      return true;
    };
    const lamp = d.slots(W, H).find((s) => s.kind === "planet")!;
    gesture(d, [], lamp, []);
    expect(bought).toEqual([]); // just asked "Buy?"
    gesture(d, [], lamp, []);
    expect(bought).toEqual(["planet"]);
  });

  it("buys another one by tapping the price tag, even when you already have some", () => {
    const d = decorating();
    const bought: string[] = [];
    d.onBuy = (k) => {
      bought.push(k);
      return true;
    };
    const rug = d.slots(W, H).find((s) => s.kind === "rug")!;
    const tag = { x: rug.x, y: rug.y + rug.r * 0.72 };
    gesture(d, [], tag, []);
    gesture(d, [], tag, []);
    expect(bought).toEqual(["rug"]);
  });

  it("takes a placed decoration out of storage, and puts it back when put away", () => {
    const d = decorating();
    const moves: string[] = [];
    d.onStore = (k, c) => void moves.push(`${k}${c > 0 ? "+" : "-"}`);
    const jar = d.slots(W, H).find((s) => s.kind === "jar")!;
    let items = gesture(d, [], jar, [{ x: 640, y: 400 }]);
    expect(moves).toEqual(["jar-"]);
    items = gesture(d, items, { x: 640, y: 400 }, [{ x: 640, y: 300 }, jar]);
    expect(items).toHaveLength(0);
    expect(moves).toEqual(["jar-", "jar+"]);
  });

  it("won't place a decoration you have none of", () => {
    const d = new Decorator();
    d.active = true;
    const lantern = d.slots(W, H).find((s) => s.kind === "lantern")!;
    expect(gesture(d, [], lantern, [{ x: 640, y: 300 }])).toHaveLength(0);
  });
});

describe("the decoration drawer", () => {
  it("fits on screen, in one row on a tablet and wrapped into rows on a phone", () => {
    const d = new Decorator();
    for (const [w, h] of [
      [1280, 800],
      [800, 1280],
      [400, 860],
    ]) {
      const slots = d.slots(w, h);
      expect(slots).toHaveLength(13);
      for (const s of slots) {
        expect(s.x - s.r).toBeGreaterThanOrEqual(0);
        expect(s.x + s.r).toBeLessThanOrEqual(w);
      }
      const rows = new Set(slots.map((s) => Math.round(s.y))).size;
      if (w === 1280) expect(rows).toBe(1);
      if (w === 400) expect(rows).toBeGreaterThan(1);
    }
  });
});
