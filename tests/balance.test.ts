import { describe, expect, it } from "vitest";
import { PROFILES, simulate, type SimResult } from "./balanceSim";

const DAYS = 30;
const show = (r: SimResult, label = "") => {
  const at = (d: number) => r.days[d - 1];
  const total = (d: number) => r.days.slice(0, d).reduce((n, x) => n + x.earned, 0);
  console.log(
    `\n${r.profile}${label}\n` +
      `  first grown-up: day ${r.firstAdult}, first extra egg: day ${r.firstEgg}, family full: day ${r.familyFull}\n` +
      `  coins earned: day 1 ${at(1).earned} (goals ${at(1).fromGoals}), day 7 ${at(7).earned}, by day 7 ${total(7)}, by day 30 ${total(30)}\n` +
      `  Dragondex: day 7 ${at(7).dex}, day 14 ${at(14).dex}, day 30 ${at(30).dex} of 138; rares hatched by day 30: ${at(30).rares}; set free: ${at(30).freed}; stickers: ${r.stickers.join(", ") || "none"}\n` +
      `  family by day: ${[1, 3, 5, 7, 10, 14, 21, 30].map((d) => `${d}:${at(d).family}(${at(d).adults}🐉)`).join(" ")}\n` +
      `  coins in hand: ${[1, 3, 7, 14, 30].map((d) => `d${d} ${at(d).coins}`).join(", ")}`,
  );
};

describe("balance (phase 42)", () => {
  it("prints a 30-day report for three kinds of player", () => {
    for (const p of PROFILES) show(simulate(p, DAYS));
    for (const p of PROFILES)
      show(simulate(p, DAYS, { setFree: true }), " + setting grown-ups free");
  });

  // The gate: progress feels steady, not grindy.
  for (const p of PROFILES) {
    const r = simulate(p, DAYS, { setFree: true });
    const day = (d: number) => r.days[d - 1];
    it(`${p.name}: coins come steadily, but can't be ground out`, () => {
      expect(day(1).earned).toBeGreaterThanOrEqual(80);
      // Everyday care and goals (one-off gifts aside) top out at the cap plus goals.
      for (const d of r.days) expect(d.earned - d.gifts).toBeLessThanOrEqual(300);
      // Enough for a surprise egg (150) within two days.
      expect(day(2).earned + day(1).earned).toBeGreaterThanOrEqual(150);
    });
    it(`${p.name}: a grown-up within a week, and the family fills in about a week`, () => {
      expect(r.firstAdult).not.toBeNull();
      expect(r.firstAdult!).toBeLessThanOrEqual(6);
      expect(r.firstEgg!).toBeLessThanOrEqual(3);
      expect(r.familyFull!).toBeLessThanOrEqual(10);
    });
    it(`${p.name}: the Dragondex keeps filling, and rares turn up`, () => {
      expect(day(30).dex).toBeGreaterThan(day(14).dex);
      expect(day(30).dex).toBeGreaterThanOrEqual(45);
      expect(day(30).rares).toBeGreaterThanOrEqual(4);
    });
  }
});
