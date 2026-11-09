import { describe, expect, it } from "vitest";
import {
  BOOP_ENERGY,
  BOOP_GRIME,
  BOOP_LOVE,
  BOOPS_PER_GAME,
  PLAY_ENERGY,
  Toys,
  type Playful,
} from "../src/ui/toys";

const W = 1280;
const H = 800;
const lively = { fullness: 70, happiness: 50, energy: 80, cleanliness: 70 };
const sleepy = { ...lively, energy: PLAY_ENERGY - 5 };
const up = Object.assign((x = 0, y = 0) => ({ x, y, down: false }), {
  x: 0,
  y: 0,
  down: false as const,
});

function fakeDragon(mouth = { x: -999, y: -999 }) {
  const log: string[] = [];
  const d: Playful & { log: string[]; mouth: { x: number; y: number } } = {
    mouth,
    headRadius: 30,
    lure: null,
    boop: () => void log.push("boop"),
    refuse: () => void log.push("refuse"),
    log,
  };
  return d;
}

/** Grabs a toy from its slot and drags it along a path of points. */
function grab(
  toys: Toys,
  toy: "ball" | "ribbon",
  path: { x: number; y: number }[],
  dragon: Playful,
  needs = lively,
) {
  toys.update(1 / 60, up, null, dragon, needs, W, H);
  const slot = toys.slots().find((s) => s.toy === toy)!;
  toys.update(1 / 60, { x: slot.x, y: slot.y, down: true }, slot, dragon, needs, W, H);
  for (const p of path) toys.update(1 / 60, { ...p, down: true }, null, dragon, needs, W, H);
}

describe("ball", () => {
  it("can be thrown, then bounces about and stays on screen", () => {
    const toys = new Toys();
    const d = fakeDragon();
    grab(
      toys,
      "ball",
      [
        { x: 900, y: 600 },
        { x: 700, y: 400 },
        { x: 500, y: 200 },
      ],
      d,
    );
    toys.update(1 / 60, up, null, d, lively, W, H); // let go
    expect(toys.ball).not.toBeNull();
    expect(toys.ball!.vx).toBeLessThan(0); // flying the way it was thrown
    for (let i = 0; i < 600 && toys.ball; i++) {
      toys.update(1 / 60, up, null, d, lively, W, H);
      if (!toys.ball || toys.ball.home) continue;
      expect(toys.ball.x).toBeGreaterThanOrEqual(0);
      expect(toys.ball.x).toBeLessThanOrEqual(W);
      expect(toys.ball.y).toBeGreaterThanOrEqual(0);
      expect(toys.ball.y).toBeLessThanOrEqual(H);
    }
  });

  it("is chased by a lively dragon, and a boop gives Love and costs a little Energy", () => {
    const toys = new Toys();
    const d = fakeDragon();
    grab(toys, "ball", [{ x: 640, y: 400 }], d);
    toys.update(1 / 60, up, null, d, lively, W, H);
    expect(d.lure).not.toBeNull();
    d.mouth = { x: toys.ball!.x, y: toys.ball!.y + 10 };
    const r = toys.update(1 / 60, up, null, d, lively, W, H);
    expect(d.log).toEqual(["boop"]);
    expect(r.love).toBe(BOOP_LOVE);
    expect(r.energy).toBe(-BOOP_ENERGY);
    expect(r.grime).toBe(-BOOP_GRIME); // playing is a bit messy
    expect(toys.ball!.vy).toBeLessThan(0); // booped up into the air
  });

  it("ends the game after enough boops, and the ball drifts home", () => {
    const toys = new Toys();
    const d = fakeDragon();
    grab(toys, "ball", [{ x: 640, y: 400 }], d);
    toys.update(1 / 60, up, null, d, lively, W, H);
    for (let i = 0; i < 4000 && toys.ball && !toys.ball.home; i++) {
      d.mouth = { x: toys.ball.x, y: toys.ball.y }; // a very good player
      toys.update(1 / 60, up, null, d, lively, W, H);
    }
    expect(d.log.filter((l) => l === "boop")).toHaveLength(BOOPS_PER_GAME);
    for (let i = 0; i < 300; i++) toys.update(1 / 60, up, null, d, lively, W, H);
    expect(toys.ball).toBeNull(); // home in its bubble
  });

  it("gets a 'not now' from a sleepy dragon, who doesn't chase", () => {
    const toys = new Toys();
    const d = fakeDragon();
    grab(toys, "ball", [{ x: 640, y: 400 }], d, sleepy);
    toys.update(1 / 60, up, null, d, sleepy, W, H);
    expect(d.log[0]).toBe("refuse");
    expect(d.lure).toBeNull();
  });
});

