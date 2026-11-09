import { describe, expect, it } from "vitest";
import { emptyWallet } from "../src/care/coins";
import { feedEffect } from "../src/care/food";
import { freshNeeds } from "../src/care/needs";
import {
  buy,
  CATALOG,
  emptyStash,
  inStorage,
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

  it("sells decorations one at a time, into storage", () => {
    let st = emptyStash();
    let w = rich();
    for (let i = 0; i < 2; i++) {
      const r = buy(item("lantern"), w, st);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      w = r.wallet;
      st = r.stash;
    }
    expect(inStorage(st, "lantern")).toBe(2);
    expect(w.coins).toBe(200 - 2 * item("lantern").cost);
  });

  it("sells balls once, to keep for good, as a big goal (1,000–1,500 coins, all different)", () => {
    const balls = CATALOG.filter((i) => i.type === "ball");
    for (const b of balls) expect(b.cost >= 1000 && b.cost <= 1500).toBe(true);
    expect(new Set(balls.map((b) => b.cost)).size).toBe(balls.length);
    const r = buy(item("jelly"), { ...emptyWallet(), coins: 2000 }, emptyStash());
    expect(r.ok && r.stash.balls).toEqual(["jelly"]);
    if (!r.ok) return;
    expect(buy(item("jelly"), r.wallet, r.stash)).toEqual({ ok: false, why: "owned" });
  });

  it("sells every decoration, each with a price", () => {
    const decor = CATALOG.filter((i) => i.type === "decor");
    expect(decor).toHaveLength(13);
    for (const d of decor) expect(d.cost).toBeGreaterThan(0);
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
    const stash = {
      pantry: { berries: 4 },
      storage: { planet: 2 },
      balls: ["jelly" as const],
      bestCatch: 12,
    };
    const save = makeSave(3, freshNeeds(0), 0, [], rich(), stash);
    expect(parseSave(JSON.parse(JSON.stringify(save)), 0)?.stash).toEqual(stash);
    expect(decodeBackup(encodeBackup(save), 0)?.stash).toEqual(stash);
    expect(
      parseStash({ pantry: { berries: -2, cake: 5 }, storage: { rug: 99, robot: 3 } }),
    ).toEqual({ pantry: {}, storage: { rug: 9 }, balls: [], bestCatch: 0 });
  });

  it("turns decorations 'unlocked' by the earlier shop into one each in storage, unless placed", () => {
    expect(
      parseStash({ pantry: {}, unlocked: ["lantern", "bonsai", "spaceship"] }, ["lantern"]),
    ).toEqual({
      pantry: {},
      storage: { bonsai: 1 },
      balls: [],
      bestCatch: 0,
    });
  });
});
