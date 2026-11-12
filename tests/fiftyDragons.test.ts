import { describe, expect, it } from "vitest";
import { Dragon } from "../src/noodle/dragon";
import { maneOf } from "../src/noodle/drawHead";
import { genesFromSeed } from "../src/noodle/genes";
import { colorGap, MIN_CONTRAST, MIN_GAP } from "../src/noodle/look";
import { dressUp, parseFavorites, toggleFavorite } from "../src/gallery";

/** A pretend canvas that fails the test if anything is drawn with a broken number. */
function strictCanvas(): { ctx: CanvasRenderingContext2D; calls: () => number } {
  let n = 0;
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (t, k) =>
      k in t
        ? t[k as string]
        : k === "createLinearGradient" || k === "createRadialGradient"
          ? () => ({ addColorStop: () => {} })
          : k === "measureText"
            ? () => ({ width: 10 })
            : (...a: unknown[]) => {
                for (const v of a)
                  if (typeof v === "number" && !Number.isFinite(v))
                    throw new Error(`${String(k)} was given ${v}`);
                n++;
              },
    set: (t, k, v) => {
      if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`${String(k)} = ${v}`);
      t[k as string] = v;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls: () => n };
}

const seeds = (n: number) => Array.from({ length: n }, (_, i) => (i + 1) * 7919);

describe("the 50-dragon test", () => {
  it("no dragon's mane, ridge, tail, horns or pattern blends into its body (3,000 dragons)", () => {
    for (const seed of seeds(3000)) {
      const g = genesFromSeed(seed);
      expect(colorGap(g.accent, g.body), `accent of #${seed}`).toBeGreaterThanOrEqual(MIN_GAP);
      expect(colorGap(g.horn, g.body), `horns of #${seed}`).toBeGreaterThanOrEqual(MIN_GAP);
      expect(colorGap(maneOf(g), g.body), `mane of #${seed}`).toBeGreaterThanOrEqual(MIN_GAP);
      if (g.patternKind !== "plain")
        expect(Math.abs(g.pattern.l - g.body.l), `pattern of #${seed}`).toBeGreaterThanOrEqual(
          MIN_CONTRAST,
        );
      // Glowy, never muddy or too dark for the night sky.
      expect(g.body.l).toBeGreaterThanOrEqual(70);
      expect(g.body.s).toBeGreaterThanOrEqual(80);
    }
  });

  it("50 dragons draw cleanly as babies, teens and grown-ups, dressed up, in any pose", () => {
    const world = { width: 1280, height: 800, unit: 14 };
    for (const seed of seeds(50)) {
      for (const growth of [0, 0.5, 1]) {
        const d = new Dragon(640, 400, 14, world, genesFromSeed(seed), () => 0.5);
        d.setGrowth(growth);
        d.outfit = dressUp(seed);
        const { ctx, calls } = strictCanvas();
        // Swim a loop (so it faces both ways and turns over), drawing as it goes.
        for (let t = 0; t < 150; t++) {
          const a = t / 24;
          d.update(
            1 / 30,
            { x: 640 + Math.cos(a) * 260, y: 400 + Math.sin(a) * 200, down: true },
            world,
          );
          if (t % 15 === 0) d.draw(ctx);
        }
        expect(calls(), `#${seed} at growth ${growth}`).toBeGreaterThan(500);
        // The body stays one sensible piece: no stretched or collapsed segments.
        const p = d.spine.points;
        for (let i = 1; i < p.length; i++) {
          const gap = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
          expect(gap).toBeGreaterThan(d.spine.segment * 0.5);
          expect(gap).toBeLessThan(d.spine.segment * 1.5);
        }
      }
    }
  });

  it("keeps a list of favorites", () => {
    expect(toggleFavorite([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleFavorite([1, 2, 3], 2)).toEqual([1, 3]);
    expect(parseFavorites(JSON.stringify([5, 5, -1, "x", 7.5, 9]))).toEqual([5, 9]);
    expect(parseFavorites("not json")).toEqual([]);
    expect(parseFavorites(null)).toEqual([]);
  });
});
