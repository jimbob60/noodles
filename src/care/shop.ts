import { DECOR_KINDS, type DecorKind } from "../den/decor";
import { spend, type Wallet } from "./coins";
import { TREAT_IDS, type FoodId } from "./food";

/** Things bought in the shop: treats in the pantry, and decorations unlocked for good. */
export interface Stash {
  pantry: Partial<Record<FoodId, number>>;
  unlocked: DecorKind[];
}

export const emptyStash = (): Stash => ({ pantry: {}, unlocked: [] });

export type ShopItem =
  | { id: string; type: "treat"; food: FoodId; pack: number; cost: number; name: string }
  | { id: string; type: "decor"; kind: DecorKind; cost: number; name: string };

/** What each decoration costs (Jacob asked for every decoration to be bought). */
export const DECOR_PRICE: Record<DecorKind, number> = {
  lantern: 10,
  cushion: 12,
  jar: 15,
  plant: 15,
  rug: 18,
  stool: 20,
  tea: 25,
  lights: 25,
  beanbag: 30,
  mobile: 30,
  crystal: 35,
  bonsai: 40,
  planet: 50,
};

export const DECOR_NAME: Record<DecorKind, string> = {
  lantern: "Paper lantern",
  cushion: "Cushion",
  jar: "Firefly jar",
  plant: "Potted plant",
  rug: "Round rug",
  stool: "Mushroom stool",
  tea: "Tea set",
  lights: "Fairy lights",
  beanbag: "Star beanbag",
  mobile: "Moon mobile",
  crystal: "Crystal lamp",
  bonsai: "Blossom bonsai",
  planet: "Planet lamp",
};

/** Everything in the shop: treats first, then every decoration from cheapest to dearest. */
export const CATALOG: ShopItem[] = [
  { id: "berries", type: "treat", food: "berries", pack: 3, cost: 6, name: "Berry bowls" },
  { id: "mooncake", type: "treat", food: "mooncake", pack: 3, cost: 15, name: "Moon cakes" },
  ...[...DECOR_KINDS]
    .sort((a, b) => DECOR_PRICE[a] - DECOR_PRICE[b])
    .map((kind) => ({
      id: kind,
      type: "decor" as const,
      kind,
      cost: DECOR_PRICE[kind],
      name: DECOR_NAME[kind],
    })),
];

/** How many treats the pantry can hold of each kind. */
export const PANTRY_MAX = 30;

/** The decorations that have been bought. */
export function ownedDecor(stash: Stash): DecorKind[] {
  return DECOR_KINDS.filter((k) => stash.unlocked.includes(k));
}

/** Decorations already placed in the den stay yours: unlock them for free (an upgrade step). */
export function keepPlaced(stash: Stash, placed: DecorKind[]): Stash {
  const unlocked = DECOR_KINDS.filter((k) => stash.unlocked.includes(k) || placed.includes(k));
  return { ...stash, unlocked };
}

export type BuyResult =
  { ok: true; wallet: Wallet; stash: Stash } | { ok: false; why: "coins" | "owned" | "full" };

export function buy(item: ShopItem, wallet: Wallet, stash: Stash): BuyResult {
  if (item.type === "decor" && ownedDecor(stash).includes(item.kind))
    return { ok: false, why: "owned" };
  if (item.type === "treat" && (stash.pantry[item.food] ?? 0) + item.pack > PANTRY_MAX) {
    return { ok: false, why: "full" };
  }
  const paid = spend(wallet, item.cost);
  if (!paid) return { ok: false, why: "coins" };
  if (item.type === "decor") {
    return {
      ok: true,
      wallet: paid,
      stash: { ...stash, unlocked: [...stash.unlocked, item.kind] },
    };
  }
  const pantry = { ...stash.pantry, [item.food]: (stash.pantry[item.food] ?? 0) + item.pack };
  return { ok: true, wallet: paid, stash: { ...stash, pantry } };
}

/** Uses one treat from the pantry (when eaten). */
export function useTreat(stash: Stash, food: FoodId): Stash {
  const n = stash.pantry[food] ?? 0;
  if (n <= 0) return stash;
  return { ...stash, pantry: { ...stash.pantry, [food]: n - 1 } };
}

/** Reads a saved stash, keeping only sensible entries. */
export function parseStash(raw: unknown): Stash {
  if (!raw || typeof raw !== "object") return emptyStash();
  const r = raw as { pantry?: Record<string, unknown>; unlocked?: unknown };
  const pantry: Stash["pantry"] = {};
  for (const id of TREAT_IDS) {
    const v = r.pantry?.[id];
    if (typeof v === "number" && Number.isInteger(v) && v > 0) pantry[id] = Math.min(v, PANTRY_MAX);
  }
  const unlocked = Array.isArray(r.unlocked)
    ? DECOR_KINDS.filter((k) => (r.unlocked as unknown[]).includes(k))
    : [];
  return { pantry, unlocked };
}
