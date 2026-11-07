import { describe, expect, it } from "vitest";
import { favoriteFood, feedEffect, FOOD_IDS, FULL_ENOUGH, wantsFood } from "../src/care/food";
import { change, freshNeeds } from "../src/care/needs";

describe("food", () => {
  it("gives every dragon a favorite that never changes", () => {
    for (let seed = 1; seed < 50; seed++) expect(favoriteFood(seed)).toBe(favoriteFood(seed));
  });

  it("spreads favorites across all three foods", () => {
    const counts = { noodles: 0, dumpling: 0, fish: 0 };
    for (let seed = 1; seed <= 3000; seed++) counts[favoriteFood(seed)]++;
    for (const id of FOOD_IDS) expect(counts[id]).toBeGreaterThan(800);
  });

  it("fills the Food orb, and a favorite brings extra Love", () => {
    for (const id of FOOD_IDS) {
      const plain = feedEffect(id, false);
      const fav = feedEffect(id, true);
      expect(plain.fullness).toBeGreaterThan(0);
      expect(fav.fullness).toBe(plain.fullness);
      expect(fav.happiness!).toBeGreaterThan(plain.happiness!);
    }
  });

  it("never overfills, and a full dragon says no thanks", () => {
    let s = freshNeeds(0);
    for (let i = 0; i < 10; i++) s = change(s, feedEffect("noodles", true));
    expect(s.values.fullness).toBe(100);
    expect(wantsFood(s.values)).toBe(false);
    expect(wantsFood({ ...s.values, fullness: FULL_ENOUGH - 1 })).toBe(true);
  });
});
