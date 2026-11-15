import { describe, expect, it } from "vitest";
import {
  colorFamily,
  DEX,
  dexCount,
  dexIdsOf,
  discover,
  newFinds,
  newPrizes,
  parseDex,
  parsePrizes,
} from "../src/care/dex";
import { CLASSIC_GENES, genesFromSeed, JINX_GENES } from "../src/noodle/genes";
import { applyFinish } from "../src/noodle/look";
import { RARES } from "../src/noodle/rareGenes";
import { makeSave, parseSave } from "../src/save/saveGame";
import { freshNeeds } from "../src/care/needs";

describe("Dragondex", () => {
  it("has 11 colors, 8 patterns, 20 parts, 11 special dragons and 88 combos, each once", () => {
    expect(dexCount([], "colors").total).toBe(11);
    expect(dexCount([], "patterns").total).toBe(8);
    expect(dexCount([], "parts").total).toBe(20);
    expect(dexCount([], "specials").total).toBe(11);
    expect(dexCount([], "combos").total).toBe(88);
    expect(dexCount([]).total).toBe(138);
    expect(new Set(DEX.map((e) => e.id)).size).toBe(DEX.length);
  });

  it("files every wild dragon under a real color and pattern page", () => {
    const ids = new Set(DEX.map((e) => e.id));
    for (let seed = 1; seed < 400; seed++) {
      const found = dexIdsOf(genesFromSeed(seed * 7919));
      expect(found.length).toBeGreaterThan(0);
      for (const id of found) expect(ids.has(id)).toBe(true);
    }
  });

  it("can find every color, pattern, part and everyday combo among wild eggs", () => {
    const found = new Set<string>();
    for (let seed = 1; seed < 3000; seed++)
      for (const id of dexIdsOf(genesFromSeed(seed * 104729))) found.add(id);
    const wild = DEX.filter(
      (d) =>
        (d.page !== "specials" && d.page !== "combos" && d.id !== "part:mouth:extraFang") ||
        (d.page === "combos" && !d.rare),
    );
    expect(wild.length).toBe(78);
    for (const e of wild) expect(found.has(e.id)).toBe(true);
  });

  it("files a dragon under its parts and combo, and Jinx under its parts too", () => {
    const g = {
      ...CLASSIC_GENES,
      mark: "heart" as const,
      frills: true,
      patternKind: "koi" as const,
    };
    const ids = dexIdsOf(g);
    expect(ids).toContain("part:horn:antler");
    expect(ids).toContain("part:mark:heart");
    expect(ids).toContain("part:extra:frills");
    expect(ids).toContain("combo:aqua:koi");
    expect(ids).not.toContain("part:extra:freckles");
    expect(dexIdsOf(JINX_GENES)).toContain("part:mouth:extraFang");
    expect(dexIdsOf(JINX_GENES).some((id) => id.startsWith("color:"))).toBe(false);
  });

  it("wins a sticker (once) for each finished tab", () => {
    const colors = DEX.filter((e) => e.page === "colors").map((e) => ({ id: e.id, by: "", at: 0 }));
    expect(newPrizes(colors, [])).toEqual(["colors"]);
    expect(newPrizes(colors, ["colors"])).toEqual([]);
    expect(newPrizes(colors.slice(1), [])).toEqual([]);
    expect(parsePrizes(["colors", "bogus", "combos"])).toEqual(["colors", "combos"]);
    expect(parsePrizes(undefined)).toEqual([]);
  });

  it("sorts in-between hues to the nearest color", () => {
    expect(colorFamily(187)).toBe("aqua");
    expect(colorFamily(359)).toBe("rose");
    expect(colorFamily(2)).toBe("rose");
    expect(colorFamily(100)).toBe("mint");
  });

  it("gives rare colors, holiday dragons and Jinx their own pages", () => {
    expect(dexIdsOf(applyFinish(CLASSIC_GENES, "pearl"))[0]).toBe("color:pearl");
    expect(dexIdsOf(RARES[0].genes)).toEqual([`special:${RARES[0].id}`]);
    expect(dexIdsOf(JINX_GENES)[0]).toBe("special:jinx");
  });

  it("keeps the first finder and reports only new pages", () => {
    const a = discover([], CLASSIC_GENES, "Mochi", 1);
    expect(a.map((f) => f.id).slice(0, 2)).toEqual(["color:aqua", "pattern:plain"]);
    const b = discover(a, { ...CLASSIC_GENES, patternKind: "koi" }, "Bao", 2);
    expect(newFinds(a, b)).toEqual([
      { id: "pattern:koi", by: "Bao", at: 2 },
      { id: "combo:aqua:koi", by: "Bao", at: 2 },
    ]);
    expect(b.find((f) => f.id === "color:aqua")?.by).toBe("Mochi");
    expect(discover(b, CLASSIC_GENES, "Pip", 3)).toBe(b);
  });

  it("reads saved pages carefully", () => {
    expect(parseDex(null)).toEqual([]);
    expect(
      parseDex([
        { id: "color:mint", by: "Pip", at: 5 },
        { id: "color:mint", by: "Again", at: 6 },
        { id: "color:plaid", by: "Nope", at: 1 },
        "junk",
      ]),
    ).toEqual([{ id: "color:mint", by: "Pip", at: 5 }]);
  });

  it("saves, and fills in from dragons already hatched in an older save", () => {
    const now = 1_700_000_000_000;
    const save = makeSave(42, freshNeeds(now), now);
    const back = parseSave(JSON.parse(JSON.stringify(save)), now)!;
    expect(back.version).toBe(14);
    expect(back.dex.map((f) => f.id)).toEqual(dexIdsOf(genesFromSeed(42)));
    // An older save (no Dragondex) with an egg waiting fills in nothing for the egg.
    const old = { ...JSON.parse(JSON.stringify(save)), version: 13, egg: true, dex: undefined };
    expect(parseSave(old, now)!.dex).toEqual([]);
  });
});
