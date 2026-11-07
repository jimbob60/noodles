import { describe, expect, it } from "vitest";
import {
  advance,
  AWAKE_RATES,
  change,
  FLOOR,
  freshNeeds,
  lowestNeed,
  MAX,
  NEED_NAMES,
  parseNeeds,
  type NeedsState,
} from "../src/care/needs";

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 10, 7, 12);
const full = (now = T0): NeedsState => ({
  values: { fullness: 100, happiness: 100, energy: 100, cleanliness: 100 },
  lastSeen: now,
});

describe("needs over time", () => {
  it("drop at their hourly rates while awake", () => {
    const after = advance(full(), T0 + HOUR).values;
    for (const n of NEED_NAMES) expect(after[n]).toBeCloseTo(100 + AWAKE_RATES[n], 6);
  });

  it("come out the same whether updated every frame or all at once", () => {
    let stepped = full();
    for (let ms = 16; ms <= 10 * 60_000; ms += 16) stepped = advance(stepped, T0 + ms);
    const jumped = advance(full(), stepped.lastSeen);
    for (const n of NEED_NAMES) expect(stepped.values[n]).toBeCloseTo(jumped.values[n], 6);
  });

  it("never fall below the floor, even after a week away", () => {
    const after = advance(full(), T0 + 7 * 24 * HOUR).values;
    for (const n of NEED_NAMES) expect(after[n]).toBeGreaterThanOrEqual(FLOOR);
  });

  it("count at most 12 hours of time away", () => {
    const halfDay = advance(full(), T0 + 12 * HOUR).values;
    const week = advance(full(), T0 + 7 * 24 * HOUR).values;
    expect(week).toEqual(halfDay);
  });

  it("refill energy during sleep without going over the top", () => {
    const tired: NeedsState = { ...full(), values: { ...full().values, energy: 30 } };
    const rested = advance(tired, T0 + 3 * HOUR, true).values;
    expect(rested.energy).toBe(MAX);
    expect(rested.fullness).toBeGreaterThan(advance(full(), T0 + 3 * HOUR).values.fullness);
  });

  it("ignore a clock that jumps backwards", () => {
    const s = advance(full(), T0 - 5 * HOUR);
    expect(s.values).toEqual(full().values);
    expect(s.lastSeen).toBe(T0 - 5 * HOUR);
  });
});

describe("care actions", () => {
  it("raise needs but never past 100 or below the floor", () => {
    const s = change(freshNeeds(T0), { fullness: 50, happiness: -500 });
    expect(s.values.fullness).toBe(MAX);
    expect(s.values.happiness).toBe(FLOOR);
    expect(s.values.energy).toBe(90);
  });

  it("can tell which need wants attention most", () => {
    expect(lowestNeed({ fullness: 80, happiness: 40, energy: 60, cleanliness: 90 })).toBe(
      "happiness",
    );
  });
});

describe("saved needs", () => {
  it("come back exactly as saved, including bedtime", () => {
    for (const inBed of [false, true]) {
      const s = { ...advance(full(), T0 + 2 * HOUR), inBed };
      expect(parseNeeds(JSON.parse(JSON.stringify(s)), T0 + 3 * HOUR)).toEqual(s);
    }
  });

  it("count a night away in bed as sleep: Energy refills", () => {
    const tired: NeedsState = { ...full(), values: { ...full().values, energy: 20 }, inBed: true };
    const morning = advance(tired, T0 + 8 * HOUR, tired.inBed);
    expect(morning.values.energy).toBe(100);
    expect(morning.inBed).toBe(true);
  });

  it("survive broken or tampered data", () => {
    expect(parseNeeds(null, T0)).toEqual(freshNeeds(T0));
    expect(parseNeeds("garbage", T0)).toEqual(freshNeeds(T0));
    const odd = parseNeeds(
      { values: { fullness: 999, happiness: "x", energy: -4 }, lastSeen: T0 + HOUR },
      T0,
    );
    expect(odd.values.fullness).toBe(MAX);
    expect(odd.values.happiness).toBe(90);
    expect(odd.values.energy).toBe(FLOOR);
    // A save from the future can't skip the needs ahead.
    expect(odd.lastSeen).toBe(T0);
  });
});
