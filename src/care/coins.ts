/** Noodle coins: earned only by caring and playing. No real money anywhere (phase 24). */
export type CoinReason =
  "snack" | "favorite" | "petting" | "boop" | "ribbon" | "bath" | "rested" | "hello";

/** Coins for each kind of care. */
export const REWARD: Record<CoinReason, number> = {
  snack: 2,
  favorite: 3,
  petting: 3,
  boop: 1,
  ribbon: 2,
  bath: 4,
  rested: 5,
  hello: 10,
};

/** After this many coins in a day, everyday care pays half (rounded up), so there's no grinding. */
export const DAILY_SOFT_CAP = 150;

export interface Wallet {
  coins: number;
  /** Coins earned on `day` (a local date like "2026-11-07"), for the soft cap. */
  today: number;
  day: string;
  /** The last day the daily hello bonus was given. */
  helloDay: string;
}

export const emptyWallet = (): Wallet => ({ coins: 0, today: 0, day: "", helloDay: "" });

/** A local date as "YYYY-MM-DD". */
export function dayOf(time: number): string {
  const d = new Date(time);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Adds coins for a bit of care. Returns the new wallet and how many were actually earned. */
export function earn(
  w: Wallet,
  reason: CoinReason,
  now: number,
): { wallet: Wallet; earned: number } {
  const day = dayOf(now);
  const today = w.day === day ? w.today : 0;
  if (reason === "hello" && w.helloDay === day) return { wallet: w, earned: 0 };
  let earned = REWARD[reason];
  if (reason !== "hello" && today >= DAILY_SOFT_CAP) earned = Math.ceil(earned / 2);
  return {
    wallet: {
      coins: w.coins + earned,
      today: today + earned,
      day,
      helloDay: reason === "hello" ? day : w.helloDay,
    },
    earned,
  };
}

/** Spends coins if there are enough (for the shop in phase 25). */
export function spend(w: Wallet, cost: number): Wallet | null {
  if (!Number.isInteger(cost) || cost < 0 || cost > w.coins) return null;
  return { ...w, coins: w.coins - cost };
}

/** Reads a saved wallet, keeping only sensible numbers. */
export function parseWallet(raw: unknown): Wallet {
  if (!raw || typeof raw !== "object") return emptyWallet();
  const r = raw as Record<string, unknown>;
  const count = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  const text = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  return {
    coins: count(r.coins),
    today: count(r.today),
    day: text(r.day),
    helloDay: text(r.helloDay),
  };
}
