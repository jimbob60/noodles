import { describe, expect, it } from "vitest";
import { CORNER_BUTTONS, cornerButton } from "../src/ui/layout";
import { bedButton } from "../src/ui/bedtime";
import { spongeButton } from "../src/ui/bath";

const SIZES: [number, number][] = [
  [1280, 800],
  [800, 1280],
  [915, 412],
  [800, 360],
  [740, 340],
  [640, 300],
  [390, 844],
];

describe("corner buttons", () => {
  it("stay where they were on a roomy tablet", () => {
    for (let i = 0; i < CORNER_BUTTONS; i++) {
      const b = cornerButton(i, 1280, 800);
      expect(b.r).toBe(18);
      expect(b.y).toBe(44 + 18 + i * 46);
      expect(b.x).toBe(1280 - 32);
    }
  });

  it("never overlap each other or the sponge and moon buttons, even on a phone on its side", () => {
    for (const [w, h] of SIZES) {
      const below = [bedButton(w, h), spongeButton(w, h)];
      for (let i = 0; i < CORNER_BUTTONS; i++) {
        const b = cornerButton(i, w, h);
        expect(b.r).toBeGreaterThan(10);
        for (let j = 0; j < i; j++) {
          const a = cornerButton(j, w, h);
          expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(a.r + b.r);
        }
        for (const t of below) expect(Math.hypot(b.x - t.x, b.y - t.y)).toBeGreaterThan(b.r + t.r);
      }
    }
  });
});
