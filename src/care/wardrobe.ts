import { spend, type Wallet } from "./coins";

/** Where an accessory goes. One of each can be worn at once. */
export type Slot = "head" | "neck" | "back" | "tail";
export const SLOTS: Slot[] = ["head", "neck", "back", "tail"];

export const ACCESSORIES = [
  { id: "hairBow", slot: "head", name: "Hair bow", cost: 30 },
  { id: "partyHat", slot: "head", name: "Party hat", cost: 40 },
  { id: "beanie", slot: "head", name: "Cozy beanie", cost: 45 },
  { id: "chefHat", slot: "head", name: "Chef hat", cost: 45 },
  { id: "flowerCrown", slot: "head", name: "Flower crown", cost: 50 },
  { id: "santaHat", slot: "head", name: "Santa hat", cost: 50 },
  { id: "propellerCap", slot: "head", name: "Propeller cap", cost: 55 },
  { id: "witchHat", slot: "head", name: "Witch hat", cost: 60 },
  { id: "cowboyHat", slot: "head", name: "Cowboy hat", cost: 60 },
  { id: "topHat", slot: "head", name: "Top hat", cost: 70 },
  { id: "crown", slot: "head", name: "Royal crown", cost: 80 },
  { id: "halo", slot: "head", name: "Halo", cost: 90 },
  { id: "bowTie", slot: "neck", name: "Bow tie", cost: 30 },
  { id: "bandana", slot: "neck", name: "Bandana", cost: 35 },
  { id: "bellCollar", slot: "neck", name: "Bell collar", cost: 40 },
  { id: "lei", slot: "neck", name: "Flower lei", cost: 40 },
  { id: "scarf", slot: "neck", name: "Cozy scarf", cost: 45 },
  { id: "heartLocket", slot: "neck", name: "Heart locket", cost: 50 },
  { id: "pearls", slot: "neck", name: "Pearl necklace", cost: 65 },
  { id: "backpack", slot: "back", name: "Tiny backpack", cost: 45 },
  { id: "cape", slot: "back", name: "Hero cape", cost: 70 },
  { id: "butterflyWings", slot: "back", name: "Butterfly wings", cost: 85 },
  { id: "fairyWings", slot: "back", name: "Fairy wings", cost: 90 },
  { id: "tailBow", slot: "tail", name: "Tail bow", cost: 30 },
  { id: "tailFlower", slot: "tail", name: "Tail flower", cost: 35 },
  { id: "tailBell", slot: "tail", name: "Tail bell", cost: 35 },
  { id: "streamers", slot: "tail", name: "Ribbon streamers", cost: 40 },
  { id: "tailStar", slot: "tail", name: "Star charm", cost: 45 },
  { id: "tailRings", slot: "tail", name: "Tail rings", cost: 55 },
] as const;
export type AccessoryId = (typeof ACCESSORIES)[number]["id"];
export type Accessory = (typeof ACCESSORIES)[number];

/** The colors any accessory comes in (tap a worn one's color dots to change). */
export const ACCESSORY_COLORS = ["#ff8ad8", "#7af3ff", "#ffd27a", "#9dffc8", "#b7a0ff", "#ff7a7a"];

export interface Worn {
  id: AccessoryId;
  /** Which of ACCESSORY_COLORS. */
  color: number;
}

/** Accessories bought (kept forever) and what it's wearing now. */
export interface Wardrobe {
  owned: AccessoryId[];
  worn: Partial<Record<Slot, Worn>>;
}

export const emptyWardrobe = (): Wardrobe => ({ owned: [], worn: {} });

export const accessory = (id: AccessoryId): Accessory => ACCESSORIES.find((a) => a.id === id)!;

/** Buys an accessory, if it isn't owned yet and there are enough coins. */
export function buyAccessory(
  w: Wardrobe,
  wallet: Wallet,
  id: AccessoryId,
): { ok: true; wardrobe: Wardrobe; wallet: Wallet } | { ok: false; why: "owned" | "coins" } {
  if (w.owned.includes(id)) return { ok: false, why: "owned" };
  const paid = spend(wallet, accessory(id).cost);
  if (!paid) return { ok: false, why: "coins" };
  return { ok: true, wallet: paid, wardrobe: { ...w, owned: [...w.owned, id] } };
}

/**
 * Puts an owned accessory on (replacing whatever was in that slot), or takes it off if it's
 * already being worn. It keeps the color it had last time.
 */
export function toggleWear(w: Wardrobe, id: AccessoryId, lastColor = 0): Wardrobe {
  if (!w.owned.includes(id)) return w;
  const slot = accessory(id).slot;
  const worn = { ...w.worn };
  if (worn[slot]?.id === id) delete worn[slot];
  else worn[slot] = { id, color: lastColor };
  return { ...w, worn };
}

/** Changes the color of what's worn in a slot. */
export function recolor(w: Wardrobe, slot: Slot, color: number): Wardrobe {
  const now = w.worn[slot];
  if (!now) return w;
  const c =
    ((Math.round(color) % ACCESSORY_COLORS.length) + ACCESSORY_COLORS.length) %
    ACCESSORY_COLORS.length;
  return { ...w, worn: { ...w.worn, [slot]: { ...now, color: c } } };
}

const isId = (v: unknown): v is AccessoryId => ACCESSORIES.some((a) => a.id === v);

/** Reads a saved wardrobe carefully: unknown accessories are dropped, only owned ones worn. */
export function parseWardrobe(raw: unknown): Wardrobe {
  const r = (raw ?? {}) as { owned?: unknown; worn?: unknown };
  const owned = Array.isArray(r.owned) ? [...new Set(r.owned.filter(isId))] : [];
  const worn: Wardrobe["worn"] = {};
  const wr = (r.worn ?? {}) as Record<string, { id?: unknown; color?: unknown } | undefined>;
  for (const slot of SLOTS) {
    const it = wr[slot];
    if (!it || !isId(it.id) || !owned.includes(it.id) || accessory(it.id).slot !== slot) continue;
    const color =
      typeof it.color === "number" && Number.isInteger(it.color) && it.color >= 0
        ? it.color % ACCESSORY_COLORS.length
        : 0;
    worn[slot] = { id: it.id, color };
  }
  return { owned, worn };
}
