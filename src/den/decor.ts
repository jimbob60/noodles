export type DecorKind =
  | "lantern"
  | "cushion"
  | "plant"
  | "jar"
  | "rug"
  | "lights"
  | "crystal"
  | "stool"
  | "mobile"
  | "tea"
  | "bonsai"
  | "beanbag"
  | "planet";
export const DECOR_KINDS: DecorKind[] = [
  "lantern",
  "lights",
  "mobile",
  "jar",
  "crystal",
  "cushion",
  "stool",
  "plant",
  "tea",
  "rug",
  "bonsai",
  "beanbag",
  "planet",
];
/** Free from the start; the others are bought in the shop. */
export const STARTER_DECOR: DecorKind[] = DECOR_KINDS.slice(0, 10);

/** How many decorations a den can hold, so it stays cozy rather than cluttered. */
export const MAX_DECOR = 16;
/** Each decoration comes in three colors; tapping one cycles through them. */
export const COLORS_PER_KIND = 3;

/** One placed decoration. Position is a share of the screen (0–1), so it fits any size. */
export interface DecorItem {
  kind: DecorKind;
  x: number;
  y: number;
  color: number;
}

/** Things that rest on the ground can't float: they stay in the floor band. */
export const ON_FLOOR: Record<DecorKind, boolean> = {
  lantern: false,
  cushion: true,
  plant: true,
  jar: false,
  rug: true,
  lights: false,
  crystal: true,
  stool: true,
  mobile: false,
  tea: true,
  bonsai: true,
  beanbag: true,
  planet: false,
};

/** How wide each decoration is, in decoration sizes (for grabbing it). */
export const WIDTH: Record<DecorKind, number> = {
  lantern: 1,
  cushion: 1.3,
  plant: 1,
  jar: 1,
  rug: 2,
  lights: 2.6,
  crystal: 1,
  stool: 1,
  mobile: 1.2,
  tea: 1.4,
  bonsai: 1.3,
  beanbag: 1.3,
  planet: 1.3,
};
export const FLOOR_BAND: [number, number] = [0.8, 0.95];

/** Keeps a decoration on screen, and floor things on the floor. */
export function placeWithinDen(kind: DecorKind, x: number, y: number): { x: number; y: number } {
  const cx = Math.min(0.97, Math.max(0.03, x));
  const [lo, hi] = ON_FLOOR[kind] ? FLOOR_BAND : [0.05, 0.95];
  return { x: cx, y: Math.min(hi, Math.max(lo, y)) };
}

export function addDecor(items: DecorItem[], kind: DecorKind, x: number, y: number): DecorItem[] {
  if (items.length >= MAX_DECOR) return items;
  return [...items, { kind, ...placeWithinDen(kind, x, y), color: 0 }];
}

export function moveDecor(items: DecorItem[], index: number, x: number, y: number): DecorItem[] {
  return items.map((it, i) => (i === index ? { ...it, ...placeWithinDen(it.kind, x, y) } : it));
}

export function removeDecor(items: DecorItem[], index: number): DecorItem[] {
  return items.filter((_, i) => i !== index);
}

export function recolorDecor(items: DecorItem[], index: number): DecorItem[] {
  return items.map((it, i) =>
    i === index ? { ...it, color: (it.color + 1) % COLORS_PER_KIND } : it,
  );
}

/** Rugs lie flat, so they're drawn first; then everything else from back (high) to front (low). */
export function drawOrder(items: DecorItem[]): number[] {
  return items
    .map((it, i) => ({ i, rug: it.kind === "rug", y: it.y }))
    .sort((a, b) => (a.rug === b.rug ? a.y - b.y : a.rug ? -1 : 1))
    .map((e) => e.i);
}

/** Reads saved decorations, keeping only sensible ones. */
export function parseDecor(raw: unknown): DecorItem[] {
  if (!Array.isArray(raw)) return [];
  const out: DecorItem[] = [];
  for (const r of raw) {
    if (out.length >= MAX_DECOR) break;
    if (!r || typeof r !== "object") continue;
    const d = r as Record<string, unknown>;
    if (!DECOR_KINDS.includes(d.kind as DecorKind)) continue;
    if (typeof d.x !== "number" || typeof d.y !== "number" || !Number.isFinite(d.x + d.y)) continue;
    const kind = d.kind as DecorKind;
    const color = Number.isInteger(d.color) ? Math.abs(d.color as number) % COLORS_PER_KIND : 0;
    out.push({ kind, ...placeWithinDen(kind, d.x, d.y), color });
  }
  return out;
}
