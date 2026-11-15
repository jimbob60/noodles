import { dayOf } from "./coins";
import { seededRandom } from "../noodle/look";

/**
 * Daily goals (phase 41): three small things to do each day, each paying a few coins, with a
 * bonus for doing all three. New goals come every day. Missing a day never costs anything: there
 * are no streaks to lose, and yesterday's unfinished goals simply go away.
 */

/** Something that happened in the den that a goal can count. */
export type GoalEvent =
  | "snack"
  | "favorite"
  | "petting"
  | "boop"
  | "ribbon"
  | "bath"
  | "catch"
  | "rested"
  | "friends"
  | "cat"
  | "photo"
  | "coins";

export interface GoalKind {
  id: string;
  /** What it says, with {n} for the target. */
  text: string;
  icon: string;
  /** Events that count toward it. */
  counts: GoalEvent[];
  /** The smallest and largest target it can roll. */
  min: number;
  max: number;
  /** Only offered when there's a second dragon to play with. */
  needsFriend?: boolean;
}

export const GOAL_KINDS: GoalKind[] = [
  {
    id: "feed",
    text: "Feed {n} snacks",
    icon: "🍜",
    counts: ["snack", "favorite"],
    min: 3,
    max: 5,
  },
  {
    id: "favorite",
    text: "Give its favorite food",
    icon: "😋",
    counts: ["favorite"],
    min: 1,
    max: 1,
  },
  {
    id: "pet",
    text: "Pet it until it purrs {n} times",
    icon: "💗",
    counts: ["petting"],
    min: 2,
    max: 3,
  },
  { id: "ball", text: "Boop a ball {n} times", icon: "⚽", counts: ["boop"], min: 4, max: 8 },
  {
    id: "ribbon",
    text: "Play ribbon chase {n} times",
    icon: "🎀",
    counts: ["ribbon"],
    min: 2,
    max: 3,
  },
  { id: "bath", text: "Give a bubble bath", icon: "🫧", counts: ["bath"], min: 1, max: 1 },
  {
    id: "catch",
    text: "Play a round of Noodle Catch",
    icon: "🥟",
    counts: ["catch"],
    min: 1,
    max: 1,
  },
  { id: "nap", text: "Tuck it in for a good rest", icon: "🌙", counts: ["rested"], min: 1, max: 1 },
  { id: "cat", text: "Pet Jinxy {n} times", icon: "🐈‍⬛", counts: ["cat"], min: 2, max: 4 },
  { id: "photo", text: "Snap a photo", icon: "📷", counts: ["photo"], min: 1, max: 1 },
  { id: "coins", text: "Earn {n} coins", icon: "🪙", counts: ["coins"], min: 30, max: 50 },
  {
    id: "friends",
    text: "Have {n} playdates with a friend",
    icon: "🤝",
    counts: ["friends"],
    min: 2,
    max: 3,
    needsFriend: true,
  },
];

/** Coins for each goal done, and the bonus for finishing all three. */
export const GOAL_COINS = 15;
export const ALL_DONE_BONUS = 25;
export const GOALS_PER_DAY = 3;

export interface Goal {
  kind: string;
  target: number;
  count: number;
}

export interface DailyGoals {
  /** The local day these are for, like "2026-11-15". */
  day: string;
  goals: Goal[];
  /** The all-three bonus has been paid. */
  bonus: boolean;
}

export const kindOf = (g: Goal): GoalKind | undefined => GOAL_KINDS.find((k) => k.id === g.kind);
export const goalText = (g: Goal): string =>
  (kindOf(g)?.text ?? "").replace("{n}", String(g.target));
export const isDone = (g: Goal): boolean => g.count >= g.target;

/** A number from a day like "2026-11-15", so the same day always rolls the same goals. */
function daySeed(day: string, seed: number): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < day.length; i++) h = Math.imul(h ^ day.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/** Today's three goals: different kinds, picked the same way all day. */
export function rollGoals(now: number, seed: number, hasFriend: boolean): DailyGoals {
  const day = dayOf(now);
  const r = seededRandom(daySeed(day, seed));
  const pool = GOAL_KINDS.filter((k) => hasFriend || !k.needsFriend);
  const goals: Goal[] = [];
  while (goals.length < GOALS_PER_DAY && pool.length) {
    const [k] = pool.splice(Math.floor(r() * pool.length), 1);
    goals.push({ kind: k.id, target: k.min + Math.floor(r() * (k.max - k.min + 1)), count: 0 });
  }
  return { day, goals, bonus: false };
}

/** Yesterday's goals (or none) give way to today's. Today's are kept as they are. */
export function freshGoals(
  g: DailyGoals | null,
  now: number,
  seed: number,
  hasFriend: boolean,
): DailyGoals {
  return g && g.day === dayOf(now) ? g : rollGoals(now, seed, hasFriend);
}

/**
 * Counts something that happened. Returns the new goals, how many coins they pay now (a goal
 * just finished, and the bonus if that was the last one), and which goals just finished.
 */
export function countGoal(
  g: DailyGoals,
  event: GoalEvent,
  amount = 1,
): { goals: DailyGoals; coins: number; finished: Goal[] } {
  const finished: Goal[] = [];
  const goals = g.goals.map((goal) => {
    if (isDone(goal) || !kindOf(goal)?.counts.includes(event)) return goal;
    const next = { ...goal, count: Math.min(goal.target, goal.count + amount) };
    if (isDone(next)) finished.push(next);
    return next;
  });
  if (!finished.length) return { goals: { ...g, goals }, coins: 0, finished };
  const allDone = !g.bonus && goals.every(isDone);
  return {
    goals: { ...g, goals, bonus: g.bonus || allDone },
    coins: finished.length * GOAL_COINS + (allDone ? ALL_DONE_BONUS : 0),
    finished,
  };
}

/** Reads saved goals, or null if they're missing or broken (fresh ones are rolled then). */
export function parseGoals(raw: unknown): DailyGoals | null {
  const g = raw as Partial<DailyGoals> | null;
  if (!g || typeof g !== "object" || typeof g.day !== "string" || !Array.isArray(g.goals))
    return null;
  const goals: Goal[] = [];
  for (const item of g.goals) {
    const x = item as Partial<Goal> | null;
    if (!x || !GOAL_KINDS.some((k) => k.id === x.kind)) return null;
    const target =
      typeof x.target === "number" ? Math.max(1, Math.min(99, Math.round(x.target))) : 1;
    const count =
      typeof x.count === "number" ? Math.max(0, Math.min(target, Math.round(x.count))) : 0;
    goals.push({ kind: x.kind as string, target, count });
  }
  if (goals.length !== GOALS_PER_DAY) return null;
  return { day: g.day, goals, bonus: g.bonus === true };
}
