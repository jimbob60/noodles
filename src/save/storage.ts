import { parseNeeds } from "../care/needs";
import { makeSave, parseSave, type Save } from "./saveGame";

export const SAVE_KEY = "noodle-dragons.save";
/** The previous good save, kept in case the latest one is ever damaged. */
export const BACKUP_KEY = "noodle-dragons.save.previous";
/** Phases 13–20 kept only the needs, under this key. */
export const OLD_NEEDS_KEY = "noodle-dragons.needs.v1";

/** The parts of localStorage we use, so tests can pass in a stand-in. */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LoadedFrom = "save" | "previous" | "old-needs" | "new";

function read(store: KeyValueStore, key: string, now: number): Save | null {
  try {
    const text = store.getItem(key);
    return text ? parseSave(JSON.parse(text), now) : null;
  } catch {
    return null;
  }
}

/**
 * Loads the dragon: the latest save, else the previous good one, else the needs kept by the
 * phase 13–20 builds (with a new seed), else nothing (start a new dragon).
 */
export function loadGame(
  store: KeyValueStore | null,
  now: number,
  newSeed: () => number,
): { save: Save | null; from: LoadedFrom } {
  if (!store) return { save: null, from: "new" };
  const latest = read(store, SAVE_KEY, now);
  if (latest) return { save: latest, from: "save" };
  const previous = read(store, BACKUP_KEY, now);
  if (previous) return { save: previous, from: "previous" };
  try {
    const old = store.getItem(OLD_NEEDS_KEY);
    if (old)
      return {
        save: makeSave(newSeed(), parseNeeds(JSON.parse(old), now), now),
        from: "old-needs",
      };
  } catch {
    // Unreadable old data: start fresh.
  }
  return { save: null, from: "new" };
}

/** Saves the dragon, keeping the last good save as a spare. Returns false if storage failed. */
export function storeGame(store: KeyValueStore | null, save: Save): boolean {
  if (!store) return false;
  try {
    const current = store.getItem(SAVE_KEY);
    if (current) store.setItem(BACKUP_KEY, current);
    store.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

/** The browser's storage if it works here (Claude's preview frame may block it), else null. */
export function deviceStore(): KeyValueStore | null {
  try {
    const probe = "noodle-dragons.probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}
