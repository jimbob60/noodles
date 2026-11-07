/** A color as hue (0–360), saturation and lightness (0–100). */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export type Pattern = "plain" | "stripes" | "spots" | "gradient" | "backstripe";
export const PATTERNS: Pattern[] = ["plain", "stripes", "spots", "gradient", "backstripe"];

/** Everything about how one dragon is colored. Made from a seed by `makeLook`. */
export interface DragonLook {
  seed: number;
  body: Hsl;
  /** Pattern color (stripes, spots, back stripe) or the tail color of a gradient. */
  pattern: Hsl;
  patternKind: Pattern;
  /** Tail tuft, toe beans and cheeks. */
  accent: Hsl;
  horn: Hsl;
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
  const accent: Hsl = { h: accentHue, s: range(85, 95), l: range(72, 80) };

  const horn: Hsl = r() < 0.7 ? { h: 45, s: 100, l: 89 } : shade(pattern, 12);
  return { seed, body, pattern, patternKind, accent, horn };
}

/** The original cyan dragon from phases 6–10, kept as the default look. */
export const CLASSIC_LOOK: DragonLook = {
  seed: 0,
  body: { h: 187, s: 100, l: 74 },
  pattern: { h: 187, s: 70, l: 55 },
  patternKind: "plain",
  accent: { h: 320, s: 100, l: 77 },
  horn: { h: 45, s: 100, l: 89 },
};
