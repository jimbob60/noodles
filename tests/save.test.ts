import { describe, expect, it } from "vitest";
import { genesFromSeed } from "../src/noodle/genes";
import { advance, freshNeeds } from "../src/care/needs";
import { decodeBackup, encodeBackup, makeSave, newSave, parseSave } from "../src/save/saveGame";
import {
  BACKUP_KEY,
  loadGame,
  OLD_NEEDS_KEY,
  SAVE_KEY,
  storeGame,
  type KeyValueStore,
} from "../src/save/storage";

const T0 = Date.UTC(2026, 10, 7, 12);
const HOUR = 3_600_000;

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const sample = () => {
  const needs = { ...advance(freshNeeds(T0), T0 + 2 * HOUR), inBed: true };
  return makeSave(123456789, needs, T0 + 2 * HOUR);
};

describe("saving", () => {
  it("keeps everything when closing and reopening", () => {
    const store = memoryStore();
    const save = sample();
    expect(storeGame(store, save)).toBe(true);
    const back = loadGame(store, T0 + 3 * HOUR, () => 1);
    expect(back.from).toBe("save");
    expect(back.save).toEqual(save);
  });

  it("keeps the previous save as a spare, and uses it if the latest is damaged", () => {
    const store = memoryStore();
    const first = sample();
    storeGame(store, first);
    storeGame(store, { ...first, seed: 42 });
    expect(JSON.parse(store.data.get(BACKUP_KEY)!).seed).toBe(123456789);
    store.data.set(SAVE_KEY, '{"version":1,"seed":42,"nee'); // cut off mid-write
    const back = loadGame(store, T0 + 3 * HOUR, () => 1);
    expect(back.from).toBe("previous");
    expect(back.save!.seed).toBe(123456789);
  });

  it("carries over the needs kept by earlier builds, giving the dragon a seed to keep", () => {
    const store = memoryStore();
    store.setItem(
      OLD_NEEDS_KEY,
      JSON.stringify({
        values: { fullness: 33, happiness: 44, energy: 55, cleanliness: 66 },
        lastSeen: T0,
      }),
    );
    const back = loadGame(store, T0 + HOUR, () => 777);
    expect(back.from).toBe("old-needs");
    expect(back.save!.seed).toBe(777);
    expect(back.save!.needs.values.fullness).toBe(33);
  });

  it("starts a new dragon when there's nothing saved, or no storage at all", () => {
    expect(loadGame(memoryStore(), T0, () => 1)).toEqual({ save: null, from: "new" });
    expect(loadGame(null, T0, () => 1)).toEqual({ save: null, from: "new" });
    expect(storeGame(null, sample())).toBe(false);
  });

  it("rejects things that aren't saves, and reads a newer version as far as it can", () => {
    expect(parseSave(null, T0)).toBeNull();
    expect(parseSave({ version: 1, seed: -5 }, T0)).toBeNull();
    expect(parseSave({ version: 0, seed: 5 }, T0)).toBeNull();
    const future = parseSave(
      { version: 9, seed: 5, needs: sample().needs, savedAt: T0, pets: ["a"] },
      T0 + HOUR,
    );
    expect(future?.seed).toBe(5);
  });

  it("starts new dragons with comfortable needs", () => {
    const s = newSave(9, T0);
    expect(s.version).toBe(10);
    expect(s.decor).toEqual([]);
    expect(s.needs.values.fullness).toBeGreaterThan(50);
  });
});

describe("save versions", () => {
  it("upgrade a version 1 save (phase 21) with an empty den", () => {
    const v1 = { version: 1, savedAt: T0, seed: 55, needs: sample().needs };
    const up = parseSave(JSON.parse(JSON.stringify(v1)), T0 + HOUR)!;
    expect(up.version).toBe(10);
    expect(up.seed).toBe(55);
    expect(up.decor).toEqual([]);
  });

  it("keep the den's decorations through a save and a backup code", () => {
    const decor = [
      { kind: "lantern" as const, x: 0.3, y: 0.4, color: 2 },
      { kind: "rug" as const, x: 0.5, y: 0.9, color: 1 },
    ];
    const save = makeSave(7, sample().needs, T0 + 2 * HOUR, decor);
    expect(parseSave(JSON.parse(JSON.stringify(save)), T0 + 3 * HOUR)?.decor).toEqual(decor);
    expect(decodeBackup(encodeBackup(save), T0 + 3 * HOUR)?.decor).toEqual(decor);
  });
});

