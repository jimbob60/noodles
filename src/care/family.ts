import { spend, type Wallet } from "./coins";
import { freshGrowth, growAway, parseGrowth, type Growth } from "./growth";
import { parseIdentity, type Identity } from "./identity";
import { advance, freshNeeds, parseNeeds, type NeedsState } from "./needs";
import { ACCESSORIES, ACCESSORY_COLORS, SLOTS, type Wardrobe } from "./wardrobe";
import { genesFromSeed, JINX_GENES, JINX_SEED, parseGenes, type Genes } from "../noodle/genes";

/** The most dragons a family can have. */
export const MAX_FAMILY = 4;
/** What adopting an egg costs (a first guess; balance in phase 42). */
export const ADOPT_COST = 150;

/**
 * One dragon of the family that isn't out in the den right now. It keeps everything of its own:
 * who it is, its needs, how grown up it is and what it's wearing. (Coins, the den, the pantry
 * and the closet of bought accessories are shared by the whole family.)
 */
export interface FamilyMember {
  seed: number;
  genes: Genes;
  identity: Identity;
  needs: NeedsState;
  growth: Growth;
  worn: Wardrobe["worn"];
  /** When it was last out in the den (so growing while away can be worked out). */
  seenAt: number;
  /** Still an egg: adopted but not hatched yet. */
  egg: boolean;
  /** Out in the den as a friend, playing alongside the dragon you're caring for. */
  visiting: boolean;
}

/** A freshly adopted egg (Jinx's special egg brings its own hand-made genes and name). */
export function newEgg(seed: number, now: number): FamilyMember {
  const jinx = seed === JINX_SEED;
  return {
    seed,
    genes: jinx ? JINX_GENES : genesFromSeed(seed),
    identity: jinx ? { name: "Jinx", birthday: now } : parseIdentity(null, seed, now),
    needs: freshNeeds(now),
    growth: freshGrowth(),
    worn: {},
    seenAt: now,
    egg: true,
    visiting: false,
  };
}

/** Pays for an egg, if there's room in the family and enough coins. */
export function adopt(
  wallet: Wallet,
  familySize: number,
): { ok: true; wallet: Wallet } | { ok: false; why: "full" | "coins" } {
  if (familySize >= MAX_FAMILY) return { ok: false, why: "full" };
  const paid = spend(wallet, ADOPT_COST);
  return paid ? { ok: true, wallet: paid } : { ok: false, why: "coins" };
}

/**
 * Brings a dragon up to date after time out of the den: its needs follow the real clock just as
 * if the game had been closed (gently, capped, asleep if it was tucked in), and it keeps growing
 * if it was left well cared for. An egg just waits.
 */
export function catchUp(m: FamilyMember, now: number): FamilyMember {
  if (m.egg) return { ...m, seenAt: now };
  return {
    ...m,
    growth: growAway(m.growth, now - m.seenAt, m.needs.values),
    needs: advance(m.needs, now, m.needs.inBed === true),
    seenAt: now,
  };
}

function parseWorn(raw: unknown, owned: readonly string[]): Wardrobe["worn"] {
  const worn: Wardrobe["worn"] = {};
  const r = (raw ?? {}) as Record<string, { id?: unknown; color?: unknown } | undefined>;
  for (const slot of SLOTS) {
    const it = r[slot];
    const a = ACCESSORIES.find((x) => x.id === it?.id);
    if (!it || !a || a.slot !== slot || !owned.includes(a.id)) continue;
    const color =
      typeof it.color === "number" && Number.isInteger(it.color) && it.color >= 0
        ? it.color % ACCESSORY_COLORS.length
        : 0;
    worn[slot] = { id: a.id, color };
  }
  return worn;
}

const validSeed = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 2 ** 32;

/** Reads the saved family carefully: broken members are dropped, at most MAX_FAMILY - 1. */
export function parseFamily(raw: unknown, owned: readonly string[], now: number): FamilyMember[] {
  if (!Array.isArray(raw)) return [];
  const out: FamilyMember[] = [];
  for (const item of raw as Record<string, unknown>[]) {
    if (!item || typeof item !== "object" || !validSeed(item.seed)) continue;
    const growth = parseGrowth(item.growth);
    const seenAt =
      typeof item.seenAt === "number" && item.seenAt > 0 && item.seenAt <= now ? item.seenAt : now;
    out.push({
      seed: item.seed,
      genes: parseGenes(item.genes) ?? genesFromSeed(item.seed),
      identity: parseIdentity(item.identity, item.seed, seenAt - growth.hours * 3_600_000),
      needs: parseNeeds(item.needs, now),
      growth,
      worn: parseWorn(item.worn, owned),
      seenAt,
      egg: item.egg === true,
      // Only one friend visits at a time.
      visiting: item.visiting === true && item.egg !== true && !out.some((m) => m.visiting),
    });
    if (out.length >= MAX_FAMILY - 1) break;
  }
  return out;
}
