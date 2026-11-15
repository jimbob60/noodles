/**
 * Phase 42, the balance gate: a pretend player plays for days, using the game's real rules for
 * coins (with the daily soft cap), daily goals, needs, growing up, eggs, breeding and the
 * Dragondex. Only the player's choices are made up (how often they play, how much they pet,
 * boop and play Noodle Catch), from three profiles. `npm run balance` prints the report.
 */
import { earn, emptyWallet, type CoinReason, type Wallet } from "../src/care/coins";
import { ADOPT_COST, freeReward, MAX_FAMILY } from "../src/care/family";
import { dexCount, discover, newPrizes, STICKERS, type Dex, type DexPage } from "../src/care/dex";
import { countGoal, freshGoals, type DailyGoals, type GoalEvent } from "../src/care/goals";
import { grow, growAtHome, growAway, stageOf, type Growth } from "../src/care/growth";
import { advance, change, freshNeeds, type NeedsState } from "../src/care/needs";
import { mixGenes } from "../src/care/breeding";
import { feedEffect } from "../src/care/food";
import { coinsFor } from "../src/game/noodleCatch";
import { genesFromSeed, type Genes } from "../src/noodle/genes";
import { seededRandom } from "../src/noodle/look";
import { rarityOf } from "../src/noodle/rarity";

export interface Profile {
  name: string;
  /** Hours of the day the game is opened. */
  sessions: number[];
  /** Minutes per visit. */
  minutes: number;
  purrsPerMin: number;
  boopsPerMin: number;
  ribbonsPerMin: number;
  /** Noodle Catch rounds a day, and a typical score. */
  catchRounds: number;
  catchScore: number;
  catPetsPerVisit: number;
  photosPerDay: number;
}

export const PROFILES: Profile[] = [
  {
    name: "light (2 short visits)",
    sessions: [8, 20],
    minutes: 6,
    purrsPerMin: 1,
    boopsPerMin: 2,
    ribbonsPerMin: 0.5,
    catchRounds: 0,
    catchScore: 30,
    catPetsPerVisit: 1,
    photosPerDay: 0,
  },
  {
    name: "regular (3 visits)",
    sessions: [8, 13, 20],
    minutes: 12,
    purrsPerMin: 1.5,
    boopsPerMin: 3,
    ribbonsPerMin: 1,
    catchRounds: 1,
    catchScore: 40,
    catPetsPerVisit: 2,
    photosPerDay: 0.3,
  },
  {
    name: "keen (5 long visits)",
    sessions: [8, 11, 14, 17, 20],
    minutes: 20,
    purrsPerMin: 2,
    boopsPerMin: 4,
    ribbonsPerMin: 1.5,
    catchRounds: 3,
    catchScore: 45,
    catPetsPerVisit: 3,
    photosPerDay: 1,
  },
];

interface SimDragon {
  genes: Genes;
  name: string;
  growth: Growth;
  needs: NeedsState;
  /** When it was last looked after (out in the den). */
  seenAt: number;
}

export interface DayReport {
  day: number;
  earned: number;
  fromGoals: number;
  /** One-off gifts: setting a grown-up free, Dragondex stickers. */
  gifts: number;
  coins: number;
  family: number;
  adults: number;
  dex: number;
  rares: number;
  freed: number;
}

export interface SimResult {
  profile: string;
  days: DayReport[];
  /** Day (1-based) the first dragon grew up, the first extra egg came, the family filled. */
  firstAdult: number | null;
  firstEgg: number | null;
  familyFull: number | null;
  stickers: DexPage[];
}

const HOUR = 3_600_000;

/**
 * Plays `days` days. `maxFamily` is the family limit; with `setFree`, when the family is full a
 * grown-up is set free (for its thank-you coins) to make room, so eggs keep coming.
 */
