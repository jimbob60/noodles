import { describe, expect, it } from "vitest";
import { CLASSIC_GENES, genesFromSeed, parseGenes, type Genes } from "../src/noodle/genes";
import { makeLook } from "../src/noodle/look";
import { favoriteFood } from "../src/care/food";
import { tickleSpots } from "../src/care/petting";
import { Dragon } from "../src/noodle/dragon";

/** A pretend canvas that writes down every drawing call, so two drawings can be compared. */
function recorder(): { ctx: CanvasRenderingContext2D; log: string[] } {
  const log: string[] = [];
  const fmt = (v: unknown) => (typeof v === "number" ? v.toFixed(3) : String(v));
  const ctx = new Proxy({} as Record<string | symbol, unknown>, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === "measureText") return () => ({ width: 10 });
      if (key === "createLinearGradient" || key === "createRadialGradient")
        return () => ({ addColorStop: () => {} });
      return (...args: unknown[]) => {
        log.push(`${String(key)}(${args.map(fmt).join(",")})`);
      };
    },
    set(target, key, value) {
      log.push(`${String(key)}=${fmt(value)}`);
      target[key] = value;
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, log };
}

const world = { width: 1280, height: 800, unit: 16 };
const finger = { x: 900, y: 300, down: true, presses: 0, pressX: 0, pressY: 0 };

function drawn(genes: Genes): string[] {
  const d = new Dragon(640, 400, 16, world, genes, () => 0.5);
  d.setGrowth(0.7);
  for (let i = 0; i < 90; i++) d.update(1 / 60, { ...finger }, world);
  const { ctx, log } = recorder();
  d.draw(ctx);
  return log;
}

describe("genes", () => {
  it("come out the same from the same seed, and differ between seeds", () => {
    expect(genesFromSeed(4242)).toEqual(genesFromSeed(4242));
    expect(genesFromSeed(4242)).not.toEqual(genesFromSeed(4243));
  });

  it("keep every older dragon's colors, favorite food and tickle spots", () => {
    for (const seed of [1, 99, 12345, 3_000_000_000]) {
      const g = genesFromSeed(seed);
      const look = makeLook(seed);
      expect([g.body, g.pattern, g.patternKind, g.accent, g.horn]).toEqual([
        look.body,
        look.pattern,
        look.patternKind,
        look.accent,
        look.horn,
      ]);
      expect(g.favorite).toBe(favoriteFood(seed));
      expect(g.tickles).toEqual(tickleSpots(seed));
    }
  });

  it("vary horns, mane, whiskers, size and personality across dragons", () => {
    const many = Array.from({ length: 200 }, (_, i) => genesFromSeed(i + 1));
    expect(new Set(many.map((g) => g.hornBranches))).toEqual(new Set([0, 1, 2]));
    for (const key of ["hornLength", "maneLength", "whiskerLength", "size"] as const) {
      const v = many.map((g) => g[key]);
      expect(Math.max(...v) - Math.min(...v)).toBeGreaterThan(0.15);
    }
    const playful = many.map((g) => g.personality.playful);
    expect(Math.min(...playful)).toBeLessThan(0.1);
    expect(Math.max(...playful)).toBeGreaterThan(0.9);
  });

  it("survive being saved and read back, and broken genes are refused", () => {
    const g = genesFromSeed(777);
    expect(parseGenes(JSON.parse(JSON.stringify(g)))).toEqual(g);
    expect(parseGenes(null)).toBeNull();
    expect(parseGenes({ ...g, body: "blue" })).toBeNull();
    expect(parseGenes({ ...g, favorite: "pizza" })).toBeNull();
    expect(parseGenes({ ...g, patternKind: "plaid" })).toBeNull();
    // Out-of-range numbers are pulled back into range, not refused.
    expect(parseGenes({ ...g, size: 9 })?.size).toBe(1.1);
  });

  it("always make the same dragon: same genes, the very same drawing", () => {
    const g = genesFromSeed(31337);
    const a = drawn(g);
    expect(a.length).toBeGreaterThan(200);
    expect(drawn(JSON.parse(JSON.stringify(g)))).toEqual(a);
    expect(drawn(genesFromSeed(31338))).not.toEqual(a);
    expect(drawn(CLASSIC_GENES)).toEqual(drawn(CLASSIC_GENES));
  });

  it("make a bigger dragon longer when grown up", () => {
    const small = new Dragon(640, 400, 16, world, { ...CLASSIC_GENES, size: 0.9 });
    const big = new Dragon(640, 400, 16, world, { ...CLASSIC_GENES, size: 1.1 });
    expect(big.spine.points.length).toBeGreaterThan(small.spine.points.length);
  });
});

describe("lots more genes", () => {
  const many = Array.from({ length: 300 }, (_, i) => genesFromSeed(i * 7 + 3));

  it("every kind of horn, ridge, tail, mark, mouth, whisker and mane color turns up", () => {
    const kinds = {
      hornStyle: ["antler", "curl", "spike"],
      ridgeStyle: ["spikes", "scallops", "sail"],
      tailStyle: ["flame", "fan", "pompom"],
      mark: ["none", "gem", "star", "moon", "heart"],
      mouthStyle: ["plain", "fangs", "toothy", "snaggle"],
      whiskerColor: ["white", "gold", "accent"],
      maneColor: ["accent", "pattern", "horn"],
    } as const;
    for (const [key, all] of Object.entries(kinds))
      expect(new Set(many.map((g) => g[key as keyof typeof kinds]))).toEqual(new Set(all));
    expect(new Set(many.map((g) => g.freckles))).toEqual(new Set([true, false]));
    expect(new Set(many.map((g) => g.frills))).toEqual(new Set([true, false]));
  });

  it("numbers spread across their ranges", () => {
    for (const key of [
      "eyeHue",
      "eyeSize",
      "snoutLength",
      "ridgeSize",
      "tailSize",
      "chubby",
      "legLength",
      "glow",
      "scaleStrength",
    ] as const) {
      const v = many.map((g) => g[key]);
      expect(Math.max(...v) - Math.min(...v), key).toBeGreaterThan(0.2);
    }
  });

  it("a save from before the extra genes gets the same extras from its seed every time", () => {
    const g = genesFromSeed(2024);
    const old = { ...g } as Record<string, unknown>;
    for (const k of ["eyeHue", "mouthStyle", "tailStyle", "frills", "chubby"]) delete old[k];
    expect(parseGenes(old)).toEqual(g);
    expect(parseGenes({ ...g, tailStyle: "rocket" })?.tailStyle).toBe(g.tailStyle);
  });

  it("toothy, fanged and plain mouths draw differently", () => {
    const base = genesFromSeed(31337);
    const plain = drawn({ ...base, mouthStyle: "plain" });
    expect(drawn({ ...base, mouthStyle: "toothy" })).not.toEqual(plain);
    expect(drawn({ ...base, mouthStyle: "fangs" })).not.toEqual(plain);
  });
});
