import { describe, expect, it } from "vitest";
import { RARES, rareBySeed, raresInSeason, rareSurprise } from "../src/noodle/rareGenes";
import { genesFromSeed, parseGenes } from "../src/noodle/genes";
import { newEgg } from "../src/care/family";
import { Dragon } from "../src/noodle/dragon";
import { lookTraits } from "../src/ui/profilePanel";
import { seededRandom } from "../src/noodle/look";

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();
const names = (t: number) => raresInSeason(t).map((r) => r.name);

/** A pretend canvas that fails the test if anything is drawn with a broken number. */
function strictCanvas(): CanvasRenderingContext2D {
  return new Proxy({} as Record<string, unknown>, {
    get: (t, k) =>
      k in t
        ? t[k as string]
        : k === "createLinearGradient" || k === "createRadialGradient"
          ? () => ({ addColorStop: () => {} })
          : (...a: unknown[]) => {
              for (const v of a)
                if (typeof v === "number" && !Number.isFinite(v))
                  throw new Error(`${String(k)} was given ${v}`);
            },
    set: (t, k, v) => ((t[k as string] = v), true),
  }) as unknown as CanvasRenderingContext2D;
}

describe("holiday dragons", () => {
  it("can hatch only in the two weeks around their holiday", () => {
    expect(names(at(2026, 10, 31))).toEqual(["Pumpkin", "Boo"]);
    expect(names(at(2026, 10, 24))).toEqual(["Pumpkin", "Boo"]);
    expect(names(at(2026, 11, 7))).toEqual(["Pumpkin", "Boo"]);
    expect(names(at(2026, 10, 23))).toEqual([]);
    expect(names(at(2026, 11, 8))).toEqual([]);
    // Thanksgiving moves: the fourth Thursday of November (the 26th in 2026, the 25th in 2027).
    expect(names(at(2026, 11, 26))).toEqual(["Gobble"]);
    expect(names(at(2026, 11, 19))).toEqual(["Gobble"]);
    expect(names(at(2026, 11, 18))).toEqual([]);
    expect(names(at(2027, 11, 25))).toEqual(["Gobble"]);
    // Christmas and the first day of winter overlap; the window runs on into the new year.
    expect(names(at(2026, 12, 20))).toEqual(["Tinsel", "Snowflake"]);
    expect(names(at(2027, 1, 1))).toEqual(["Tinsel", "Sparkler"]);
    expect(names(at(2026, 7, 4))).toEqual(["Firecracker"]);
    expect(names(at(2026, 2, 14))).toEqual(["Sweetheart"]);
    expect(names(at(2026, 3, 17))).toEqual(["Clover"]);
    // Easter moves: April 5 in 2026, March 28 in 2027.
    expect(names(at(2026, 4, 5))).toEqual(["Jellybean"]);
    expect(names(at(2027, 3, 28))).toEqual(["Jellybean"]);
    expect(names(at(2026, 5, 20))).toEqual([]);
    expect(RARES).toHaveLength(10);
  });

  it("a surprise egg is sometimes the holiday's dragon, never one you already have", () => {
    const halloween = at(2026, 10, 31);
    let n = 0;
    const random = seededRandom(9);
    for (let k = 0; k < 400; k++) if (rareSurprise(halloween, [], random)) n++;
    expect(n).toBeGreaterThan(90);
    expect(n).toBeLessThan(200);
    const [pumpkin, boo] = RARES;
    expect(rareSurprise(halloween, [pumpkin.seed], () => 0)?.name).toBe("Boo");
    expect(rareSurprise(halloween, [pumpkin.seed, boo.seed], () => 0)).toBeNull();
    expect(rareSurprise(at(2026, 6, 1), [], () => 0)).toBeNull();
  });

  it("each has its own number, name, special parts and badge, and survives saving", () => {
    expect(new Set(RARES.map((r) => r.seed)).size).toBe(RARES.length);
    for (const r of RARES) {
      expect(r.genes.special).toBe(r.id);
      expect(rareBySeed(r.seed)).toBe(r);
      expect(genesFromSeed(r.seed)).toBe(r.genes);
      expect(parseGenes(JSON.parse(JSON.stringify(r.genes)))).toEqual(r.genes);
      const egg = newEgg(r.seed, 1000);
      expect(egg.identity.name).toBe(r.name);
      expect(egg.genes.special).toBe(r.id);
      expect(lookTraits(r.genes)[0]).toContain("rare");
    }
    // Ordinary dragons are never special.
    for (let s = 1; s < 300; s++) expect(genesFromSeed(s * 7919).special).toBeUndefined();
  });

  it("each draws cleanly as a baby and grown up, awake and asleep, facing both ways", () => {
    const world = { width: 1280, height: 800, unit: 14 };
    for (const r of RARES)
      for (const growth of [0, 1]) {
        const d = new Dragon(640, 400, 14, world, r.genes, () => 0.5);
        d.setGrowth(growth);
        const ctx = strictCanvas();
        for (let t = 0; t < 120; t++) {
          const a = t / 18;
          d.update(
            1 / 30,
            { x: 640 + Math.cos(a) * 240, y: 400 + Math.sin(a) * 180, down: true },
            world,
          );
          if (t % 10 === 0) d.draw(ctx);
        }
        d.face.blink = 1;
        d.face.asleep = true;
        d.draw(ctx);
        d.eat("noodles");
        d.update(1 / 30, { x: 0, y: 0, down: false }, world);
        d.draw(ctx);
      }
  });
});
