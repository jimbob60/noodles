/**
 * Settings kept on this device (phase 44), apart from the save: they belong to the device, not
 * to the dragons (a backup code moved to another tablet doesn't bring its volume along).
 */
export interface Settings {
  /** Music volume, 0 (silent) to 1. */
  music: number;
  /** Sound effects volume, 0 (silent) to 1. */
  effects: number;
}

export const DEFAULT_SETTINGS: Settings = { music: 0.7, effects: 0.8 };
const KEY = "noodle-dragons.settings";

const level = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;

export function parseSettings(raw: string | null): Settings {
  try {
    const s = JSON.parse(raw ?? "null") as Partial<Settings> | null;
    if (!s || typeof s !== "object") return { ...DEFAULT_SETTINGS };
    return {
      music: level(s.music, DEFAULT_SETTINGS.music),
      effects: level(s.effects, DEFAULT_SETTINGS.effects),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(KEY));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // No storage: the settings last until the page closes.
  }
}
