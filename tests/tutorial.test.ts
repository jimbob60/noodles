import { describe, expect, it } from "vitest";
import { advance, STEPS } from "../src/ui/tutorial";

const at = (id: string) => ({ step: STEPS.findIndex((s) => s.id === id), progress: 0 });

describe("Shelly's tutorial", () => {
  it("waits for each thing to actually be done", () => {
    expect(advance(at("feed"), "pet")).toEqual(at("feed"));
    expect(advance(at("feed"), "fed")).toEqual(at("pet"));
    expect(advance(at("pet"), "pet")).toEqual(at("play"));
  });

  it("counts up rubbing and swimming until there's been enough", () => {
    let s = at("swim");
    s = advance(s, "swim", 400);
    expect(s.step).toBe(at("swim").step);
    s = advance(s, "swim", 600);
    expect(s).toEqual(at("feed"));
  });

  it("catches up if the egg hatches quickly", () => {
    expect(advance(at("warm"), "crack")).toEqual(at("name"));
    expect(advance(at("warm"), "named")).toEqual(at("swim"));
    expect(advance(at("tap"), "named")).toEqual(at("swim"));
  });

  it("explains the rest with Got it, then ends", () => {
    let s = at("orbs");
    for (let i = 0; i < 10 && s.step < STEPS.length; i++) s = advance(s, "ok");
    expect(s.step).toBe(STEPS.length);
    expect(advance(s, "ok")).toBe(s);
  });

  it("speaks in short, friendly lines", () => {
    for (const s of STEPS) expect(s.say.length).toBeLessThan(130);
  });
});
