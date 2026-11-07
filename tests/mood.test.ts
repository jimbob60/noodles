import { describe, expect, it } from "vitest";
import { moodFrom, needOf, PACE } from "../src/care/mood";
import { IdleBrain } from "../src/noodle/idleBrain";
import { Swimmer } from "../src/noodle/swimmer";

const fine = { fullness: 80, happiness: 80, energy: 80, cleanliness: 80 };

describe("moods", () => {
  it("match the needs", () => {
    expect(moodFrom(fine)).toBe("happy");
    expect(moodFrom({ ...fine, energy: 60 })).toBe("content");
    expect(moodFrom({ ...fine, fullness: 30 })).toBe("hungry");
    expect(moodFrom({ ...fine, energy: 20 })).toBe("tired");
    expect(moodFrom({ ...fine, happiness: 25 })).toBe("lonely");
    expect(moodFrom({ ...fine, cleanliness: 15 })).toBe("grubby");
  });

  it("follow the lowest need when two are low", () => {
    expect(moodFrom({ fullness: 35, happiness: 80, energy: 70, cleanliness: 30 })).toBe("grubby");
    expect(moodFrom({ fullness: 20, happiness: 30, energy: 80, cleanliness: 80 })).toBe("hungry");
  });

  it("make a long-neglected dragon simply sleepy, never sad", () => {
    expect(moodFrom({ fullness: 15, happiness: 15, energy: 15, cleanliness: 15 })).toBe("tired");
    expect(moodFrom({ fullness: 20, happiness: 25, energy: 80, cleanliness: 30 })).toBe("tired");
  });

  it("know which need each mood is about", () => {
    expect(needOf("hungry")).toBe("fullness");
    expect(needOf("tired")).toBe("energy");
    expect(needOf("happy")).toBeNull();
  });

  it("make a tired dragon nap far more than a happy one", () => {
    const world = { width: 1280, height: 800, unit: 14 };
    const napTime = (mood: keyof typeof PACE) => {
      let seed = 3;
      const brain = new IdleBrain(() => (seed = (seed * 16807) % 2147483647) / 2147483647);
      brain.pace = PACE[mood];
      const s = new Swimmer(640, 400, 0);
      brain.start("wander", s, world);
      let resting = 0;
      for (let i = 0; i < 60 * 600; i++) {
        brain.update(1 / 60, s, world);
        if (brain.mode === "rest") resting++;
      }
      return resting / (60 * 600);
    };
    expect(napTime("tired")).toBeGreaterThan(napTime("happy") * 2);
  });
});
