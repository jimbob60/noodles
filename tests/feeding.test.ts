import { describe, expect, it } from "vitest";
import type { FoodId } from "../src/care/food";
import { Feeding, type Feedable } from "../src/ui/feeding";

const W = 1280;
const H = 800;
const hungry = { fullness: 50, happiness: 50, energy: 50, cleanliness: 50 };
const stuffed = { ...hungry, fullness: 100 };

function fakeDragon(mouthX = 700, mouthY = 400) {
  const log: string[] = [];
  const dragon: Feedable & { log: string[] } = {
    mouth: { x: mouthX, y: mouthY },
    headRadius: 30,
    lure: null,
    eat: (f: FoodId) => void log.push(`eat ${f}`),
    refuse: () => void log.push("refuse"),
    log,
  };
  return dragon;
}

/** Presses on a tray slot, then drags to (x, y), and returns the tray and its last result. */
function dragFood(food: FoodId, x: number, y: number, needs = hungry, dragon = fakeDragon()) {
  const tray = new Feeding();
  tray.update(1 / 60, { x: 0, y: 0, down: false }, false, dragon, needs, W, H); // lay out
  const slot = tray.slots().find((s) => s.food === food)!;
  let result = tray.update(1 / 60, { x: slot.x, y: slot.y, down: true }, true, dragon, needs, W, H);
  // Drag in steps; the food floats 34px above the finger.
  for (let i = 1; i <= 10; i++) {
    const fx = slot.x + ((x - slot.x) * i) / 10;
    const fy = slot.y + ((y + 34 - slot.y) * i) / 10;
    result = tray.update(1 / 60, { x: fx, y: fy, down: true }, false, dragon, needs, W, H);
    if (result.event) break;
  }
  return { tray, result, dragon };
}

describe("feeding", () => {
  it("picks up a food from its tray slot, and takes over the finger", () => {
    const { tray, dragon } = dragFood("fish", 300, 300);
    expect(tray.held?.food).toBe("fish");
    expect(dragon.lure).not.toBeNull();
  });

  it("feeds the dragon when the food reaches its mouth", () => {
    const { result, dragon, tray } = dragFood("dumpling", 700, 400);
    expect(result.event).toEqual({ ate: "dumpling" });
    expect(dragon.log).toEqual(["eat dumpling"]);
    expect(tray.held).toBeNull();
    expect(dragon.lure).toBeNull();
  });

  it("gets a polite no-thanks from a full dragon, and keeps the food", () => {
    const { result, dragon, tray } = dragFood("noodles", 700, 400, stuffed);
    expect(result.event).toBeNull();
    expect(dragon.log).toEqual(["refuse"]);
    expect(tray.held?.food).toBe("noodles");
  });

  it("floats the food back to the tray when dropped away from the mouth", () => {
    const { tray, dragon } = dragFood("fish", 300, 300);
    const after = tray.update(1 / 60, { x: 300, y: 334, down: false }, false, dragon, hungry, W, H);
    expect(after.busy).toBe(false);
    expect(tray.held).toBeNull();
    expect(dragon.lure).toBeNull();
    expect(dragon.log).toEqual([]);
  });

  it("ignores presses that miss the tray", () => {
    const tray = new Feeding();
    const dragon = fakeDragon();
    tray.update(1 / 60, { x: 0, y: 0, down: false }, false, dragon, hungry, W, H);
    const r = tray.update(1 / 60, { x: 640, y: 300, down: true }, true, dragon, hungry, W, H);
    expect(r.busy).toBe(false);
    expect(tray.held).toBeNull();
  });
});
