import { describe, expect, it } from "vitest";
import {
  COUNTDOWN,
  coinsFor,
  MAX_ROUND_COINS,
  NoodleCatch,
  pace,
  ROUND_TIME,
} from "../src/game/noodleCatch";

const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** Plays a whole round. A "perfect" player keeps the mouth under the lowest dumpling. */
function play(perfect: boolean) {
  const g = new NoodleCatch(1280, 800, seeded(4));
  let mouth = { x: 640, y: 600 };
  for (let i = 0; i < (COUNTDOWN + ROUND_TIME + 1) * 60; i++) {
    if (perfect) {
      const next = g.fallers.filter((f) => f.landed === 0).sort((a, b) => b.y - a.y)[0];
      if (next) mouth = { x: next.x, y: Math.min(next.y + 20, 640) };
    }
    g.update(1 / 60, mouth, 40);
  }
  return g;
}

describe("Noodle Catch", () => {
  it("counts down, plays for the round, then ends", () => {
    const g = new NoodleCatch(1280, 800, seeded(1));
    g.update(COUNTDOWN - 0.1, { x: 0, y: 0 }, 40);
    expect(g.phase).toBe("countdown");
    for (let i = 0; i < 20; i++) g.update(1 / 60, { x: 0, y: 0 }, 40);
    expect(g.phase).toBe("playing");
    for (let i = 0; i < ROUND_TIME * 60 + 10; i++) g.update(1 / 60, { x: -999, y: -999 }, 40);
    expect(g.phase).toBe("done");
    expect(g.score).toBe(0); // a dragon who never moves catches nothing, and nothing bad happens
  });

  it("lets a good player catch lots, worth a fair handful of coins", () => {
    const g = play(true);
    expect(g.caught).toBeGreaterThan(40);
    expect(coinsFor(g.score)).toBe(MAX_ROUND_COINS);
  });

  it("gets a little faster and busier as the round goes on", () => {
    expect(pace(1).spawnEvery).toBeLessThan(pace(0).spawnEvery);
    expect(pace(1).fallSpeed).toBeGreaterThan(pace(0).fallSpeed);
  });

  it("gives one coin for every two points, up to the cap", () => {
    expect(coinsFor(0)).toBe(0);
    expect(coinsFor(9)).toBe(4);
    expect(coinsFor(500)).toBe(MAX_ROUND_COINS);
  });
});
