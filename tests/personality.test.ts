import { describe, expect, it } from "vitest";
import { CLASSIC_GENES, genesFromSeed, type Genes, type Personality } from "../src/noodle/genes";
import { expressed, mainTrait, temperOf } from "../src/noodle/personality";
import { Dragon } from "../src/noodle/dragon";
import { seededRandom } from "../src/noodle/look";

const world = { width: 1280, height: 800, unit: 16 };
const idle = { x: 0, y: 0, down: false };
const only = (trait: keyof Personality): Genes => ({
  ...CLASSIC_GENES,
  personality: { playful: 0.1, sleepy: 0.1, greedy: 0.1, shy: 0.1, [trait]: 0.95 },
});

/** Leaves a dragon alone for a while and notes what it does. */
function watch(genes: Genes, seconds: number) {
  const d = new Dragon(640, 400, 16, world, genes, seededRandom(7));
  const log = { asleep: 0, zoomies: 0, yawns: 0, begs: 0, edge: 0, distance: 0 };
  let prev = { ...d.spine.head };
  let wasExcited = false;
  let wasYawning = false;
  let wasBegging = false;
  for (let t = 0; t < seconds * 30; t++) {
    d.update(1 / 30, idle, world);
    const h = d.spine.head;
    log.distance += Math.hypot(h.x - prev.x, h.y - prev.y);
    prev = { ...h };
    if (d.asleep) log.asleep += 1 / 30;
    const excited = (d as unknown as { exciteLeft: number }).exciteLeft > 0;
    if (excited && !wasExcited) log.zoomies++;
    wasExcited = excited;
    const yawning = d.face.yawnLeft > 0;
    if (yawning && !wasYawning) log.yawns++;
    wasYawning = yawning;
    const begging = d.thinkingOf === "fullness";
    if (begging && !wasBegging) log.begs++;
    wasBegging = begging;
    if (h.x < 1280 * 0.22 || h.x > 1280 * 0.78 || h.y > 800 * 0.75) log.edge += 1 / 30;
  }
  return log;
}

describe("personalities", () => {
  it("each dragon has one clear main trait", () => {
    expect(mainTrait({ playful: 0.2, sleepy: 0.9, greedy: 0.5, shy: 0.3 })).toBe("sleepy");
    const p = { playful: 0.9, sleepy: 0.8, greedy: 0.1, shy: 0.3 };
    expect(expressed(p, "playful")).toBeGreaterThan(0.8);
    expect(expressed(p, "sleepy")).toBe(0); // second place shows at half strength: not at all here
    expect(expressed(p, "shy")).toBe(0);
  });

  it("all four personalities turn up among wild dragons", () => {
    const seen = new Set(
      Array.from({ length: 100 }, (_, i) => mainTrait(genesFromSeed(i + 1).personality)),
    );
    expect(seen).toEqual(new Set(["playful", "sleepy", "greedy", "shy"]));
  });

  it("a playful dragon swims more and does surprise zoomies", () => {
    const playful = watch(only("playful"), 240);
    const sleepy = watch(only("sleepy"), 240);
    expect(playful.zoomies).toBeGreaterThanOrEqual(5);
    expect(sleepy.zoomies).toBe(0);
    expect(playful.distance).toBeGreaterThan(sleepy.distance * 1.5);
  });

  it("a sleepy dragon naps much more and yawns", () => {
    const sleepy = watch(only("sleepy"), 300);
    const playful = watch(only("playful"), 300);
    expect(sleepy.asleep).toBeGreaterThan(playful.asleep * 2 + 20);
    expect(sleepy.yawns).toBeGreaterThanOrEqual(3);
  });

  it("a greedy dragon begs for snacks and rushes to food", () => {
    const greedy = watch(only("greedy"), 240);
    expect(greedy.begs).toBeGreaterThanOrEqual(4);
    expect(watch(only("shy"), 240).begs).toBe(0);
    expect(temperOf(only("greedy").personality).lureBoost).toBeGreaterThan(1.4);
  });

  it("a shy dragon keeps to the edges, keeps its distance, and blushes", () => {
    const shy = watch(only("shy"), 300);
    const playful = watch(only("playful"), 300);
    expect(shy.edge).toBeGreaterThan(playful.edge * 1.5);
    // A finger held still near its face: it stops short and blushes.
    const d = new Dragon(640, 400, 16, world, only("shy"), seededRandom(3));
    const bold = new Dragon(640, 400, 16, world, only("playful"), seededRandom(3));
    const finger = { x: 760, y: 400, down: true };
    for (let t = 0; t < 90; t++) {
      d.update(1 / 30, finger, world);
      bold.update(1 / 30, finger, world);
    }
    const gap = (x: Dragon) => Math.hypot(x.spine.head.x - 760, x.spine.head.y - 400);
    expect(gap(d)).toBeGreaterThan(gap(bold) + d.headRadius);
    expect(d.face.blush).toBeGreaterThan(0.5);
    expect(bold.face.blush).toBeLessThan(0.05);
  });
});