describe("backup codes", () => {
  it("turn a save into a code and back again", () => {
    const save = sample();
    const code = encodeBackup(save);
    expect(code.startsWith("ND1-")).toBe(true);
    expect(decodeBackup(code, T0 + 3 * HOUR)).toEqual(save);
  });

  it("still work with spaces or line breaks pasted in", () => {
    const code = encodeBackup(sample());
    const messy = ` ${code.slice(0, 20)}\n${code.slice(20, 50)}  ${code.slice(50)} `;
    expect(decodeBackup(messy, T0 + 3 * HOUR)?.seed).toBe(123456789);
  });

  it("refuse codes that are cut off, mistyped or tampered with", () => {
    const code = encodeBackup(sample());
    expect(decodeBackup(code.slice(0, -10), T0)).toBeNull();
    const i = Math.floor(code.length / 2);
    const typo = code.slice(0, i) + (code[i] === "A" ? "B" : "A") + code.slice(i + 1);
    expect(decodeBackup(typo, T0)).toBeNull();
    expect(decodeBackup("hello", T0)).toBeNull();
    expect(decodeBackup("", T0)).toBeNull();
  });
});

describe("growing up in the save", () => {
  it("keeps how grown up a dragon is, and starts older dragons again as babies", () => {
    const save = makeSave(7, sample().needs, T0, [], undefined, undefined, { hours: 30.5 });
    expect(parseSave(JSON.parse(JSON.stringify(save)), T0 + HOUR)?.growth).toEqual({ hours: 30.5 });
    expect(decodeBackup(encodeBackup(save), T0 + HOUR)?.growth).toEqual({ hours: 30.5 });
    const v7 = { version: 7, savedAt: T0, seed: 55, needs: sample().needs };
    expect(parseSave(v7, T0 + HOUR)?.growth).toEqual({ hours: 0 });
    const odd = { ...save, growth: { hours: "lots" } };
    expect(parseSave(odd, T0 + HOUR)?.growth).toEqual({ hours: 0 });
  });
});

describe("genes in the save", () => {
  it("keeps a dragon's genes, and gives older saves the genes their seed always made", () => {
    const genes = { ...genesFromSeed(5), size: 1.08, hornBranches: 2 };
    const save = makeSave(5, sample().needs, T0, [], undefined, undefined, undefined, genes);
    expect(parseSave(JSON.parse(JSON.stringify(save)), T0 + HOUR)?.genes).toEqual(genes);
    expect(decodeBackup(encodeBackup(save), T0 + HOUR)?.genes).toEqual(genes);
    const v8 = { version: 8, savedAt: T0, seed: 55, needs: sample().needs };
    expect(parseSave(v8, T0 + HOUR)?.genes).toEqual(genesFromSeed(55));
    const broken = { ...save, genes: { nope: true } };
    expect(parseSave(broken, T0 + HOUR)?.genes).toEqual(genesFromSeed(5));
  });
});

describe("names and birthdays in the save", () => {
  it("keeps the name and birthday, and names older dragons from their seed", () => {
    const identity = { name: "Biscuit", birthday: T0 - 3 * 24 * HOUR };
    const save = makeSave(
      5,
      sample().needs,
      T0,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      identity,
    );
    expect(parseSave(JSON.parse(JSON.stringify(save)), T0 + HOUR)?.identity).toEqual(identity);
    expect(decodeBackup(encodeBackup(save), T0 + HOUR)?.identity).toEqual(identity);
    const v9 = { version: 9, savedAt: T0, seed: 55, needs: sample().needs, growth: { hours: 30 } };
    const a = parseSave(v9, T0 + HOUR)!.identity;
    expect(a.name.length).toBeGreaterThan(1);
    expect(parseSave(v9, T0 + 5 * HOUR)!.identity.name).toBe(a.name);
    expect(a.birthday).toBe(T0 - 30 * HOUR);
  });
});
