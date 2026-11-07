import { describe, expect, it } from "vitest";
import {
  addDecor,
  drawOrder,
  FLOOR_BAND,
  MAX_DECOR,
  moveDecor,
  parseDecor,
  recolorDecor,
  removeDecor,
  type DecorItem,
} from "../src/den/decor";

describe("decorations", () => {
  it("can be placed, moved, recolored and put away", () => {
    let d: DecorItem[] = [];
    d = addDecor(d, "lantern", 0.3, 0.3);
    d = addDecor(d, "plant", 0.6, 0.85);
    expect(d).toHaveLength(2);
    d = moveDecor(d, 0, 0.7, 0.2);
    expect(d[0]).toMatchObject({ x: 0.7, y: 0.2 });
    d = recolorDecor(d, 1);
    d = recolorDecor(d, 1);
    d = recolorDecor(d, 1);
    expect(d[1].color).toBe(0); // three colors, round and round
    d = removeDecor(d, 0);
    expect(d.map((x) => x.kind)).toEqual(["plant"]);
  });

  it("keep floor things on the floor, while lanterns can float", () => {
    const cushion = addDecor([], "cushion", 0.5, 0.2)[0];
    expect(cushion.y).toBeGreaterThanOrEqual(FLOOR_BAND[0]);
    const lantern = addDecor([], "lantern", 0.5, 0.2)[0];
    expect(lantern.y).toBeCloseTo(0.2);
    const off = moveDecor([lantern], 0, -3, 9)[0];
    expect(off.x).toBeGreaterThan(0);
    expect(off.y).toBeLessThan(1);
  });

  it("stop at a cozy limit", () => {
    let d: DecorItem[] = [];
    for (let i = 0; i < 30; i++) d = addDecor(d, "jar", 0.5, 0.5);
    expect(d).toHaveLength(MAX_DECOR);
  });

  it("draw rugs first, then back to front", () => {
    const d: DecorItem[] = [
      { kind: "plant", x: 0.2, y: 0.9, color: 0 },
      { kind: "lantern", x: 0.5, y: 0.3, color: 0 },
      { kind: "rug", x: 0.5, y: 0.92, color: 0 },
    ];
    expect(drawOrder(d)).toEqual([2, 1, 0]);
  });

  it("read back only sensible saved decorations", () => {
    expect(parseDecor("nope")).toEqual([]);
    const parsed = parseDecor([
      { kind: "lantern", x: 0.4, y: 0.4, color: 1 },
      { kind: "spaceship", x: 0.4, y: 0.4, color: 0 },
      { kind: "rug", x: "middle", y: 0.9 },
      { kind: "cushion", x: 0.5, y: 0.1, color: 99 },
    ]);
    expect(parsed.map((p) => p.kind)).toEqual(["lantern", "cushion"]);
    expect(parseDecor([{ kind: "tea", x: 0.5, y: 0.9, color: 2 }])[0].kind).toBe("tea");
    expect(parsed[1].y).toBeGreaterThanOrEqual(FLOOR_BAND[0]);
    expect(parsed[1].color).toBeLessThan(3);
  });
});
