import { freshNeeds, parseNeeds, type NeedsState } from "../care/needs";
import { parseDecor, type DecorItem } from "../den/decor";
import { emptyWallet, parseWallet, type Wallet } from "../care/coins";
import { emptyStash, parseStash, type Stash } from "../care/shop";
import { freshGrowth, parseGrowth, type Growth } from "../care/growth";
import { genesFromSeed, parseGenes, type Genes } from "../noodle/genes";
import { parseIdentity, type Identity } from "../care/identity";
import { emptyWardrobe, parseWardrobe, type Wardrobe } from "../care/wardrobe";

/** The save format version. Bump it (and add a migration below) whenever the format changes. */
export const SAVE_VERSION = 11;

/**
 * Everything that makes your dragon yours.
 * - Version 1 (phase 21): seed and needs.
 * - Version 2 (phase 23): plus the den's decorations.
 * - Version 3 (phase 24): plus the noodle coin wallet.
 * - Version 4 (phase 25): plus the shop stash (treats and unlocked decorations).
 * - Version 5 (phase 25): decorations are bought one at a time and kept in storage.
 * - Version 6 (phase 25): plus the balls bought in the shop.
 * - Version 7 (phase 26): plus the best Noodle Catch score.
 * - Version 8 (phase 29): plus how grown up it is (hours of good care).
 * - Version 9 (phase 30): plus its genes (everything that makes it itself).
 * - Version 10 (phase 32): plus its name and birthday.
 * - Version 11 (phase 33): plus its accessories (bought, and what it's wearing).
 */
export interface SaveV11 {
  version: 11;
  /** When this was saved (milliseconds since 1970). */
  savedAt: number;
  /** Its id number. A wild dragon's genes were first made from it. */
  seed: number;
  /** Everything that makes it itself: looks, personality, favorite food, tickle spots. */
  genes: Genes;
  /** Its name and when it hatched. */
  identity: Identity;
  /** Accessories bought, and what it's wearing. */
  wardrobe: Wardrobe;
  needs: NeedsState;
  decor: DecorItem[];
  wallet: Wallet;
  stash: Stash;
  growth: Growth;
}
export type Save = SaveV11;

export function newSave(seed: number, now: number): Save {
  return {
    version: 11,
    savedAt: now,
    seed,
    genes: genesFromSeed(seed),
    identity: parseIdentity(null, seed, now),
    wardrobe: emptyWardrobe(),
    needs: freshNeeds(now),
    decor: [],
    wallet: emptyWallet(),
    stash: emptyStash(),
    growth: freshGrowth(),
  };
}

export function makeSave(
  seed: number,
  needs: NeedsState,
  now: number,
  decor: DecorItem[] = [],
  wallet: Wallet = emptyWallet(),
  stash: Stash = emptyStash(),
  growth: Growth = freshGrowth(),
  genes: Genes = genesFromSeed(seed),
  identity: Identity = parseIdentity(null, seed, now),
  wardrobe: Wardrobe = emptyWardrobe(),
): Save {
  return {
    version: 11,
    savedAt: now,
    seed,
    genes,
    identity,
    wardrobe,
    needs,
    decor,
    wallet,
    stash,
    growth,
  };
}

const validSeed = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 2 ** 32;

/**
 * Reads a save, accepting only sensible data. Returns null if it isn't a save at all. A save
 * from a newer version of the game is read as far as this version understands it.
 */
export function parseSave(raw: unknown, now: number): Save | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as {
    version?: unknown;
    seed?: unknown;
    needs?: unknown;
    savedAt?: unknown;
    decor?: unknown;
    wallet?: unknown;
    stash?: unknown;
    growth?: unknown;
    genes?: unknown;
    identity?: unknown;
    wardrobe?: unknown;
  };
  if (typeof r.version !== "number" || r.version < 1 || !validSeed(r.seed)) return null;
  const savedAt = typeof r.savedAt === "number" && r.savedAt <= now ? r.savedAt : now;
  // Version 1 had no decorations: it upgrades with an empty den.
  const decor = r.version >= 2 ? parseDecor(r.decor) : [];
  // Versions 1–2 had no coins: they upgrade with an empty wallet.
  const wallet = r.version >= 3 ? parseWallet(r.wallet) : emptyWallet();
  // Versions 1–3 had no shop: they upgrade with an empty stash.
  const stash =
    r.version >= 4
      ? parseStash(
          r.stash,
          decor.map((d) => d.kind),
        )
      : emptyStash();
  // Versions 1–7 had no growing up: those dragons start again as babies, so you see them grow.
  const growth = r.version >= 8 ? parseGrowth(r.growth) : freshGrowth();
  // Versions 1–8 had no genes: they come from the seed, exactly as those dragons always looked.
  const genes = (r.version >= 9 ? parseGenes(r.genes) : null) ?? genesFromSeed(r.seed);
  // Versions 1–9 had no names: a name comes from the seed, and the birthday from how long it
  // has been growing.
  const identity = parseIdentity(
    r.version >= 10 ? r.identity : null,
    r.seed,
    savedAt - growth.hours * 3_600_000,
  );
  // Versions 1–10 had no accessories: an empty closet.
  const wardrobe = r.version >= 11 ? parseWardrobe(r.wardrobe) : emptyWardrobe();
  return {
    version: 11,
    savedAt,
    seed: r.seed,
    genes,
    identity,
    wardrobe,
    needs: parseNeeds(r.needs, now),
    decor,
    wallet,
    stash,
    growth,
  };
}

// ---- Backup codes: a save as text that can be copied out and pasted back in. ----

const PREFIX = "ND1-";

/** A small checksum (FNV-1a), so a mistyped or cut-off code is caught instead of loaded. */
function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 6);
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Turns a save into a backup code like "ND1-eyJ2Ij…-1a2b3c". */
export function encodeBackup(save: Save): string {
  const body = toBase64Url(JSON.stringify(save));
  return `${PREFIX}${body}-${checksum(body)}`;
}

/** Reads a backup code back into a save, or null if it's broken, cut off or tampered with. */
export function decodeBackup(code: string, now: number): Save | null {
  const clean = code.replace(/\s+/g, "");
  if (!clean.startsWith(PREFIX)) return null;
  const rest = clean.slice(PREFIX.length);
  const dash = rest.lastIndexOf("-");
  if (dash < 1) return null;
  const body = rest.slice(0, dash);
  if (checksum(body) !== rest.slice(dash + 1)) return null;
  try {
    return parseSave(JSON.parse(fromBase64Url(body)), now);
  } catch {
    return null;
  }
}
