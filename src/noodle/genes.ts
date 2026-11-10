import { favoriteFood, FOOD_IDS, type FoodId } from "../care/food";
import { tickleSpots } from "../care/petting";
import { CLASSIC_LOOK, makeLook, PATTERNS, seededRandom, type DragonLook, type Hsl } from "./look";

/** Personality traits, each 0 (not at all) to 1 (very). How they act on these comes later. */
export interface Personality {
  playful: number;
  sleepy: number;
  greedy: number;
  shy: number;
}
export const TRAITS: (keyof Personality)[] = ["playful", "sleepy", "greedy", "shy"];

/**
 * Everything that makes one dragon itself: its look (colors, pattern, horns, mane, whiskers,
 * size), its personality, favorite food and secret tickle spots. Drawing and behavior read only
 * these, so the same genes always make the same dragon. They are saved with the dragon, and
 * later breeding will mix two dragons' genes.
 */
export interface Genes extends DragonLook {
  personality: Personality;
  favorite: FoodId;
  /** Tickle spots along the body (0 = nose, 1 = tail tip). */
  tickles: number[];
}

/** A wild dragon's genes, all from one seed (the same seed always gives the same genes). */
export function genesFromSeed(seed: number): Genes {
  const r = seededRandom(seed ^ 0x6e0_0d1e);
  const personality = { playful: r(), sleepy: r(), greedy: r(), shy: r() };
  return {
    ...makeLook(seed),
    personality,
    favorite: favoriteFood(seed),
    tickles: tickleSpots(seed),
  };
}

/** The original cyan dragon, as genes. */
export const CLASSIC_GENES: Genes = {
  ...CLASSIC_LOOK,
  personality: { playful: 0.5, sleepy: 0.5, greedy: 0.5, shy: 0.5 },
  favorite: "noodles",
  tickles: [0.4],
};

const num = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null;

function color(v: unknown): Hsl | null {
  const c = v as Partial<Hsl> | null;
  if (!c || typeof c !== "object") return null;
  const h = num(c.h, 0, 360);
  const s = num(c.s, 0, 100);
  const l = num(c.l, 0, 100);
  return h === null || s === null || l === null ? null : { h, s, l };
}

/**
 * Reads saved genes, accepting only sensible values (numbers are kept within their ranges).
 * Returns null if they are missing or broken, so the caller can fall back to the seed.
 */
export function parseGenes(raw: unknown): Genes | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const seed = num(g.seed, 0, 2 ** 32 - 1);
  const body = color(g.body);
  const pattern = color(g.pattern);
  const accent = color(g.accent);
  const horn = color(g.horn);
  const patternKind = PATTERNS.find((p) => p === g.patternKind);
  const hornLength = num(g.hornLength, 0.75, 1.3);
  const hornBranches = num(g.hornBranches, 0, 2);
  const maneLength = num(g.maneLength, 0.75, 1.3);
  const whiskerLength = num(g.whiskerLength, 0.7, 1.4);
  const size = num(g.size, 0.9, 1.1);
  const favorite = FOOD_IDS.find((f) => f === g.favorite);
  const pRaw = (g.personality ?? {}) as Record<string, unknown>;
  const traits = TRAITS.map((t) => num(pRaw[t], 0, 1));
  const tickles = Array.isArray(g.tickles)
    ? g.tickles.map((t) => num(t, 0, 1)).filter((t): t is number => t !== null)
    : [];
  if (
    seed === null ||
    !body ||
    !pattern ||
    !accent ||
    !horn ||
    !patternKind ||
    hornLength === null ||
    hornBranches === null ||
    maneLength === null ||
    whiskerLength === null ||
    size === null ||
    !favorite ||
    traits.some((t) => t === null) ||
    tickles.length < 1 ||
    tickles.length > 3
  )
    return null;
  const [playful, sleepy, greedy, shy] = traits as number[];
  return {
    seed: Math.round(seed),
    body,
    pattern,
    patternKind,
    accent,
    horn,
    hornLength,
    hornBranches: Math.round(hornBranches),
    maneLength,
    whiskerLength,
    size,
    personality: { playful, sleepy, greedy, shy },
    favorite,
    tickles,
  };
}
