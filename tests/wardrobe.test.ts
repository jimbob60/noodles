import { describe, expect, it } from "vitest";
import {
  ACCESSORIES,
  buyAccessory,
  emptyWardrobe,
  parseWardrobe,
  recolor,
  toggleWear,
  type Wardrobe,
} from "../src/care/wardrobe";
import { emptyWallet } from "../src/care/coins";
import { Dragon } from "../src/noodle/dragon";
import { CLASSIC_GENES, genesFromSeed } from "../src/noodle/genes";

const rich = { ...emptyWallet(), coins: 500 };

describe("the closet", () => {
  it("buys an accessory once, for its price", () => {
    const r = buyAccessory(emptyWardrobe(), rich, "topHat");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.wallet.coins).toBe(500 - 70);
    expect(r.wardrobe.owned).toEqual(["topHat"]);
    expect(buyAccessory(r.wardrobe, r.wallet, "topHat")).toEqual({ ok: false, why: "owned" });
    expect(buyAccessory(emptyWardrobe(), emptyWallet(), "crown")).toEqual({
      ok: false,
      why: "coins",
    });
  });

  it("wears one thing per slot, swaps, takes off, and keeps colors", () => {
    let ward: Wardrobe = toggleWear({ owned: ["topHat", "crown", "scarf"], worn: {} }, "topHat");
    expect(ward.worn.head?.id).toBe("topHat");
    ward = recolor(ward, "head", 3);
    ward = toggleWear(ward, "crown", ward.worn.head?.color);
    expect(ward.worn.head).toEqual({ id: "crown", color: 3 });
    ward = toggleWear(ward, "scarf");
    expect(ward.worn.neck?.id).toBe("scarf");
    ward = toggleWear(ward, "crown");
    expect(ward.worn.head).toBeUndefined();
    // Not owned: nothing happens.
    expect(toggleWear(ward, "tailBow")).toBe(ward);
    const bare = emptyWardrobe();
    expect(recolor(bare, "head", 2)).toBe(bare);
  });

  it("reads a saved closet carefully", () => {
    expect(parseWardrobe(null)).toEqual(emptyWardrobe());
    const saved = {
      owned: ["crown", "crown", "jetpack", "tailBow"],
      worn: {
        head: { id: "crown", color: 2 },
        neck: { id: "tailBow", color: 1 }, // wrong slot
        tail: { id: "tailRings", color: 0 }, // not owned
      },
    };
    expect(parseWardrobe(saved)).toEqual({
      owned: ["crown", "tailBow"],
      worn: { head: { id: "crown", color: 2 } },
    });
  });

  it("every accessory draws on every kind of dragon, baby or grown", () => {
    const calls: string[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (t, k) =>
        k in t
          ? t[k as string]
          : k === "createLinearGradient" || k === "createRadialGradient"
            ? () => ({ addColorStop: () => {} })
            : k === "measureText"
              ? () => ({ width: 10 })
              : (...a: unknown[]) => {
                  for (const v of a)
                    if (typeof v === "number" && !Number.isFinite(v))
                      throw new Error(`${String(k)} got ${v}`);
                  calls.push(String(k));
                },
      set: (t, k, v) => ((t[k as string] = v), true),
    }) as unknown as CanvasRenderingContext2D;
    const world = { width: 800, height: 600, unit: 12 };
    for (const genes of [CLASSIC_GENES, genesFromSeed(5), genesFromSeed(77)]) {
      for (const growth of [0, 1]) {
        for (const a of ACCESSORIES) {
          const d = new Dragon(400, 300, 12, world, genes, () => 0.5);
          d.setGrowth(growth);
          d.outfit = { [a.slot]: { id: a.id, color: 1 } };
          d.update(1 / 60, { x: 500, y: 300, down: true }, world);
          const before = calls.length;
          d.draw(ctx);
          expect(calls.length).toBeGreaterThan(before);
        }
      }
    }
  });
});
