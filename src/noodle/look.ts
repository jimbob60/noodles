/** A color as hue (0–360), saturation and lightness (0–100). */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export type Pattern = "plain" | "stripes" | "spots" | "gradient" | "backstripe";
export const PATTERNS: Pattern[] = ["plain", "stripes", "spots", "gradient", "backstripe"];

/** The gene choices that are one of a few kinds. */
export const HORN_STYLES = ["antler", "curl", "spike"] as const;
export const RIDGE_STYLES = ["spikes", "scallops", "sail"] as const;
export const TAIL_STYLES = ["flame", "fan", "pompom"] as const;
export const MARKS = ["none", "gem", "star", "moon", "heart"] as const;
export const WHISKER_COLORS = ["white", "gold", "accent"] as const;
export const MANE_COLORS = ["accent", "pattern", "horn"] as const;
export const MOUTH_STYLES = ["plain", "fangs", "toothy", "snaggle"] as const;
export type HornStyle = (typeof HORN_STYLES)[number];
export type RidgeStyle = (typeof RIDGE_STYLES)[number];
export type TailStyle = (typeof TAIL_STYLES)[number];
export type Mark = (typeof MARKS)[number];
export type WhiskerColor = (typeof WHISKER_COLORS)[number];
export type ManeColor = (typeof MANE_COLORS)[number];
/** Mouths only special dragons have (never rolled at random). */
export const SPECIAL_MOUTHS = ["extraFang"] as const;
export type MouthStyle = (typeof MOUTH_STYLES)[number] | (typeof SPECIAL_MOUTHS)[number];

/** Everything about how one dragon is colored. Made from a seed by `makeLook`. */
export interface DragonLook {
  seed: number;
  body: Hsl;
  /** Pattern color (stripes, spots, back stripe) or the tail color of a gradient. */
  pattern: Hsl;
  patternKind: Pattern;
  /** Mane, back ridge, tail tip and cheeks. */
  accent: Hsl;
  horn: Hsl;
  /** Horn length, about 0.75 (stubby) to 1.3 (long and sweeping). */
  hornLength: number;
  /** Little branches (tines) on each horn: 0, 1 or 2. */
  hornBranches: number;
  /** Mane length, about 0.75 to 1.3. */
  maneLength: number;
  /** Whisker length, about 0.7 to 1.4. */
  whiskerLength: number;
  /** Grown-up size, about 0.9 (petite) to 1.1 (big and long). */
  size: number;

  // ---- Phase 30, more genes ----
  /** Eye (iris) hue, 0–360. */
  eyeHue: number;
  /** Eye size, about 0.85 to 1.2. */
  eyeSize: number;
  /** Snout length, about 0.85 (short and button-nosed) to 1.2 (long). */
  snoutLength: number;
  /** A little mark on the forehead. */
  mark: Mark;
  /** Freckles on the cheek. */
  freckles: boolean;
  /** Horn shape: branching antlers, curly ram horns or straight spikes. */
  hornStyle: HornStyle;
  /** Back ridge: pointed spikes, round scallops or a flowing sail fin. */
  ridgeStyle: RidgeStyle;
  /** Back ridge size, about 0.6 to 1.4. */
  ridgeSize: number;
  /** Tail tip: a flame, a fish-like fan or a fluffy pompom. */
  tailStyle: TailStyle;
  /** Tail tip size, about 0.75 to 1.3. */
  tailSize: number;
  /** How chubby the body is, about 0.85 to 1.15. */
  chubby: number;
  /** Leg length, about 0.8 (stubby) to 1.3. */
  legLength: number;
  /** How strongly it glows, about 0.5 to 1.6. */
  glow: number;
  /** How clearly the scales show, about 0.12 to 0.5. */
  scaleStrength: number;
  whiskerColor: WhiskerColor;
  /** The mane's color: the accent, the pattern or the horn color. */
  maneColor: ManeColor;
  /** Little fins on the cheeks. */
  frills: boolean;
  /** Teeth: none showing, two little fangs, a grin full of sharp teeth, or one snaggle-tooth. */
  mouthStyle: MouthStyle;
}

export const hsl = (c: Hsl, alpha = 1): string =>
  alpha >= 1
    ? `hsl(${c.h.toFixed(1)} ${c.s.toFixed(1)}% ${c.l.toFixed(1)}%)`
    : `hsl(${c.h.toFixed(1)} ${c.s.toFixed(1)}% ${c.l.toFixed(1)}% / ${alpha})`;

/** Same hue, lighter or darker (clamped to 0–100). */
export const shade = (c: Hsl, dl: number, ds = 0): Hsl => ({
  h: c.h,
  s: Math.min(100, Math.max(0, c.s + ds)),
  l: Math.min(100, Math.max(0, c.l + dl)),
});

/** Small, fast seeded random numbers (mulberry32): the same seed always gives the same dragon. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Body hues that glow nicely on the night sky. Muddy yellow-greens and dull oranges are left out
 * on purpose: hue ranges are [from, to] in degrees.
 */
const BODY_HUES: [number, number][] = [
  [175, 200], // cyan and aqua
  [140, 165], // mint
  [205, 225], // sky blue
  [255, 285], // lavender and violet
  [300, 335], // pink and magenta
  [340, 360], // rose
  [35, 50], // warm gold
  [15, 28], // peach
];
/** Pattern colors that sit well with the body: offsets from its hue. */
const HARMONY_SHIFTS = [0, 30, -30, 60, -60, 150, 180];
/** Pattern lightness must differ from the body by at least this much, so it shows. */
export const MIN_CONTRAST = 16;