export function simulate(
  p: Profile,
  days: number,
  opts: { maxFamily?: number; setFree?: boolean; seed?: number } = {},
): SimResult {
  const maxFamily = opts.maxFamily ?? MAX_FAMILY;
  const r = seededRandom(opts.seed ?? 1234);
  const start = new Date(2026, 10, 2, 0, 0).getTime();
  let wallet: Wallet = emptyWallet();
  let dex: Dex = [];
  let prizes: DexPage[] = [];
  let goals: DailyGoals | null = null;
  const hatch = (genes: Genes, at: number): SimDragon => {
    const d = {
      genes,
      name: `D${hatched++}`,
      growth: { hours: 0 },
      needs: freshNeeds(at),
      seenAt: at,
    };
    dex = discover(dex, genes, d.name, at);
    if (rarityOf(genes) !== "common") rares++;
    return d;
  };
  let hatched = 0;
  let rares = 0;
  let freed = 0;
  let inDen: SimDragon | null = null;
  const family: SimDragon[] = [];
  family.push(hatch(genesFromSeed(Math.floor(r() * 2 ** 32)), start + 8 * HOUR));
  let earnedToday = 0;
  let goalsToday = 0;
  let giftsToday = 0;
  const result: SimResult = {
    profile: p.name,
    days: [],
    firstAdult: null,
    firstEgg: null,
    familyFull: null,
    stickers: [],
  };

  for (let day = 0; day < days; day++) {
    earnedToday = 0;
    goalsToday = 0;
    giftsToday = 0;
    for (const hour of p.sessions) {
      const now = start + day * 24 * HOUR + hour * HOUR;
      // Opening the game: everyone catches up on the time away (the one left in the den as in
      // the game; the others as family members at home).
      for (const d of family) {
        d.growth = (d === inDen ? growAway : growAtHome)(d.growth, now - d.seenAt, d.needs.values);
        d.needs = advance(d.needs, now, d.needs.inBed === true);
        d.needs = { ...d.needs, inBed: false };
        d.seenAt = now;
      }
      goals = freshGoals(goals, now, 1, family.length > 1);
      const pay = (reason: CoinReason, amount?: number) => {
        const res = earn(wallet, reason, now, amount);
        wallet = res.wallet;
        earnedToday += res.earned;
        if (reason !== "hello" && reason !== "grewUp") goal(reason as GoalEvent);
        if (res.earned > 0) goal("coins", res.earned);
      };
      const goal = (e: GoalEvent, n = 1) => {
        const res = countGoal(goals!, e, n);
        goals = res.goals;
        wallet = { ...wallet, coins: wallet.coins + res.coins };
        earnedToday += res.coins;
        goalsToday += res.coins;
      };
      pay("hello");
      // Care for the most grown one still growing (finish one before the next), else the first.
      const growing = family.filter((d) => stageOf(d.growth).id !== "adult");
      const here = growing.sort((a, b) => b.growth.hours - a.growth.hours)[0] ?? family[0];
      const stageBefore = stageOf(here.growth).id;
      if (hour === p.sessions[0] && day > 0) pay("rested");
      // Feed until full, a bath if grubby, then pet and play for the visit.
      while (here.needs.values.fullness < 80) {
        const fav = r() < 0.25;
        here.needs = change(here.needs, feedEffect(fav ? here.genes.favorite : "noodles", fav));
        pay(fav ? "favorite" : "snack");
      }
      if (here.needs.values.cleanliness < 70) {
        here.needs = change(here.needs, { cleanliness: 100 });
        pay("bath");
      }
      const m = p.minutes;
      const times = (rate: number) => Math.floor(rate * m + r());
      for (let i = times(p.purrsPerMin); i > 0; i--) pay("petting");
      for (let i = times(p.boopsPerMin); i > 0; i--) pay("boop");
      for (let i = times(p.ribbonsPerMin); i > 0; i--) pay("ribbon");
      here.needs = change(here.needs, { happiness: 100 });
      for (let i = 0; i < p.catPetsPerVisit; i++) goal("cat");
      if (r() < p.photosPerDay / p.sessions.length) goal("photo");
      const rounds = p.catchRounds / p.sessions.length;
      for (let i = Math.floor(rounds + r()); i > 0; i--) pay("catch", coinsFor(p.catchScore));
      // A friend over: a playdate every 7–16 s pays 2 coins.
      if (family.length > 1) for (let i = Math.floor((m * 60) / 11.5); i > 0; i--) pay("friends");
      // Growing during the visit, and a gift on reaching a new stage.
      here.growth = grow(here.growth, m / 60, here.needs.values);
      if (stageOf(here.growth).id !== stageBefore) pay("grewUp");
      // The last visit of the day ends with bedtime.
      if (hour === p.sessions[p.sessions.length - 1])
        for (const d of family) d.needs = { ...d.needs, inBed: true };
      // A new egg: breed two grown-ups for free, or adopt one for coins; it hatches right away.
      const adults = family.filter((d) => stageOf(d.growth).id === "adult");
      if (family.length >= maxFamily && opts.setFree && adults.length > 2) {
        // Room for a new egg: the oldest grown-up is set free, leaving coins behind.
        const gift = freeReward(adults[0].genes);
        wallet = { ...wallet, coins: wallet.coins + gift };
        earnedToday += gift;
        giftsToday += gift;
        freed++;
        family.splice(family.indexOf(adults[0]), 1);
      }
      if (family.length < maxFamily) {
        let genes: Genes | null = null;
        if (adults.length >= 2) {
          genes = mixGenes(
            adults[0].genes,
            adults[adults.length - 1].genes,
            Math.floor(r() * 2 ** 32),
            r,
          );
        } else if (wallet.coins >= ADOPT_COST) {
          wallet = { ...wallet, coins: wallet.coins - ADOPT_COST };
          genes = genesFromSeed(Math.floor(r() * 2 ** 32));
        }
        if (genes) {
          family.push(hatch(genes, now));
          result.firstEgg ??= day + 1;
          if (family.length >= maxFamily) result.familyFull ??= day + 1;
        }
      }
      for (const won of newPrizes(dex, prizes)) {
        prizes = [...prizes, won];
        wallet = { ...wallet, coins: wallet.coins + STICKERS[won].coins };
        earnedToday += STICKERS[won].coins;
        giftsToday += STICKERS[won].coins;
      }
      here.seenAt = now + m * 60_000;
      inDen = here;
      for (const d of family) d.needs = { ...d.needs, lastSeen: now + m * 60_000 };
      if (family.some((d) => stageOf(d.growth).id === "adult")) result.firstAdult ??= day + 1;
    }
    result.days.push({
      day: day + 1,
      earned: earnedToday,
      fromGoals: goalsToday,
      gifts: giftsToday,
      coins: wallet.coins,
      family: family.length,
      adults: family.filter((d) => stageOf(d.growth).id === "adult").length,
      dex: dexCount(dex).found,
      rares,
      freed,
    });
  }
  result.stickers = prizes;
  return result;
}
