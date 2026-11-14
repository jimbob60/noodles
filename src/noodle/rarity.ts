import { RARE_PATTERNS, type DragonLook, type Finish, type RarePattern } from "./look";

/** How rare a dragon is: one rare thing, both a rare color and a rare pattern, or a holiday one. */
export type Rarity = "common" | "rare" | "superRare" | "holiday";

export const isRarePattern = (kind: string): kind is RarePattern =>
  RARE_PATTERNS.includes(kind as RarePattern);

export function rarityOf(look: DragonLook): Rarity {
  if (look.special) return "holiday";
  const count = (look.finish ? 1 : 0) + (isRarePattern(look.patternKind) ? 1 : 0);
  return count === 2 ? "superRare" : count === 1 ? "rare" : "common";
}

/** Rare dragons shimmer (holiday dragons have their own magic instead). */
export const hasShimmer = (look: DragonLook): boolean => {
  const rarity = rarityOf(look);
  return rarity === "rare" || rarity === "superRare";
};

export const RARITY_BADGE: Record<Rarity, string> = {
  common: "",
  rare: "✨ Rare",
  superRare: "🌟 Super rare",
  holiday: "🎉 Holiday rare",
};
export const FINISH_LABEL: Record<Finish, string> = {
  golden: "✨ Golden scales",
  pearl: "✨ Pearl scales",
  midnight: "✨ Midnight scales",
};
export const RARE_PATTERN_LABEL: Record<RarePattern, string> = {
  stars: "✨ Starry",
  rainbow: "✨ Rainbow",
  koi: "✨ Koi patches",
};