/**
 * Roughly how different two colors look: the hue gap (counting less for washed-out colors) plus
 * twice the lightness gap. Under about 25 they blend into each other.
 */
export function colorGap(a: Hsl, b: Hsl): number {
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
  return dh * (Math.min(a.s, b.s) / 100) + Math.abs(a.l - b.l) * 2;
}
/** Colors closer than this to the body would blend into it. */
export const MIN_GAP = 30;

export function makeLook(seed: number): DragonLook {
  const r = seededRandom(seed);
  const pick = <T>(list: T[]) => list[Math.floor(r() * list.length)];
  const range = (a: number, b: number) => a + r() * (b - a);

  const [h0, h1] = pick(BODY_HUES);
  const body: Hsl = { h: range(h0, h1) % 360, s: range(82, 96), l: range(70, 78) };
  const patternKind = pick(PATTERNS);

  // Pattern: a harmonious hue, then pushed lighter or darker until it clearly shows.
  const shift = pick(HARMONY_SHIFTS);
  // Mostly darker: on these bright bodies, lighter patterns are harder to see.
  const darker = r() < 0.75;
  let l = darker ? body.l - range(18, 30) : Math.min(95, body.l + range(16, 22));
  if (Math.abs(l - body.l) < MIN_CONTRAST) l = body.l - MIN_CONTRAST - 4;
  const pattern: Hsl = { h: (body.h + shift + 360) % 360, s: range(75, 95), l };

  // Accent: pink by default (cute!), or a hue far from the body for contrast.
  const accentHue = r() < 0.5 ? range(318, 335) : (body.h + range(140, 200)) % 360;
  let accent: Hsl = { h: accentHue, s: range(85, 95), l: range(72, 80) };
  // A pink mane on a pink dragon would vanish: swing it across the color wheel instead.
  if (colorGap(accent, body) < MIN_GAP) accent = { ...accent, h: (body.h + 165) % 360 };

  let horn: Hsl = r() < 0.7 ? { h: 45, s: 100, l: 89 } : shade(pattern, 12);
  // Horns must stand out from the head too: cream, or a deep shade of the body on pale gold.
  if (colorGap(horn, body) < MIN_GAP) horn = { h: 45, s: 100, l: 89 };
  if (colorGap(horn, body) < MIN_GAP) horn = shade(body, -30, -10);
  // Body shape comes from its own stream, so adding it kept every dragon's colors the same.
  const b = seededRandom(seed ^ 0x9e37_79b9);
  const between = (a: number, z: number) => a + b() * (z - a);
  return {
    seed,
    body,
    pattern,
    patternKind,
    accent,
    horn,
    hornLength: between(0.75, 1.3),
    hornBranches: Math.floor(b() * 3),
    maneLength: between(0.75, 1.3),
    whiskerLength: between(0.7, 1.4),
    size: between(0.9, 1.1),
    ...moreGenes(seed, accent),
  };
}

/**
 * The phase 30 extra genes, from a third stream of their own, so adding them didn't change any
 * gene a dragon already had.
 */
function moreGenes(seed: number, accent: Hsl) {
  const m = seededRandom(seed ^ 0x2545_f491);
  const between = (a: number, z: number) => a + m() * (z - a);
  const one = <T>(list: readonly T[]) => list[Math.floor(m() * list.length)];
  return {
    // Eyes: half match the accent, half are a jewel color of their own.
    eyeHue: m() < 0.5 ? accent.h : Math.floor(m() * 360),
    eyeSize: between(0.85, 1.2),
    snoutLength: between(0.85, 1.2),
    mark: m() < 0.55 ? ("none" as Mark) : one(MARKS.slice(1)),
    freckles: m() < 0.3,
    hornStyle: one(HORN_STYLES),
    ridgeStyle: one(RIDGE_STYLES),
    ridgeSize: between(0.6, 1.4),
    tailStyle: one(TAIL_STYLES),
    tailSize: between(0.75, 1.3),
    chubby: between(0.85, 1.15),
    legLength: between(0.8, 1.3),
    glow: between(0.5, 1.6),
    scaleStrength: between(0.12, 0.5),
    whiskerColor: one(WHISKER_COLORS),
    maneColor: m() < 0.6 ? ("accent" as ManeColor) : one(MANE_COLORS),
    frills: m() < 0.4,
    mouthStyle: one(MOUTH_STYLES),
  };
}

/** The original cyan dragon from phases 6–10, kept as the default look. */
export const CLASSIC_LOOK: DragonLook = {
  seed: 0,
  body: { h: 187, s: 100, l: 74 },
  pattern: { h: 187, s: 70, l: 55 },
  patternKind: "plain",
  accent: { h: 320, s: 100, l: 77 },
  horn: { h: 45, s: 100, l: 89 },
  hornLength: 1,
  hornBranches: 1,
  maneLength: 1,
  whiskerLength: 1,
  size: 1,
  eyeHue: 320,
  eyeSize: 1,
  snoutLength: 1,
  mark: "none",
  freckles: false,
  hornStyle: "antler",
  ridgeStyle: "spikes",
  ridgeSize: 1,
  tailStyle: "flame",
  tailSize: 1,
  chubby: 1,
  legLength: 1,
  glow: 1,
  scaleStrength: 0.32,
  whiskerColor: "white",
  maneColor: "accent",
  frills: false,
  mouthStyle: "plain",
};
