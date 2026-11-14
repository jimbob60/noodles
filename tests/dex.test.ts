import { describe, expect, it } from "vitest";
import {
  colorFamily,
  DEX,
  dexCount,
  dexIdsOf,
  discover,
  newFinds,
  parseDex,
} from "../src/care/dex";
import { CLASSIC_GENES, genesFromSeed, JINX_GENES } from "../src/noodle/genes";
import { applyFinish } from "../src/noodle/look";
import { RARES } from "../src/noodle/rareGenes";
import { makeSave, parseSave } from "../src/save/saveGame";
import { freshNeeds } from "../src/care/needs";

describe("Dragondex", () => {
  it("has 11 colors, 8 patterns and 11 special dragons, each once", () => {
    expect(dexCount([], "colors").total).toBe(11);
    expect(dexCount([], "patterns").total).toBe(8);
    expect(dexCount([], "specials").total).toBe(11);
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

  it("can find every color and pattern among wild eggs", () => {
    const found = new Set<string>();
    for (let seed = 1; seed < 3000; seed++)
      for (const id of dexIdsOf(genesFromSeed(seed * 104729))) found.add(id);
    for (const e of DEX.filter((d) => d.page !== "specials")) expect(found.has(e.id)).toBe(true);
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
    expect(dexIdsOf(JINX_GENES)).toEqual(["special:jinx"]);
  });

  it("keeps the first finder and reports only new pages", () => {
    const a = discover([], CLASSIC_GENES, "Mochi", 1);
    expect(a.map((f) => f.id)).toEqual(["color:aqua", "pattern:plain"]);
    const b = discover(a, { ...CLASSIC_GENES, patternKind: "koi" }, "Bao", 2);
    expect(newFinds(a, b)).toEqual([{ id: "pattern:koi", by: "Bao", at: 2 }]);
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
