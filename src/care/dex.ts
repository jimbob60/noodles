import { JINX_SEED, type Genes } from "../noodle/genes";
import { FINISHES, PATTERNS, RARE_PATTERNS, type Finish, type Pattern } from "../noodle/look";
import { RARES } from "../noodle/rareGenes";

/**
 * The Dragondex: a collection book of every color, pattern and special dragon found. A page
 * fills in the first time a dragon with it hatches (or, for dragons you already had, as soon as
 * the book opens), and remembers who found it first and when.
 */

/** The everyday body colors: one per hue family wild dragons are born in (see look.ts). */
export const DEX_COLORS = [
  { id: "aqua", name: "Aqua", hue: 187.5 },
  { id: "mint", name: "Mint", hue: 152.5 },
  { id: "sky", name: "Sky blue", hue: 215 },
  { id: "lavender", name: "Lavender", hue: 270 },
  { id: "pink", name: "Bubblegum", hue: 317.5 },
  { id: "rose", name: "Rose", hue: 350 },
  { id: "honey", name: "Honey", hue: 42.5 },
  { id: "peach", name: "Peach", hue: 21.5 },
] as const;
export type DexColor = (typeof DEX_COLORS)[number]["id"];

export const FINISH_NAME: Record<Finish, string> = {
  golden: "Golden",
  pearl: "Pearl",
  midnight: "Midnight",
};
export const PATTERN_NAME: Record<Pattern, string> = {
  plain: "Plain",
  stripes: "Stripes",
  spots: "Spots",
  gradient: "Ombré",
  backstripe: "Back stripe",
  stars: "Starry",
  rainbow: "Rainbow",
  koi: "Koi patches",
};

/** One page of the book. */
export interface DexEntry {
  /** Like "color:mint", "pattern:koi", "special:pumpkin" or "special:jinx". */
  id: string;
  page: "colors" | "patterns" | "specials";
  name: string;
  rare: boolean;
  /** A hint for a page not found yet. */
  hint: string;
}

const ONE_IN = Math.round(1 / (0.1 / 3));

/** Every page, in the order the book shows them. */
export const DEX: DexEntry[] = [
  ...DEX_COLORS.map((c) => ({
    id: `color:${c.id}`,
    page: "colors" as const,
    name: c.name,
    rare: false,
    hint: "Hatch an egg to find it",
  })),
  ...FINISHES.map((f) => ({
    id: `color:${f}`,
    page: "colors" as const,
    name: FINISH_NAME[f],
    rare: true,
    hint: `✨ Rare: about 1 egg in ${ONE_IN}, or breed a ${FINISH_NAME[f].toLowerCase()} parent`,
  })),
  ...PATTERNS.map((p) => ({
    id: `pattern:${p}`,
    page: "patterns" as const,
    name: PATTERN_NAME[p],
    rare: false,
    hint: "Hatch an egg to find it",
  })),
  ...RARE_PATTERNS.map((p) => ({
    id: `pattern:${p}`,
    page: "patterns" as const,
    name: PATTERN_NAME[p],
    rare: true,
    hint: `✨ Rare: about 1 egg in ${ONE_IN}, or breed a parent that has it`,
  })),
  ...RARES.map((r) => ({
    id: `special:${r.id}`,
    page: "specials" as const,
    name: r.name,
    rare: true,
    hint: `${r.icon} Hatches only near ${r.holiday}`,
  })),
  {
    id: "special:jinx",
    page: "specials",
    name: "Jinx",
    rare: true,
    hint: "🐈‍⬛ A gift egg in the family card",
  },
];
const IDS = new Set(DEX.map((e) => e.id));

/** Which everyday color a body hue is closest to (bred dragons can land between families). */
export function colorFamily(hue: number): DexColor {
  const gap = (a: number, b: number) => {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
  };
  let best: (typeof DEX_COLORS)[number] = DEX_COLORS[0];
  for (const c of DEX_COLORS) if (gap(hue, c.hue) < gap(hue, best.hue)) best = c;
  return best.id;
}

/**
 * The pages one dragon fills in. A holiday dragon and Jinx are pages of their own (their colors
 * are hand-picked, not ones you could hatch); any other dragon gives its color and pattern.
 */
export function dexIdsOf(genes: Genes): string[] {
  if (genes.special) return [`special:${genes.special}`];
  if (genes.seed === JINX_SEED) return ["special:jinx"];
  const color = genes.finish ?? colorFamily(genes.body.h);
  return [`color:${color}`, `pattern:${genes.patternKind}`];
}

/** A page found: when, and the name of the dragon that found it. */
export interface DexFind {
  id: string;
  by: string;
  at: number;
}
export type Dex = DexFind[];

/** Marks a dragon's pages as found (pages already found keep their first finder). */
export function discover(dex: Dex, genes: Genes, by: string, at: number): Dex {
  const fresh = dexIdsOf(genes).filter((id) => !dex.some((f) => f.id === id));
  return fresh.length ? [...dex, ...fresh.map((id) => ({ id, by, at }))] : dex;
}

/** The pages in `after` that weren't in `before`. */
export const newFinds = (before: Dex, after: Dex): DexFind[] =>
  after.filter((f) => !before.some((b) => b.id === f.id));

/** Reads a saved Dragondex, keeping only real pages (once each). */
export function parseDex(raw: unknown): Dex {
  if (!Array.isArray(raw)) return [];
  const out: Dex = [];
  for (const item of raw) {
    const f = item as Partial<DexFind> | null;
    if (!f || typeof f.id !== "string" || !IDS.has(f.id) || out.some((o) => o.id === f.id))
      continue;
    const by = typeof f.by === "string" ? f.by.slice(0, 16) : "";
    const at = typeof f.at === "number" && Number.isFinite(f.at) ? f.at : 0;
    out.push({ id: f.id, by, at });
  }
  return out;
}

/** How many pages are found, out of how many, in all or on one page of the book. */
export function dexCount(dex: Dex, page?: DexEntry["page"]): { found: number; total: number } {
  const pages = DEX.filter((e) => !page || e.page === page);
  return { found: pages.filter((e) => dex.some((f) => f.id === e.id)).length, total: pages.length };
}
