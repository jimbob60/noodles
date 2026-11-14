import { MAX_FAMILY } from "./family";
import { stageOf, type Growth } from "./growth";
import { genesFromSeed, parseGenes, TRAITS, type Genes } from "../noodle/genes";
import {
  applyFinish,
  FINISHES,
  RARE_PATTERNS,
  type Finish,
  type Hsl,
  type RarePattern,
} from "../noodle/look";

/** How often one gene takes a surprise turn instead of following the parents. */
export const MUTATION = 0.08;

/** How often a baby of plain parents sparks a rare color (and, separately, a rare pattern). */
export const RARE_SPARK = 0.05;

/** Why two dragons can (or can't yet) make an egg. */
export type BreedCheck = "ok" | "grow" | "full";

/** Two grown-ups can make an egg, as long as there's room in the family. */
export function breedCheck(a: Growth, b: Growth, familySize: number): BreedCheck {
  if (stageOf(a).id !== "adult" || stageOf(b).id !== "adult") return "grow";
  return familySize >= MAX_FAMILY ? "full" : "ok";
}

/** A hue between two hues, going the short way round the color wheel. */
function mixHue(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
}

/**
 * A baby's genes: a blend of its two parents. Sizes and colors land somewhere between mum's and
 * dad's; styles (pattern, horns, tail and so on) come from one or the other; and now and then a
 * gene takes a small surprise turn of its own (a mutation), borrowed from the wild dragon the
 * baby's number would have made. A holiday parent passes on its colors, not its holiday magic.
 */
export function mixGenes(
  a: Genes,
  b: Genes,
  seed: number,
  random: () => number = Math.random,
): Genes {
  const wild = genesFromSeed(seed);
  const surprise = () => random() < MUTATION;
  const share = () => 0.3 + 0.4 * random();
  const num = (x: number, y: number, w: number) => {
    const v = x + (y - x) * share();
    return v + (w - v) * (surprise() ? 0.6 : 0);
  };
  const hue = (x: number, y: number) =>
    (mixHue(x, y, share()) + (surprise() ? (random() < 0.5 ? -30 : 30) : 0) + 360) % 360;
  const color = (x: Hsl, y: Hsl): Hsl => ({
    h: hue(x.h, y.h),
    s: x.s + (y.s - x.s) * share(),
    l: x.l + (y.l - x.l) * share(),
  });
  const pick = <T>(x: T, y: T, w: T): T => (surprise() ? w : random() < 0.5 ? x : y);
  const personality = { ...a.personality };
  for (const t of TRAITS) {
    const v = num(a.personality[t], b.personality[t], wild.personality[t]);
    personality[t] = Math.min(1, Math.max(0, v + (random() - 0.5) * 0.1));
  }
  const mixed: Genes = {
    seed,
    body: color(a.body, b.body),
    pattern: color(a.pattern, b.pattern),
    accent: color(a.accent, b.accent),
    horn: color(a.horn, b.horn),
    patternKind: pick(a.patternKind, b.patternKind, wild.patternKind),
    hornLength: num(a.hornLength, b.hornLength, wild.hornLength),
    hornBranches: pick(a.hornBranches, b.hornBranches, wild.hornBranches),
    maneLength: num(a.maneLength, b.maneLength, wild.maneLength),
    whiskerLength: num(a.whiskerLength, b.whiskerLength, wild.whiskerLength),
    size: num(a.size, b.size, wild.size),
    eyeHue: hue(a.eyeHue, b.eyeHue),
    eyeSize: num(a.eyeSize, b.eyeSize, wild.eyeSize),
    snoutLength: num(a.snoutLength, b.snoutLength, wild.snoutLength),
    mark: pick(a.mark, b.mark, wild.mark),
    freckles: pick(a.freckles, b.freckles, wild.freckles),
    hornStyle: pick(a.hornStyle, b.hornStyle, wild.hornStyle),
    ridgeStyle: pick(a.ridgeStyle, b.ridgeStyle, wild.ridgeStyle),
    ridgeSize: num(a.ridgeSize, b.ridgeSize, wild.ridgeSize),
    tailStyle: pick(a.tailStyle, b.tailStyle, wild.tailStyle),
    tailSize: num(a.tailSize, b.tailSize, wild.tailSize),
    chubby: num(a.chubby, b.chubby, wild.chubby),
    legLength: num(a.legLength, b.legLength, wild.legLength),
    glow: num(a.glow, b.glow, wild.glow),
    scaleStrength: num(a.scaleStrength, b.scaleStrength, wild.scaleStrength),
    whiskerColor: pick(a.whiskerColor, b.whiskerColor, wild.whiskerColor),
    maneColor: pick(a.maneColor, b.maneColor, wild.maneColor),
    frills: pick(a.frills, b.frills, wild.frills),
    mouthStyle: pick(a.mouthStyle, b.mouthStyle, wild.mouthStyle),
    personality,
    favorite: pick(a.favorite, b.favorite, wild.favorite),
    tickles: [...(random() < 0.5 ? a : b).tickles],
  };
  // Rare colors and patterns run in the family: a rare pattern passes on like any other style
  // (above), a rare color comes from one parent or the other, and now and then plain parents
  // spark a rare of their own.
  const one = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
  let finish: Finish | undefined = random() < 0.5 ? a.finish : b.finish;
  if (!finish && random() < RARE_SPARK) finish = one(FINISHES);
  const plain = !RARE_PATTERNS.includes(mixed.patternKind as RarePattern);
  if (plain && random() < RARE_SPARK) mixed.patternKind = one(RARE_PATTERNS);
  // Reading them back the careful way keeps every gene inside its allowed range.
  return parseGenes(finish ? applyFinish(mixed, finish) : mixed) ?? wild;
}
