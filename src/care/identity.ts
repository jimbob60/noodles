import { seededRandom } from "../noodle/look";

/** Who a dragon is: its name and when it hatched. */
export interface Identity {
  name: string;
  /** When it hatched (milliseconds since 1970). */
  birthday: number;
}

/** Longest name, in letters. */
export const NAME_MAX = 16;

/** Cozy food-and-sky names, so the suggestions always sound cute. */
const NAMES = [
  "Mochi",
  "Bao",
  "Udon",
  "Soba",
  "Miso",
  "Yuzu",
  "Boba",
  "Tofu",
  "Kiwi",
  "Pip",
  "Noodle",
  "Dumpling",
  "Sesame",
  "Ginger",
  "Maple",
  "Biscuit",
  "Peaches",
  "Lychee",
  "Momo",
  "Taro",
  "Wasabi",
  "Nori",
  "Ramen",
  "Sprout",
  "Pudding",
  "Comet",
  "Pebble",
  "Twinkle",
  "Luna",
  "Nova",
  "Sunny",
  "Cloud",
  "Breezy",
  "Fizz",
  "Bubbles",
  "Jellybean",
  "Sushi",
  "Matcha",
  "Chai",
  "Dot",
];
const EXTRAS = ["", "", "", "", "Bean", "Puff", "Pie", "Drop", "Bun"];

/** A cute name suggestion (the same random numbers always give the same name). */
export function suggestName(random: () => number = Math.random): string {
  const first = NAMES[Math.floor(random() * NAMES.length)];
  const extra = EXTRAS[Math.floor(random() * EXTRAS.length)];
  return first.length + extra.length <= NAME_MAX ? first + extra : first;
}

/**
 * Tidies a typed name: no control characters, single spaces, at most NAME_MAX letters (emoji
 * count as one). Returns null if nothing is left.
 */
export function cleanName(raw: string): string | null {
  // eslint-disable-next-line no-control-regex
  const tidy = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const letters = Array.from(tidy).slice(0, NAME_MAX).join("").trim();
  return letters.length > 0 ? letters : null;
}

/** A brand-new dragon's identity: hatched now, with a suggested name. */
export function newIdentity(now: number, random: () => number = Math.random): Identity {
  return { name: suggestName(random), birthday: now };
}

/**
 * Reads a saved identity carefully. A dragon from before names existed gets a name from its
 * seed (always the same one) and a birthday worked out from how long it has been growing.
 */
export function parseIdentity(raw: unknown, seed: number, fallbackBirthday: number): Identity {
  const r = (raw ?? {}) as { name?: unknown; birthday?: unknown };
  const name = typeof r.name === "string" ? cleanName(r.name) : null;
  const birthday =
    typeof r.birthday === "number" && Number.isFinite(r.birthday) && r.birthday > 0
      ? Math.min(r.birthday, fallbackBirthday + 365 * DAY)
      : fallbackBirthday;
  return { name: name ?? suggestName(seededRandom(seed ^ 0x4e41_4d45)), birthday };
}

const DAY = 86_400_000;

/** Whole days since it hatched (by the calendar, so it ticks over at midnight). */
export function daysOld(birthday: number, now: number): number {
  const a = new Date(birthday);
  const b = new Date(now);
  const startA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const startB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.max(0, Math.round((startB - startA) / DAY));
}

/** "Hatched today", "1 day old", "12 days old"… */
export function ageText(birthday: number, now: number): string {
  const d = daysOld(birthday, now);
  return d === 0 ? "Hatched today" : d === 1 ? "1 day old" : `${d} days old`;
}

/** The hatch date, like "Nov 9, 2026". */
export function birthdayText(birthday: number): string {
  return new Date(birthday).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
