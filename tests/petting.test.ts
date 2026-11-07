import { describe, expect, it } from "vitest";
import {
  PURR_GRACE,
  GIGGLE_LOVE,
  MAX_LOVE_PER_SECOND,
  Petting,
  TICKLE_RUB,
  tickleSpots,
} from "../src/care/petting";

// A pretend dragon lying along y = 400 from x = 400 (nose) to x = 800 (tail tip).
const spotAt = (x: number, y: number) =>
  Math.abs(y - 400) < 30 && x >= 400 && x <= 800 ? (x - 400) / 400 : null;

/** Rubs back and forth over [fromX, toX] for `seconds`, returning the totals. */
function rub(p: Petting, fromX: number, toX: number, seconds: number, tickles: number[] = []) {
  let love = 0;
  let sparkles = 0;
  let tickled = 0;
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {
    const x = fromX + (toX - fromX) * (0.5 - 0.5 * Math.cos((i / 15) * Math.PI));
    const r = p.update(
      1 / 60,
      { x, y: 400, down: true },
      i === 0 ? { x, y: 400 } : null,
      spotAt,
      tickles,
    );
    love += r.love;
    sparkles += r.sparkles.length;
    if (r.tickled) tickled++;
  }
  return { love, sparkles, tickled };
}

describe("petting", () => {
  it("starts only when the press lands on the dragon", () => {
    const p = new Petting();
    expect(
      p.update(1 / 60, { x: 100, y: 100, down: true }, { x: 100, y: 100 }, spotAt, []).active,
    ).toBe(false);
    expect(
      p.update(1 / 60, { x: 500, y: 400, down: true }, { x: 500, y: 400 }, spotAt, []).active,
    ).toBe(true);
    expect(p.update(1 / 60, { x: 500, y: 400, down: false }, null, spotAt, []).active).toBe(false);
  });

  it("builds a purr and fills Love while rubbing, with sparkles", () => {
    const p = new Petting();
    const r = rub(p, 450, 650, 2);
    expect(p.purr).toBeGreaterThan(0.9);
    expect(r.love).toBeGreaterThan(5);
    expect(r.sparkles).toBeGreaterThan(5);
  });

  it("never gives more Love than the per-second cap, however wild the rubbing", () => {
    const p = new Petting();
    const r = rub(p, 400, 800, 3); // big fast strokes
    expect(r.love).toBeLessThanOrEqual(MAX_LOVE_PER_SECOND * 3 + 1e-9);
  });

  it("keeps purring when the finger reports movement only now and then", () => {
    // Small movements on only one update in ten, like a busy screen or a slow touch sensor.
    const p = new Petting();
    p.update(1 / 60, { x: 500, y: 400, down: true }, { x: 500, y: 400 }, spotAt, []);
    let x = 500;
    for (let i = 1; i < 300; i++) {
      if (i % 10 === 0) x = x === 500 ? 520 : 500;
      p.update(1 / 60, { x, y: 400, down: true }, null, spotAt, []);
    }
    expect(p.purr).toBeGreaterThan(0.9);
    expect(PURR_GRACE).toBeGreaterThan(0);
  });

  it("lets the purr fade once the rubbing stops", () => {
    const p = new Petting();
    rub(p, 450, 650, 2);
    for (let i = 0; i < 180; i++) p.update(1 / 60, { x: 0, y: 0, down: false }, null, spotAt, []);
    expect(p.purr).toBe(0);
  });

  it("gives nothing for a press that slides off the dragon", () => {
    const p = new Petting();
    p.update(1 / 60, { x: 500, y: 400, down: true }, { x: 500, y: 400 }, spotAt, []);
    let love = 0;
    for (let i = 1; i < 60; i++)
      love += p.update(1 / 60, { x: 500, y: 100 + i * 2, down: true }, null, spotAt, []).love;
    expect(love).toBe(0);
  });

  it("giggles when a tickle spot is rubbed, and not elsewhere", () => {
    const spot = 0.5; // the middle of the body, at x = 600
    const elsewhere = rub(new Petting(), 420, 480, 3, [spot]);
    expect(elsewhere.tickled).toBe(0);
    const p = new Petting();
    const r = rub(p, 580, 620, 3, [spot]);
    expect(r.tickled).toBeGreaterThan(0);
    expect(r.love).toBeGreaterThanOrEqual(GIGGLE_LOVE);
    expect(TICKLE_RUB).toBeGreaterThan(0);
  });

  it("gives every dragon one or two tickle spots that never change", () => {
    for (let seed = 1; seed < 200; seed++) {
      const spots = tickleSpots(seed);
      expect(spots).toEqual(tickleSpots(seed));
      expect(spots.length).toBeGreaterThanOrEqual(1);
      expect(spots.length).toBeLessThanOrEqual(2);
      for (const t of spots) expect(t >= 0 && t <= 1).toBe(true);
    }
  });
});
