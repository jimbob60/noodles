import { describe, expect, it } from "vitest";
import {
  ageText,
  cleanName,
  daysOld,
  NAME_MAX,
  parseIdentity,
  suggestName,
} from "../src/care/identity";
import { seededRandom } from "../src/noodle/look";
import { lookTraits } from "../src/ui/profilePanel";
import { CLASSIC_GENES, genesFromSeed } from "../src/noodle/genes";

describe("names", () => {
  it("suggests cute names that fit, the same from the same random numbers", () => {
    for (let i = 0; i < 200; i++) {
      const n = suggestName(seededRandom(i));
      expect(n.length).toBeGreaterThan(1);
      expect(n.length).toBeLessThanOrEqual(NAME_MAX);
      expect(suggestName(seededRandom(i))).toBe(n);
    }
    const many = new Set(Array.from({ length: 200 }, (_, i) => suggestName(seededRandom(i))));
    expect(many.size).toBeGreaterThan(60);
  });

  it("tidies typed names", () => {
    expect(cleanName("  Sir   Noodle  ")).toBe("Sir Noodle");
    expect(cleanName("   ")).toBeNull();
    expect(cleanName("a\u0000b\nc")).toBe("abc");
    expect(cleanName("Supercalifragilisticexpialidocious")).toHaveLength(NAME_MAX);
    expect(cleanName("🐉🐉🐉")).toBe("🐉🐉🐉");
  });

  it("reads saved identities carefully", () => {
    const fallback = Date.UTC(2026, 10, 1);
    expect(parseIdentity({ name: "Mochi", birthday: fallback - 5 }, 1, fallback)).toEqual({
      name: "Mochi",
      birthday: fallback - 5,
    });
    const broken = parseIdentity({ name: 42, birthday: "yesterday" }, 1, fallback);
    expect(broken.birthday).toBe(fallback);
    expect(broken.name).toBe(parseIdentity(null, 1, fallback).name);
  });
});

describe("birthdays", () => {
  it("counts whole days by the calendar", () => {
    const hatched = new Date(2026, 10, 9, 22, 0).getTime();
    expect(ageText(hatched, new Date(2026, 10, 9, 23, 0).getTime())).toBe("Hatched today");
    expect(ageText(hatched, new Date(2026, 10, 10, 1, 0).getTime())).toBe("1 day old");
    expect(daysOld(hatched, new Date(2026, 10, 21, 8, 0).getTime())).toBe(12);
  });
});

describe("the profile's look list", () => {
  it("names the special things about a dragon's looks", () => {
    expect(lookTraits(CLASSIC_GENES)).toEqual([
      "Antler horns",
      "Spiky back",
      "Flame tail",
      "Sweet smile",
    ]);
    const toothy = lookTraits({ ...genesFromSeed(9), mouthStyle: "toothy", mark: "star" });
    expect(toothy).toContain("Toothy grin");
    expect(toothy).toContain("⭐ Star mark");
  });
});