describe("ribbon", () => {
  it("has a streamer whose tip the dragon chases", () => {
    const toys = new Toys();
    const d = fakeDragon();
    const path = Array.from({ length: 30 }, (_, i) => ({
      x: 400 + i * 15,
      y: 400 + Math.sin(i / 3) * 80,
    }));
    grab(toys, "ribbon", path, d);
    expect(toys.streamer).not.toBeNull();
    expect(d.lure).toEqual(toys.ribbonTip);
  });

  it("fills Love while the dragon keeps up with a moving ribbon", () => {
    const toys = new Toys();
    const d = fakeDragon();
    toys.update(1 / 60, up, null, d, lively, W, H);
    const slot = toys.slots().find((s) => s.toy === "ribbon")!;
    toys.update(1 / 60, { x: slot.x, y: slot.y, down: true }, slot, d, lively, W, H);
    let love = 0;
    for (let i = 0; i < 120; i++) {
      const tip = toys.ribbonTip!;
      d.mouth = { x: tip.x + 5, y: tip.y }; // right on its tail
      const r = toys.update(
        1 / 60,
        { x: 400 + Math.sin(i / 8) * 200, y: 400, down: true },
        null,
        d,
        lively,
        W,
        H,
      );
      love += r.love;
    }
    expect(love).toBeGreaterThan(3);
  });

  it("lets go of the finger when released", () => {
    const toys = new Toys();
    const d = fakeDragon();
    grab(toys, "ribbon", [{ x: 500, y: 400 }], d);
    const r = toys.update(1 / 60, up, null, d, lively, W, H);
    expect(r.busy).toBe(true); // the release frame still belongs to the toy
    expect(toys.held).toBeNull();
    expect(toys.update(1 / 60, up, null, d, lively, W, H).busy).toBe(false);
  });
});

describe("different balls", () => {
  it("switch with a tap on the ball bubble, among the balls you own", async () => {
    const toys = new Toys();
    toys.owned = ["beach", "star", "jelly"];
    const d = fakeDragon();
    toys.update(1 / 60, up, null, d, lively, W, H);
    const slot = toys.slots().find((s) => s.toy === "ball")!;
    for (const want of ["star", "jelly", "beach"]) {
      toys.update(1 / 60, { x: slot.x, y: slot.y, down: true }, slot, d, lively, W, H);
      toys.update(1 / 60, up(slot.x, slot.y), null, d, lively, W, H);
      expect(toys.ballKind).toBe(want);
      expect(toys.ball).toBeNull(); // a tap doesn't throw
    }
  });

  it("each play differently: the bubble ball falls far slower than the yarn ball", () => {
    const drop = (kind: "bubble" | "yarn") => {
      const toys = new Toys();
      toys.owned = ["beach", kind];
      toys.ballKind = kind;
      const d = fakeDragon();
      // Hold it still for a moment so it is dropped, not thrown.
      grab(
        toys,
        "ball",
        Array.from({ length: 40 }, () => ({ x: 640, y: 200 })),
        d,
        { ...lively, energy: 10 },
      );
      toys.update(1 / 60, up, null, d, { ...lively, energy: 10 }, W, H);
      for (let i = 0; i < 30; i++)
        toys.update(1 / 60, up, null, d, { ...lively, energy: 10 }, W, H);
      return toys.ball!.y;
    };
    expect(drop("yarn")).toBeGreaterThan(drop("bubble") + 50);
  });
});
