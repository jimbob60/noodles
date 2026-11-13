import type { Genes } from "./genes";
import type { Hsl, Special } from "./look";

/** Everything about one holiday dragon. */
export interface Rare {
  id: Special;
  /** Its fixed dragon number. */
  seed: number;
  name: string;
  holiday: string;
  icon: string;
  /** The day its holiday falls on in a given year. */
  day: (year: number) => Date;
  genes: Genes;
}

/** Days either side of the holiday that its dragon can hatch (a two-week window). */
export const WINDOW_DAYS = 7;
/** Chance a surprise egg is a holiday dragon while one is in season. */
export const RARE_CHANCE = 0.35;

const on = (month: number, day: number) => (year: number) => new Date(year, month - 1, day);
/** Thanksgiving: the fourth Thursday of November. */
const thanksgiving = (year: number) => {
  const first = new Date(year, 10, 1).getDay();
  return new Date(year, 10, 1 + ((4 - first + 7) % 7) + 21);
};

const c = (h: number, s: number, l: number): Hsl => ({ h, s, l });

/** Shared starting point: the parts a holiday dragon doesn't change. */
const base = {
  patternKind: "plain" as const,
  hornLength: 1,
  hornBranches: 0,
  maneLength: 1,
  whiskerLength: 1,
  size: 1,
  eyeSize: 1.1,
  snoutLength: 1,
  mark: "none" as const,
  freckles: false,
  hornStyle: "spike" as const,
  ridgeStyle: "spikes" as const,
  ridgeSize: 1,
  tailStyle: "pompom" as const,
  tailSize: 1,
  chubby: 1,
  legLength: 1,
  glow: 1.2,
  scaleStrength: 0.25,
  whiskerColor: "white" as const,
  maneColor: "accent" as const,
  frills: false,
  mouthStyle: "plain" as const,
  tickles: [0.3, 0.6],
};

/**
 * The holiday dragons. Each can only hatch in the two weeks around its holiday, and each has
 * parts no other dragon has (drawn in rares.ts). Batch one: autumn and winter.
 */
export const RARES: Rare[] = [
  {
    id: "pumpkin",
    seed: 0x50554d50,
    name: "Pumpkin",
    holiday: "Halloween",
    icon: "🎃",
    day: on(10, 31),
    genes: {
      ...base,
      special: "pumpkin",
      seed: 0x50554d50,
      body: c(28, 95, 58),
      pattern: c(22, 90, 45),
      patternKind: "stripes",
      accent: c(120, 60, 45),
      horn: c(110, 45, 35),
      eyeHue: 48,
      ridgeStyle: "scallops",
      ridgeSize: 0.8,
      chubby: 1.12,
      glow: 1.5,
      personality: { playful: 0.5, sleepy: 0.3, greedy: 0.95, shy: 0.2 },
      favorite: "dumpling",
    },
  },
  {
    id: "boo",
    seed: 0x424f4f21,
    name: "Boo",
    holiday: "Halloween",
    icon: "👻",
    day: on(10, 31),
    genes: {
      ...base,
      special: "boo",
      seed: 0x424f4f21,
      body: c(220, 40, 93),
      pattern: c(220, 40, 80),
      accent: c(200, 70, 82),
      horn: c(220, 30, 85),
      hornLength: 0.75,
      eyeHue: 250,
      eyeSize: 1.2,
      ridgeStyle: "scallops",
      ridgeSize: 0.6,
      scaleStrength: 0.12,
      glow: 1.6,
      personality: { playful: 0.4, sleepy: 0.4, greedy: 0.2, shy: 0.95 },
      favorite: "noodles",
    },
  },
  {
    id: "gobble",
    seed: 0x474f4242,
    name: "Gobble",
    holiday: "Thanksgiving",
    icon: "🦃",
    day: thanksgiving,
    genes: {
      ...base,
      special: "gobble",
      seed: 0x474f4242,
      body: c(24, 55, 46),
      pattern: c(18, 60, 34),
      patternKind: "spots",
      accent: c(12, 90, 55),
      horn: c(40, 90, 70),
      eyeHue: 35,
      chubby: 1.15,
      tailSize: 1.3,
      personality: { playful: 0.3, sleepy: 0.7, greedy: 1, shy: 0.2 },
      favorite: "dumpling",
    },
  },
  {
    id: "tinsel",
    seed: 0x54494e53,
    name: "Tinsel",
    holiday: "Christmas",
    icon: "🎄",
    day: on(12, 25),
    genes: {
      ...base,
      special: "tinsel",
      seed: 0x54494e53,
      body: c(145, 60, 40),
      pattern: c(145, 60, 30),
      accent: c(0, 85, 60),
      horn: c(30, 45, 62),
      hornStyle: "antler",
      hornBranches: 2,
      hornLength: 1.25,
      mark: "star",
      eyeHue: 20,
      personality: { playful: 0.95, sleepy: 0.3, greedy: 0.5, shy: 0.2 },
      favorite: "noodles",
    },
  },
  {
    id: "snowflake",
    seed: 0x534e4f57,
    name: "Snowflake",
    holiday: "the first day of winter",
    icon: "⛄",
    day: on(12, 21),
    genes: {
      ...base,
      special: "snowflake",
      seed: 0x534e4f57,
      body: c(200, 60, 92),
      pattern: c(200, 70, 80),
      accent: c(195, 90, 78),
      horn: c(200, 60, 85),
      hornLength: 0.75,
      eyeHue: 205,
      ridgeSize: 1.2,
      scaleStrength: 0.14,
      glow: 1.5,
      personality: { playful: 0.4, sleepy: 0.95, greedy: 0.3, shy: 0.4 },
      favorite: "fish",
    },
  },
];

export const rareBySeed = (seed: number): Rare | undefined => RARES.find((r) => r.seed === seed);
export const rareOf = (id: Special | undefined): Rare | undefined => RARES.find((r) => r.id === id);

const DAY = 86_400_000;

/** The holiday dragons that can hatch right now (within a week either side of their day). */
export function raresInSeason(now: number): Rare[] {
  const year = new Date(now).getFullYear();
  return RARES.filter((r) =>
    [year - 1, year, year + 1].some(
      // The whole of the last day counts.
      (y) => Math.abs(now - (r.day(y).getTime() + DAY / 2)) <= (WINDOW_DAYS + 0.5) * DAY,
    ),
  );
}

/**
 * Which holiday dragon (if any) a surprise egg turns out to be: only one in season that the
 * family doesn't already have, and only some of the time.
 */
export function rareSurprise(now: number, owned: number[], random: () => number): Rare | null {
  const open = raresInSeason(now).filter((r) => !owned.includes(r.seed));
  if (open.length === 0 || random() >= RARE_CHANCE) return null;
  return open[Math.floor(random() * open.length)];
}
