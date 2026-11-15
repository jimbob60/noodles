import { describe, expect, it } from "vitest";
import {
  ALL_DONE_BONUS,
  countGoal,
  freshGoals,
  GOAL_COINS,
  GOAL_KINDS,
  goalText,
  isDone,
  parseGoals,
  rollGoals,
  type DailyGoals,
} from "../src/care/goals";

const day = (d: number, h = 10) => new Date(2026, 10, d, h).getTime();

describe("daily goals", () => {
  it("rolls three different goals, the same all day, new the next day", () => {
    const a = rollGoals(day(15, 8), 42, true);
    expect(a.goals).toHaveLength(3);
    expect(new Set(a.goals.map((g) => g.kind)).size).toBe(3);
    expect(rollGoals(day(15, 22), 42, true)).toEqual(a);
    const days = new Set(
      [16, 17, 18, 19, 20].map((d) => JSON.stringify(rollGoals(day(d), 42, true).goals)),
    );
    expect(days.size).toBeGreaterThan(1);
  });

  it("keeps targets in range and only offers playdates when there's a friend", () => {
    for (let d = 1; d <= 30; d++) {
      for (const g of rollGoals(day(d), 7, false).goals) {
        const k = GOAL_KINDS.find((x) => x.id === g.kind)!;
        expect(k.needsFriend).toBeFalsy();
        expect(g.target).toBeGreaterThanOrEqual(k.min);
        expect(g.target).toBeLessThanOrEqual(k.max);
        expect(goalText(g)).not.toContain("{n}");
      }
    }
  });

  it("pays for each goal finished, and a bonus for all three", () => {
    let g: DailyGoals = {
      day: "2026-11-15",
      bonus: false,
      goals: [
        { kind: "feed", target: 2, count: 0 },
        { kind: "bath", target: 1, count: 0 },
        { kind: "favorite", target: 1, count: 0 },
      ],
    };
    let r = countGoal(g, "snack");
    expect(r.coins).toBe(0);
    g = r.goals;
    r = countGoal(g, "favorite"); // counts for "feed" and "favorite"
    expect(r.coins).toBe(2 * GOAL_COINS);
    g = r.goals;
    r = countGoal(g, "bath");
    expect(r.coins).toBe(GOAL_COINS + ALL_DONE_BONUS);
    expect(r.goals.bonus).toBe(true);
    expect(r.goals.goals.every(isDone)).toBe(true);
    // Done is done: nothing more to earn today.
    expect(countGoal(r.goals, "bath").coins).toBe(0);
  });

  it("never punishes a missed day: yesterday's just give way to fresh ones", () => {
    const old = rollGoals(day(10), 3, false);
    const today = freshGoals(old, day(15), 3, false);
    expect(today.day).not.toBe(old.day);
    expect(today.goals.every((g) => g.count === 0)).toBe(true);
    const half = countGoal(today, "coins", 10).goals;
    expect(freshGoals(half, day(15, 20), 3, false)).toBe(half);
  });

  it("reads saved goals carefully", () => {
    const g = rollGoals(day(15), 9, true);
    expect(parseGoals(JSON.parse(JSON.stringify(g)))).toEqual(g);
    expect(parseGoals(null)).toBeNull();
    expect(parseGoals({ day: "x", goals: [{ kind: "nope", target: 1, count: 0 }] })).toBeNull();
  });
});
