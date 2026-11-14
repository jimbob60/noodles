import { describe, expect, it } from "vitest";
import { mixGenes } from "../src/care/breeding";
import { genesFromSeed, parseGenes } from "../src/noodle/genes";
import {
  applyFinish,
  colorGap,
  FINISHES,
  MIN_CONTRAST,
  MIN_GAP,
  RARE_PATTERNS,
  seededRandom,
} from "../src/noodle/look";
import { RARES } from "../src/noodle/rareGenes";
import { hasShimmer, isRarePattern, rarityOf } from "../src/noodle/rarity";

describe("rarity", () => {
  it("about one wild dragon in five is rare, and every rare color and pattern turns up", () => {
    const seen = new Set<string>();
    let rare = 0;
    let superRare = 0;
    const N = 4000;
    for (let s = 1; s <= N; s++) {
      const g = genesFromSeed(s * 7919);
      const r = rarityOf(g);
      if (r === "rare") rare++;
      if (r === "superRare") superRare++;
      if (g.finish) seen.add(g.finish);
      if (isRarePattern(g.patternKind)) seen.add(g.patternKind);
      expect(hasShimmer(g)).toBe(r !== "common");
    }
    expect((rare + superRare) / N).toBeGreaterThan(0.15);
    expect((rare + superRare) / N).toBeLessThan(0.23);
    expect(superRare).toBeGreaterThan(0);
    expect(superRare / N).toBeLessThan(0.03);
    for (const k of [...FINISHES, ...RARE_PATTERNS]) expect(seen).toContain(k);
  });

  it("the same number always gives the same rare dragon, and it survives saving", () => {
    for (let s = 1; s < 300; s++) {
      const g = genesFromSeed(s);
      expect(genesFromSeed(s)).toEqual(g);
      expect(parseGenes(JSON.parse(JSON.stringify(g)))).toEqual(g);
    }
  });

  it("a dragon saved before rarity stays just as it was", () => {
    const seed = Array.from({ length: 500 }, (_, i) => i + 1).find((s) => genesFromSeed(s).finish)!;
    const { finish: _gone, ...old } = genesFromSeed(seed);
    expect(parseGenes(old)?.finish).toBeUndefined();
  });

  it("rare colors keep the pattern, mane and horns easy to see", () => {
    for (let s = 1; s < 200; s++) {
      for (const f of FINISHES) {
        const g = applyFinish(genesFromSeed(s), f);
        expect(Math.abs(g.pattern.l - g.body.l)).toBeGreaterThanOrEqual(MIN_CONTRAST);
        expect(colorGap(g.accent, g.body)).toBeGreaterThanOrEqual(MIN_GAP);
        expect(colorGap(g.horn, g.body)).toBeGreaterThanOrEqual(MIN_GAP);
      }
    }
  });

  it("holiday dragons are their own top tier and don't shimmer", () => {
    for (const r of RARES) {
      expect(rarityOf(r.genes)).toBe("holiday");
      expect(hasShimmer(r.genes)).toBe(false);
    }
  });

  it("rares run in the family: reachable by breeding, never guaranteed from one parent", () => {
    const plain = (from: number) => {
      let s = from;
      while (rarityOf(genesFromSeed(s)) !== "common") s++;
      return genesFromSeed(s);
    };
    const r = seededRandom(39);
    const count = (a = plain(10), b = plain(500)) => {
      let color = 0;
      let pattern = 0;
      for (let k = 0; k < 2000; k++) {
        const baby = mixGenes(a, b, 100000 + k * 13, r);
        if (baby.finish) color++;
        if (isRarePattern(baby.patternKind)) pattern++;
        if (baby.finish === "golden") expect(baby.body.h).toBeCloseTo(44);
      }
      return { color: color / 2000, pattern: pattern / 2000 };
    };
    // Plain parents: a small spark of luck.
    const none = count();
    expect(none.color).toBeGreaterThan(0.02);
    expect(none.color).toBeLessThan(0.09);
    expect(none.pattern).toBeGreaterThan(0.02);
    expect(none.pattern).toBeLessThan(0.1);
    // One rare parent: about half the babies.
    const gold = applyFinish(plain(10), "golden");
    const starry = { ...plain(500), patternKind: "stars" as const };
    const one = count(gold, starry);
    expect(one.color).toBeGreaterThan(0.42);
    expect(one.color).toBeLessThan(0.62);
    expect(one.pattern).toBeGreaterThan(0.38);
    expect(one.pattern).toBeLessThan(0.6);
    // Two parents with the same rare color: every baby has it.
    expect(count(gold, applyFinish(plain(500), "golden")).color).toBe(1);
  });
});
