import { DECOR_KINDS, type DecorKind } from "../den/decor";
import { spend, type Wallet } from "./coins";
import { TREAT_IDS, type FoodId } from "./food";
import { BALL_KINDS, BALLS, type BallKind } from "../ui/balls";
import { parseBest } from "../game/noodleCatch";

/**
 * Things bought in the shop: treats in the pantry, and decorations in storage. Each decoration
 * is bought one at a time; placing one takes it out of storage, putting it away puts it back.
 */
export interface Stash {
  pantry: Partial<Record<FoodId, number>>;
  /** Decorations bought but not placed in the den, by kind. */
  storage: Partial<Record<DecorKind, number>>;
  /** Toys are bought once and kept for good: the balls bought so far. */
  balls: BallKind[];
  /** Best Noodle Catch score. */
  bestCatch: number;
}

export const emptyStash = (): Stash => ({ pantry: {}, storage: {}, balls: [], bestCatch: 0 });

export type ShopItem =
  | { id: string; type: "treat"; food: FoodId; pack: number; cost: number; name: string }
  | { id: string; type: "decor"; kind: DecorKind; cost: number; name: string }
  | { id: string; type: "ball"; ball: BallKind; cost: number; name: string };

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
  ...BALL_KINDS.filter((b) => BALLS[b].cost > 0).map((ball) => ({
    id: ball,
    type: "ball" as const,
    ball,
    cost: BALLS[ball].cost,
    name: BALLS[ball].name,
  })),
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

/** How many of one decoration storage can hold. */
export const STORAGE_MAX = 9;

/** How many of a decoration are in storage. */
export function inStorage(stash: Stash, kind: DecorKind): number {
  return stash.storage[kind] ?? 0;
}

/** Moves one decoration out of storage (placing it) or back in (putting it away). */
export function store(stash: Stash, kind: DecorKind, change: 1 | -1): Stash {
  const n = Math.max(0, inStorage(stash, kind) + change);
  return { ...stash, storage: { ...stash.storage, [kind]: n } };
}

export type BuyResult =
  { ok: true; wallet: Wallet; stash: Stash } | { ok: false; why: "coins" | "full" | "owned" };

export function buy(item: ShopItem, wallet: Wallet, stash: Stash): BuyResult {
  if (item.type === "ball" && stash.balls.includes(item.ball)) return { ok: false, why: "owned" };
  if (item.type === "decor" && inStorage(stash, item.kind) >= STORAGE_MAX) {
    return { ok: false, why: "full" };
  }
  if (item.type === "treat" && (stash.pantry[item.food] ?? 0) + item.pack > PANTRY_MAX) {
    return { ok: false, why: "full" };
  }
  const paid = spend(wallet, item.cost);
  if (!paid) return { ok: false, why: "coins" };
  if (item.type === "ball")
    return { ok: true, wallet: paid, stash: { ...stash, balls: [...stash.balls, item.ball] } };
  if (item.type === "decor") {
    return {
      ok: true,
      wallet: paid,
      stash: store(stash, item.kind, 1),
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

/**
 * Reads a saved stash, keeping only sensible entries. Saves from the short-lived "unlock" shop
 * (an `unlocked` list) turn each unlocked decoration that isn't already placed into one in
 * storage, so nothing bought is lost.
 */
export function parseStash(raw: unknown, placed: DecorKind[] = []): Stash {
  if (!raw || typeof raw !== "object") return emptyStash();
  const r = raw as {
    pantry?: Record<string, unknown>;
    storage?: Record<string, unknown>;
    unlocked?: unknown;
    balls?: unknown;
    bestCatch?: unknown;
  };
  const count = (v: unknown, max: number) =>
    typeof v === "number" && Number.isInteger(v) && v > 0 ? Math.min(v, max) : 0;
  const pantry: Stash["pantry"] = {};
  for (const id of TREAT_IDS) {
    const n = count(r.pantry?.[id], PANTRY_MAX);
    if (n) pantry[id] = n;
  }
  const storage: Stash["storage"] = {};
  for (const k of DECOR_KINDS) {
    const n = count(r.storage?.[k], STORAGE_MAX);
    if (n) storage[k] = n;
  }
  if (Array.isArray(r.unlocked)) {
    for (const k of DECOR_KINDS) {
      if (r.unlocked.includes(k) && !placed.includes(k) && !storage[k]) storage[k] = 1;
    }
  }
  const balls = Array.isArray(r.balls)
    ? BALL_KINDS.filter((b) => BALLS[b].cost > 0 && (r.balls as unknown[]).includes(b))
    : [];
  return { pantry, storage, balls, bestCatch: parseBest(r.bestCatch) };
}
