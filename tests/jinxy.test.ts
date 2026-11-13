import { describe, expect, it } from "vitest";
import { Cat, RUB_AGAIN } from "../src/pets/cat";
import { drawCat } from "../src/pets/drawCat";
import { JINX_GENES, JINX_SEED, parseGenes } from "../src/noodle/genes";
import { newEgg, parseFamily } from "../src/care/family";
import { isDark, rimOf } from "../src/noodle/drawBody";
import { Dragon } from "../src/noodle/dragon";
import { seededRandom } from "../src/noodle/look";
import { lookTraits } from "../src/ui/profilePanel";

const world = { width: 1280, height: 800 };

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

describe("Jinxy the cat", () => {
  it("strolls, sits, grooms and naps on the den floor, between the trays", () => {
    const cat = new Cat(seededRandom(4));
    const seen = new Set<string>();
    let far = 0;
    let startX = NaN;
    const ctx = strictCanvas();
    for (let t = 0; t < 600 * 30; t++) {
      cat.update(1 / 30, world, false, null);
      if (Number.isNaN(startX)) startX = cat.x;
      far = Math.max(far, Math.abs(cat.x - startX));
      seen.add(cat.mood);
      expect(cat.x).toBeGreaterThanOrEqual(world.width * 0.27);
      expect(cat.x).toBeLessThanOrEqual(world.width * 0.73);
      expect(cat.y).toBeCloseTo(world.height * 0.83, 5);
      if (t % 20 === 0) drawCat(ctx, cat, world);
    }
    expect(seen).toEqual(new Set(["sit", "walk", "groom", "nap"]));
    expect(far).toBeGreaterThan(150);
  });

  it("purrs with hearts when you pet her, even out of a nap", () => {
    const cat = new Cat(seededRandom(1));
    cat.update(0.1, world, true, null);
    expect(cat.mood).toBe("nap");
    expect(cat.hit({ x: cat.x, y: cat.y - 20 }, world)).toBe(true);
    expect(cat.hit({ x: cat.x + 300, y: cat.y - 20 }, world)).toBe(false);
    cat.pet(world);
    expect(cat.mood).toBe("purr");
    expect(cat.hearts.length).toBeGreaterThan(0);
  });

  it("naps all through bedtime and gets up in the morning", () => {
    const cat = new Cat(seededRandom(2));
    for (let t = 0; t < 120 * 30; t++) cat.update(1 / 30, world, true, null);
    expect(cat.mood).toBe("nap");
    for (let t = 0; t < 2; t++) cat.update(1 / 30, world, false, null);
    expect(cat.mood).toBe("sit");
  });

  it("rubs up against a dragon that comes close, but not over and over", () => {
    const cat = new Cat(seededRandom(3));
    let rubs = 0;
    let firstAt = -1;
    let secondAt = -1;
    for (let t = 0; t < 70 * 30; t++) {
      // A dragon hovering right by her the whole time.
      const r = cat.update(1 / 30, world, false, { x: cat.x + 30, y: cat.y - 40 });
      if (r.rubbed) {
        rubs++;
        if (firstAt < 0) firstAt = t / 30;
        else if (secondAt < 0) secondAt = t / 30;
      }
    }
    expect(rubs).toBeGreaterThanOrEqual(2);
    expect(secondAt - firstAt).toBeGreaterThanOrEqual(RUB_AGAIN - 0.1);
    // Never at bedtime.
    const sleepy = new Cat(seededRandom(3));
    for (let t = 0; t < 60 * 30; t++)
      expect(sleepy.update(1 / 30, world, true, { x: sleepy.x, y: sleepy.y - 30 }).rubbed).toBe(
        false,
      );
  });
});

describe("Jinx, the matching dragon", () => {
  it("is black with bright green eyes, an extra fang, and loves fish", () => {
    expect(isDark(JINX_GENES.body)).toBe(true);
    expect(JINX_GENES.eyeHue).toBeGreaterThan(100);
    expect(JINX_GENES.eyeHue).toBeLessThan(150);
    expect(JINX_GENES.mouthStyle).toBe("extraFang");
    expect(JINX_GENES.favorite).toBe("fish");
    expect(lookTraits(JINX_GENES)).toContain("An extra fang");
    // A dark dragon's outline goes lighter, so it shows at night.
    expect(rimOf(JINX_GENES.body).l).toBeGreaterThan(JINX_GENES.body.l + 15);
  });

  it("comes from its own special egg, already called Jinx, and survives saving", () => {
    const egg = newEgg(JINX_SEED, 1_000_000);
    expect(egg.genes).toEqual(JINX_GENES);
    expect(egg.identity.name).toBe("Jinx");
    expect(parseGenes(JSON.parse(JSON.stringify(JINX_GENES)))).toEqual(JINX_GENES);
    const back = parseFamily(JSON.parse(JSON.stringify([egg])), [], 2_000_000);
    expect(back[0].genes).toEqual(JINX_GENES);
    // The extra fang never turns up on ordinary dragons.
    expect(newEgg(12345, 1).genes.mouthStyle).not.toBe("extraFang");
  });

  it("draws cleanly at every age", () => {
    const w = { ...world, unit: 14 };
    for (const growth of [0, 0.5, 1]) {
      const d = new Dragon(640, 400, 14, w, JINX_GENES, () => 0.5);
      d.setGrowth(growth);
      for (let t = 0; t < 90; t++) {
        const a = t / 14;
        d.update(1 / 30, { x: 640 + Math.cos(a) * 200, y: 400 + Math.sin(a) * 150, down: true }, w);
      }
      d.draw(strictCanvas());
    }
  });
});
