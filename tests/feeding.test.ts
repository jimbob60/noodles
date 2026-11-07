import { describe, expect, it } from "vitest";
import type { FoodId } from "../src/care/food";
import { Feeding, LINGER_TIME, RETURN_TIME, type Feedable } from "../src/ui/feeding";

const W = 1280;
const H = 800;
const hungry = { fullness: 50, happiness: 50, energy: 50, cleanliness: 50 };
const stuffed = { ...hungry, fullness: 100 };

function fakeDragon(mouthX = 700, mouthY = 400) {
  const log: string[] = [];
  const dragon: Feedable & { log: string[]; mouth: { x: number; y: number } } = {
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
  tray.update(1 / 60, { x: 0, y: 0, down: false }, null, dragon, needs, W, H); // lay out
  const slot = tray.slots().find((s) => s.food === food)!;
  let result = tray.update(1 / 60, { x: slot.x, y: slot.y, down: true }, slot, dragon, needs, W, H);
  // Drag in steps; the food floats 34px above the finger.
  for (let i = 1; i <= 10; i++) {
    const fx = slot.x + ((x - slot.x) * i) / 10;
    const fy = slot.y + ((y + 34 - slot.y) * i) / 10;
    result = tray.update(1 / 60, { x: fx, y: fy, down: true }, null, dragon, needs, W, H);
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

  it("lets dropped food float, and a hungry dragon goes after it", () => {
    const { tray, dragon } = dragFood("fish", 300, 300);
    const step = (down = false) =>
      tray.update(1 / 60, { x: 300, y: 334, down }, null, dragon, hungry, W, H);
    step(false); // let go
    expect(tray.held).toBeNull();
    expect(tray.floating).toHaveLength(1);
    // A second later it's still floating, and the dragon is swimming to it.
    for (let i = 0; i < 60; i++) step();
    expect(tray.floating).toHaveLength(1);
    const f = tray.floating[0];
    expect(dragon.lure).toEqual({ x: f.x, y: f.y });
    // The dragon's mouth reaches the floating fish: munch.
    dragon.mouth = { x: f.x, y: f.y };
    const r = step();
    expect(r.event).toEqual({ ate: "fish" });
    expect(tray.floating).toHaveLength(0);
    expect(dragon.log).toEqual(["eat fish"]);
  });

  it("lets a full dragon's food linger, then drift slowly home to its bubble", () => {
    const { tray, dragon } = dragFood("dumpling", 300, 300, stuffed);
    const step = () =>
      tray.update(1 / 60, { x: 300, y: 334, down: false }, null, dragon, stuffed, W, H);
    step();
    expect(dragon.lure).toBeNull(); // not interested
    for (let i = 0; i < 60 * (LINGER_TIME + RETURN_TIME / 2); i++) step();
    expect(tray.floating).toHaveLength(1); // still on its slow way home
    expect(tray.floating[0].home).not.toBeNull();
    for (let i = 0; i < 60 * RETURN_TIME; i++) step();
    expect(tray.floating).toHaveLength(0); // home
    expect(dragon.log).toEqual([]);
  });

  it("keeps floating food on screen even when flung hard", () => {
    const tray = new Feeding();
    const dragon = fakeDragon(-999, -999);
    tray.update(1 / 60, { x: 0, y: 0, down: false }, null, dragon, hungry, W, H);
    const slot = tray.slots()[0];
    tray.update(1 / 60, { x: slot.x, y: slot.y, down: true }, slot, dragon, hungry, W, H);
    for (let i = 1; i <= 5; i++) {
      tray.update(
        1 / 60,
        { x: slot.x + i * 200, y: slot.y - i * 100, down: true },
        null,
        dragon,
        hungry,
        W,
        H,
      );
    }
    tray.update(1 / 60, { x: 1200, y: 100, down: false }, null, dragon, hungry, W, H);
    for (let i = 0; i < 600; i++) {
      tray.update(1 / 60, { x: 0, y: 0, down: false }, null, dragon, hungry, W, H);
      for (const f of tray.floating) {
        expect(f.x).toBeGreaterThanOrEqual(0);
        expect(f.x).toBeLessThanOrEqual(W);
        expect(f.y).toBeGreaterThanOrEqual(0);
        expect(f.y).toBeLessThanOrEqual(H);
      }
    }
  });

  it("lets the finger steer the dragon even while food is floating", () => {
    const { tray, dragon } = dragFood("fish", 300, 300);
    tray.update(1 / 60, { x: 300, y: 334, down: false }, null, dragon, hungry, W, H);
    tray.update(1 / 60, { x: 640, y: 300, down: true }, { x: 640, y: 300 }, dragon, hungry, W, H);
    expect(dragon.lure).toBeNull();
  });

  it("grabs the food even if a quick flick has left the bubble by the next frame", () => {
    const tray = new Feeding();
    const dragon = fakeDragon();
    tray.update(1 / 60, { x: 0, y: 0, down: false }, null, dragon, hungry, W, H);
    const slot = tray.slots()[1];
    // The press began on the dumpling, but the finger is already far away.
    tray.update(
      1 / 60,
      { x: slot.x + 200, y: slot.y - 150, down: true },
      slot,
      dragon,
      hungry,
      W,
      H,
    );
    expect(tray.held?.food).toBe("dumpling");
  });

  it("ignores presses that miss the tray", () => {
    const tray = new Feeding();
    const dragon = fakeDragon();
    tray.update(1 / 60, { x: 0, y: 0, down: false }, null, dragon, hungry, W, H);
    const r = tray.update(
      1 / 60,
      { x: 640, y: 300, down: true },
      { x: 640, y: 300 },
      dragon,
      hungry,
      W,
      H,
    );
    expect(r.busy).toBe(false);
    expect(tray.held).toBeNull();
  });
});
