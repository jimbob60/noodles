import { JINX_SEED, type Genes } from "../noodle/genes";
import {
  ALL_PATTERNS,
  FINISHES,
  HORN_STYLES,
  MARKS,
  MOUTH_STYLES,
  PATTERNS,
  RARE_PATTERNS,
  RIDGE_STYLES,
  SPECIAL_MOUTHS,
  TAIL_STYLES,
  type Finish,
  type Mark,
  type Pattern,
} from "../noodle/look";
import { RARES } from "../noodle/rareGenes";

/**
 * The Dragondex: a collection book of every color, pattern, body part, special dragon and
 * color-and-pattern combo found. A page fills in the first time a dragon with it hatches (or,
 * for dragons you already had, as soon as the game loads), and remembers who found it first and
 * when. Finishing a whole tab of the book wins a sticker and coins.
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
/** Every color page's id (after "color:") and name, everyday ones first. */
export const COLOR_IDS: { id: string; name: string; rare: boolean }[] = [
  ...DEX_COLORS.map((c) => ({ id: c.id as string, name: c.name as string, rare: false })),
  ...FINISHES.map((f) => ({ id: f as string, name: FINISH_NAME[f], rare: true })),
];

/** The body parts with pages: what the gene is called, and a name for each kind. */
export const PART_NAMES = {
  horn: { antler: "Antler horns", curl: "Curly horns", spike: "Spike horns" },
  ridge: { spikes: "Spiky back", scallops: "Scalloped back", sail: "Sail fin" },
  tail: { flame: "Flame tail", fan: "Fan tail", pompom: "Pompom tail" },
  mark: { gem: "Gem mark", star: "Star mark", moon: "Moon mark", heart: "Heart mark" },
  mouth: {
    plain: "Sweet smile",
    fangs: "Little fangs",
    toothy: "Toothy grin",
    snaggle: "Snaggle-tooth",
    extraFang: "Extra fang",
  },
  extra: { frills: "Cheek frills", freckles: "Freckles" },
} as const;

/** The tabs of the book. */
export type DexPage = "colors" | "patterns" | "parts" | "specials" | "combos";
export const DEX_PAGES: DexPage[] = ["colors", "patterns", "parts", "specials", "combos"];

/** One page of the book. */
export interface DexEntry {
  /** Like "color:mint", "pattern:koi", "part:tail:fan", "special:pumpkin" or "combo:mint:koi". */
  id: string;
  page: DexPage;
  name: string;
  rare: boolean;
  /** A hint for a page not found yet. */
  hint: string;
}

const ONE_IN = Math.round(1 / (0.1 / 3));
const HATCH = "Hatch an egg to find it";

const partEntries = (): DexEntry[] => {
  const out: DexEntry[] = [];
  const add = (gene: string, kind: string, name: string, hint = HATCH, rare = false) =>
    out.push({ id: `part:${gene}:${kind}`, page: "parts", name, rare, hint });
  for (const k of HORN_STYLES) add("horn", k, PART_NAMES.horn[k]);
  for (const k of RIDGE_STYLES) add("ridge", k, PART_NAMES.ridge[k]);
  for (const k of TAIL_STYLES) add("tail", k, PART_NAMES.tail[k]);
  for (const k of MARKS.slice(1) as Exclude<Mark, "none">[]) add("mark", k, PART_NAMES.mark[k]);
  for (const k of MOUTH_STYLES) add("mouth", k, PART_NAMES.mouth[k]);
  for (const k of SPECIAL_MOUTHS)
    add("mouth", k, PART_NAMES.mouth[k], "🐈‍⬛ Only Jinx and Jinx's babies have it", true);
  add("extra", "frills", PART_NAMES.extra.frills);
  add("extra", "freckles", PART_NAMES.extra.freckles);
  return out;
};

