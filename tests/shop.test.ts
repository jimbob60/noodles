import { describe, expect, it } from "vitest";
import { emptyWallet } from "../src/care/coins";
import { feedEffect } from "../src/care/food";
import { freshNeeds } from "../src/care/needs";
import {
  buy,
  CATALOG,
  emptyStash,
  ownedDecor,
  PANTRY_MAX,
  parseStash,
  useTreat,
} from "../src/care/shop";
import { decodeBackup, encodeBackup, makeSave, parseSave } from "../src/save/saveGame";

const rich = () => ({ ...emptyWallet(), coins: 200 });
const item = (id: string) => CATALOG.find((i) => i.id === id)!;

describe("the shop", () => {
  it("sells treats in packs, into the pantry", () => {
    const r = buy(item("berries"), rich(), emptyStash());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.wallet.coins).toBe(200 - item("berries").cost);
    expect(r.stash.pantry.berries).toBe(3);
    expect(useTreat(r.stash, "berries").pantry.berries).toBe(2);
  });

  it("unlocks a decoration once, adding it to the drawer", () => {
    const r = buy(item("bonsai"), rich(), emptyStash());
    expect(r.ok && ownedDecor(r.stash)).toContain("bonsai");
    if (!r.ok) return;
    expect(buy(item("bonsai"), r.wallet, r.stash)).toEqual({ ok: false, why: "owned" });
  });

  it("starts with the 10 starter decorations, not the shop ones", () => {
    const owned = ownedDecor(emptyStash());
    expect(owned).toHaveLength(10);
    expect(owned).not.toContain("planet");
  });

  it("won't sell what you can't afford, or overfill the pantry", () => {
    expect(buy(item("planet"), { ...emptyWallet(), coins: 10 }, emptyStash())).toEqual({
      ok: false,
      why: "coins",
    });
    const full = { ...emptyStash(), pantry: { mooncake: PANTRY_MAX - 1 } };
    expect(buy(item("mooncake"), rich(), full)).toEqual({ ok: false, why: "full" });
  });

  it("has treats that are better than everyday food", () => {
    expect(feedEffect("mooncake", false).happiness!).toBeGreaterThan(
      feedEffect("noodles", false).happiness!,
    );
    expect(feedEffect("mooncake", false).energy).toBeGreaterThan(0);
  });

  it("is saved, survives backup codes, and ignores junk", () => {
    const stash = { pantry: { berries: 4 }, unlocked: ["planet" as const] };
    const save = makeSave(3, freshNeeds(0), 0, [], rich(), stash);
    expect(parseSave(JSON.parse(JSON.stringify(save)), 0)?.stash).toEqual(stash);
    expect(decodeBackup(encodeBackup(save), 0)?.stash).toEqual(stash);
    expect(
      parseStash({
        pantry: { berries: -2, cake: 5 },
        unlocked: ["lantern", "spaceship", "bonsai"],
      }),
    ).toEqual({
      pantry: {},
      unlocked: ["bonsai"],
    });
  });
});
