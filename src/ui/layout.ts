import type { Point } from "../noodle/spine";

/** Radius of the round tray buttons along the bottom (food, toys, sponge, moon). */
export function trayRadius(width: number, height: number): number {
  return Math.max(24, Math.min(34, Math.min(width, height) * 0.042));
}

/**
 * How many small buttons stack down the top-right corner (backup, decorate, shop, game, closet,
 * camera, family, help).
 */
export const CORNER_BUTTONS = 8;
/** Where the stack starts: just under the build tag. */
const CORNER_TOP = 44;

/**
 * The i-th small button down the top-right corner. On a roomy screen they are 18 px bubbles
 * 46 px apart; on a short screen (a phone on its side) the stack squeezes and the bubbles shrink
 * so the last one still stays clear of the sponge and moon buttons below; on a very short screen
 * they wrap into two columns.
 */
export function cornerButton(i: number, width: number, height: number): Point & { r: number } {
  const R = trayRadius(width, height);
  // Top of the upper row of tray buttons (sponge and moon), less a little breathing room.
  const floor = height - 14 - 2 * R - R * 0.55 - 2 * R - 10;
  const room = floor - CORNER_TOP;
  // Too short for one column (a phone on its side): wrap into two, filling down then across.
  const cols = room / CORNER_BUTTONS < 34 ? 2 : 1;
  const rows = Math.ceil(CORNER_BUTTONS / cols);
  const step = Math.max(28, Math.min(46, room / rows));
  const r = Math.min(18, (step - 8) / 2);
  const col = Math.floor(i / rows);
  const row = i % rows;
  return { x: width - 14 - r - col * (2 * r + 10), y: CORNER_TOP + r + row * step, r };
}