/** Every page, in the order the book shows them. */
export const DEX: DexEntry[] = [
  ...COLOR_IDS.map((c) => ({
    id: `color:${c.id}`,
    page: "colors" as const,
    name: c.name,
    rare: c.rare,
    hint: c.rare
      ? `✨ Rare: about 1 egg in ${ONE_IN}, or breed a ${c.name.toLowerCase()} parent`
      : HATCH,
  })),
  ...ALL_PATTERNS.map((p) => ({
    id: `pattern:${p}`,
    page: "patterns" as const,
    name: PATTERN_NAME[p],
    rare: !PATTERNS.includes(p),
    hint: PATTERNS.includes(p)
      ? HATCH
      : `✨ Rare: about 1 egg in ${ONE_IN}, or breed a parent that has it`,
  })),
  ...partEntries(),
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
  ...COLOR_IDS.flatMap((c) =>
    ALL_PATTERNS.map((p) => {
      const rare = c.rare || RARE_PATTERNS.includes(p as (typeof RARE_PATTERNS)[number]);
      return {
        id: `combo:${c.id}:${p}`,
        page: "combos" as const,
        name: `${c.name} ${PATTERN_NAME[p]}`,
        rare,
        hint: rare ? "Rare: try breeding for it" : "Hatch or breed for it",
      };
    }),
  ),
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

/** A dragon's body-part pages. */
function partIds(g: Genes): string[] {
  const out = [
    `part:horn:${g.hornStyle}`,
    `part:ridge:${g.ridgeStyle}`,
    `part:tail:${g.tailStyle}`,
    `part:mouth:${g.mouthStyle}`,
  ];
  if (g.mark !== "none") out.push(`part:mark:${g.mark}`);
  if (g.frills) out.push("part:extra:frills");
  if (g.freckles) out.push("part:extra:freckles");
  return out;
}

/**
 * The pages one dragon fills in. A holiday dragon is a page of its own (its colors and parts are
 * hand-made). Jinx is too, and its parts count (that's where the extra fang comes from), but
 * not its hand-picked color. Any other dragon gives its color, pattern, parts and combo.
 */
export function dexIdsOf(genes: Genes): string[] {
  if (genes.special) return [`special:${genes.special}`];
  if (genes.seed === JINX_SEED) return ["special:jinx", ...partIds(genes)];
  const color = genes.finish ?? colorFamily(genes.body.h);
  return [
    `color:${color}`,
    `pattern:${genes.patternKind}`,
    ...partIds(genes),
    `combo:${color}:${genes.patternKind}`,
  ].filter((id) => IDS.has(id));
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

/** How many pages are found, out of how many, in all or on one tab of the book. */
export function dexCount(dex: Dex, page?: DexPage): { found: number; total: number } {
  const pages = DEX.filter((e) => !page || e.page === page);
  return { found: pages.filter((e) => dex.some((f) => f.id === e.id)).length, total: pages.length };
}

// ---- Stickers: finish a whole tab, win a sticker and coins ----

export const STICKERS: Record<DexPage, { icon: string; name: string; coins: number }> = {
  colors: { icon: "🎨", name: "Rainbow painter", coins: 100 },
  patterns: { icon: "🌀", name: "Pattern spotter", coins: 100 },
  parts: { icon: "🦴", name: "Dragon doctor", coins: 150 },
  specials: { icon: "🎉", name: "Holiday hero", coins: 300 },
  combos: { icon: "🧩", name: "Combo master", coins: 500 },
};

/** Reads the saved list of stickers already won. */
export const parsePrizes = (raw: unknown): DexPage[] =>
  Array.isArray(raw) ? DEX_PAGES.filter((p) => raw.includes(p)) : [];

/** Tabs that are now complete but haven't won their sticker yet. */
export const newPrizes = (dex: Dex, prizes: DexPage[]): DexPage[] =>
  DEX_PAGES.filter((p) => !prizes.includes(p) && dexCount(dex, p).found === dexCount(dex, p).total);
