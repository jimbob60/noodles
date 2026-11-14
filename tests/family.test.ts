import { describe, expect, it } from "vitest";
import { ADOPT_COST, adopt, catchUp, MAX_FAMILY, newEgg, parseFamily } from "../src/care/family";
import { emptyWallet } from "../src/care/coins";
import { decodeBackup, encodeBackup, makeSave, parseSave } from "../src/save/saveGame";
import { freshNeeds } from "../src/care/needs";
import { genesFromSeed } from "../src/noodle/genes";

const T0 = Date.UTC(2026, 10, 12, 12);
const HOUR = 3_600_000;
const rich = { ...emptyWallet(), coins: 400 };

describe("the family", () => {
  it("adopts an egg for coins while there's room", () => {
    const r = adopt(rich, 1);
    expect(r.ok && r.wallet.coins).toBe(400 - ADOPT_COST);
    expect(adopt(emptyWallet(), 1)).toEqual({ ok: false, why: "coins" });
    expect(adopt(rich, MAX_FAMILY)).toEqual({ ok: false, why: "full" });
  });

  it("a new egg is its own dragon, waiting to hatch", () => {
    const e = newEgg(777, T0);
    expect(e.egg).toBe(true);
    expect(e.genes).toEqual(genesFromSeed(777));
    expect(e.growth.hours).toBe(0);
    // An egg doesn't get hungry while it waits.
    expect(catchUp(e, T0 + 30 * HOUR).needs.values).toEqual(e.needs.values);
  });

  it("a dragon left at home gets gently hungrier and keeps growing, each on its own", () => {
    const happy = { ...newEgg(1, T0), egg: false };
    const sleepy = {
      ...newEgg(2, T0),
      egg: false,
      needs: {
        ...freshNeeds(T0),
        inBed: true,
        values: { fullness: 80, happiness: 80, energy: 30, cleanliness: 80 },
      },
    };
    const a = catchUp(happy, T0 + 3 * HOUR);
    const b = catchUp(sleepy, T0 + 3 * HOUR);
    expect(a.needs.values.fullness).toBeCloseTo(90 - 30, 5);
    expect(a.growth.hours).toBe(3);
    // Tucked in, the other one slept: energy up, hunger slower.
    expect(b.needs.values.energy).toBe(100);
    expect(b.needs.values.fullness).toBeCloseTo(80 - 15, 5);
    // A week away is no worse than a long night, and never below the cozy floor.
    const week = catchUp(happy, T0 + 7 * 24 * HOUR);
    expect(Math.min(...Object.values(week.needs.values))).toBeGreaterThanOrEqual(15);
    expect(week.growth.hours).toBe(12);
    // The first one is untouched by the second one's time.
    expect(happy.needs.values.fullness).toBe(90);
  });

  it("is saved with the game and in backup codes, each member with its own needs and outfit", () => {
    const one = {
      ...newEgg(11, T0),
      egg: false,
      worn: { head: { id: "crown" as const, color: 2 } },
    };
    const two = newEgg(22, T0);
    const wardrobe = { owned: ["crown" as const], worn: {} };
    const save = makeSave(
      5,
      freshNeeds(T0),
      T0,
      [],
      rich,
      undefined,
      undefined,
      undefined,
      undefined,
      wardrobe,
      [one, two],
      false,
    );
    const back = parseSave(JSON.parse(JSON.stringify(save)), T0 + HOUR)!;
    expect(back.version).toBe(14);
    expect(back.family.map((m) => m.seed)).toEqual([11, 22]);
    expect(back.family[0].worn).toEqual({ head: { id: "crown", color: 2 } });
    expect(back.family[1].egg).toBe(true);
    expect(back.family[0].needs.lastSeen).toBe(T0);
    expect(decodeBackup(encodeBackup(save), T0 + HOUR)?.family).toHaveLength(2);
    // Saves from before families have just the one dragon.
    expect(parseSave({ version: 11, savedAt: T0, seed: 5 }, T0 + HOUR)?.family).toEqual([]);
  });

  it("reads a saved family carefully", () => {
    expect(parseFamily("nope", [], T0)).toEqual([]);
    const raw = [
      { seed: 1 },
      { seed: -4 },
      null,
      { seed: 2, worn: { head: { id: "crown", color: 1 } }, egg: true },
      { seed: 3 },
      { seed: 4 },
    ];
    const f = parseFamily(raw, [], T0);
    // Broken ones dropped, at most three others, and nothing worn that isn't owned.
    expect(f.map((m) => m.seed)).toEqual([1, 2, 3]);
    expect(f[1].worn).toEqual({});
    expect(f[1].egg).toBe(true);
    expect(f[0].genes).toEqual(genesFromSeed(1));
  });
});

describe("a friend visiting the den", () => {
  it("is remembered in the save, one at a time, and never an egg", () => {
    const raw = [
      { seed: 1, visiting: true },
      { seed: 2, visiting: true },
      { seed: 3, visiting: true, egg: true },
    ];
    expect(parseFamily(raw, [], T0).map((m) => m.visiting)).toEqual([true, false, false]);
    expect(newEgg(4, T0).visiting).toBe(false);
  });
});
