import { seededRandom } from "../noodle/look";
import type { Needs } from "./needs";

export type FoodId = "noodles" | "dumpling" | "fish";
export const FOOD_IDS: FoodId[] = ["noodles", "dumpling", "fish"];

/** How much each food fills the Food orb, and the little bit of Love any snack brings. */
export const FOOD_FULLNESS: Record<FoodId, number> = { noodles: 30, dumpling: 20, fish: 25 };
export const SNACK_HAPPINESS = 4;
/** Extra Love for a dragon's favorite food. */
export const FAVORITE_HAPPINESS = 14;
/** At or above this fullness the dragon politely says "no thanks". */
export const FULL_ENOUGH = 97;

/** Each dragon's favorite food comes from its seed, so it never changes. */
export function favoriteFood(seed: number): FoodId {
  // A separate stream from the look's colors, so favorites don't follow body color.
  const r = seededRandom(seed ^ 0x5eed_f00d);
  return FOOD_IDS[Math.floor(r() * FOOD_IDS.length)];
}

export function wantsFood(needs: Needs): boolean {
  return needs.fullness < FULL_ENOUGH;
}

/** What eating a food changes. */
export function feedEffect(food: FoodId, favorite: boolean): Partial<Needs> {
  return {
    fullness: FOOD_FULLNESS[food],
    happiness: SNACK_HAPPINESS + (favorite ? FAVORITE_HAPPINESS : 0),
  };
}
