import { describe, expect, it } from "vitest";
import { breedCheck, mixGenes } from "../src/care/breeding";
import { MAX_FAMILY } from "../src/care/family";
import { GROWN_HOURS } from "../src/care/growth";
import { genesFromSeed, JINX_GENES, parseGenes } from "../src/noodle/genes";
import { seededRandom } from "../src/noodle/look";
import { RARES } from "../src/noodle/rareGenes";

const NUMBERS = ["hornLength", "maneLength", "size", "tailSize", "chubby", "glow"] as const;
const STYLES = ["patternKind", "hornStyle", "tailStyle", "ridgeStyle", "mark"] as const;

describe("breeding", () => {
  it("needs two grown-ups and room in the family", () => {
    const grown = { hours: GROWN_HOURS };
    expect(breedCheck(grown, grown, 2)).toBe("ok");
    expect(breedCheck(grown, { hours: GROWN_HOURS - 1 }, 2)).toBe("grow");
    expect(breedCheck({ hours: 0 }, grown, 2)).toBe("grow");
    expect(breedCheck(grown, grown, MAX_FAMILY)).toBe("full");
  });

  it("with no surprises, every gene comes from between or from one of the parents", () => {
    for (let k = 0; k < 40; k++) {
      const a = genesFromSeed(100 + k);
      const b = genesFromSeed(900 + k);
      // A random that never rolls under the mutation chance.
      const r = seededRandom(k);
      const baby = mixGenes(a, b, 5000 + k, () => 0.1 + 0.9 * r());
      for (const key of NUMBERS) {
        expect(baby[key]).toBeGreaterThanOrEqual(Math.min(a[key], b[key]) - 1e-9);
        expect(baby[key]).toBeLessThanOrEqual(Math.max(a[key], b[key]) + 1e-9);
      }
      for (const key of STYLES) expect([a[key], b[key]]).toContain(baby[key]);
      expect([a.favorite, b.favorite]).toContain(baby.favorite);
      expect(baby.seed).toBe(5000 + k);
    }
  });

  it("blends colors the short way round the wheel", () => {
    const a = { ...genesFromSeed(1), body: { h: 350, s: 60, l: 50 } };
    const b = { ...genesFromSeed(2), body: { h: 20, s: 80, l: 60 } };
    const baby = mixGenes(a, b, 3, () => 0.5);
    expect(baby.body.h).toBeCloseTo(5, 5);
    expect(baby.body.s).toBeCloseTo(70, 5);
  });

  it("always makes genes that save and load unchanged, with small surprises now and then", () => {
    const r = seededRandom(7);
    let surprises = 0;
    for (let k = 0; k < 200; k++) {
      const a = genesFromSeed(k);
      const b = genesFromSeed(k + 4000);
      const baby = mixGenes(a, b, k + 9000, r);
      expect(parseGenes(JSON.parse(JSON.stringify(baby)))).toEqual(baby);
      if (STYLES.some((key) => baby[key] !== a[key] && baby[key] !== b[key])) surprises++;
    }
    expect(surprises).toBeGreaterThan(5);
    expect(surprises).toBeLessThan(120);
  });

  it("holiday magic isn't passed on, but Jinx's extra fang can be", () => {
    const r = seededRandom(3);
    let fangs = 0;
    for (let k = 0; k < 60; k++) {
      const baby = mixGenes(RARES[k % RARES.length].genes, JINX_GENES, 700 + k, r);
      expect(baby.special).toBeUndefined();
      if (baby.mouthStyle === "extraFang") fangs++;
    }
    expect(fangs).toBeGreaterThan(0);
  });
});
