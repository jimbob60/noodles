import { freshNeeds, parseNeeds, type NeedsState } from "./needs";

const KEY = "noodle-dragons.needs.v1";

/**
 * Keeps the needs on this device between visits. Storage can be missing or blocked (private
 * browsing, sandboxed previews), so every call is guarded and the game works without it.
 * The full save system, with backups, arrives in phase 21.
 */
export function loadNeeds(now: number): NeedsState {
  try {
    const text = localStorage.getItem(KEY);
    return text ? parseNeeds(JSON.parse(text), now) : freshNeeds(now);
  } catch {
    return freshNeeds(now);
  }
}

export function saveNeeds(state: NeedsState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // No storage: the needs just start fresh next visit.
  }
}
