import {
  addDecor,
  DECOR_KINDS,
  MAX_DECOR,
  moveDecor,
  recolorDecor,
  removeDecor,
  ON_FLOOR,
  WIDTH,
  type DecorItem,
  type DecorKind,
} from "../den/decor";
import { decorSize, drawDecorAt } from "../den/decorArt";
import { drawCoin } from "./coinCounter";
import type { PointerState } from "../engine/input";
import type { Point } from "../noodle/spine";

/** The decorate button: under the backup button in the top-right corner. */
export function decorateButton(width: number): Point & { r: number } {
  const r = 18;
  return { x: width - 14 - r, y: 44 + 2 * r + 10 + r, r };
}

export function onDecorateButton(p: Point, width: number): boolean {
  const b = decorateButton(width);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

/** A movement shorter than this counts as a tap (recolor), not a drag. */
const TAP = 10;

/**
 * Decorating mode: a drawer of decorations along the bottom. Drag one out to place it, drag a
 * placed one to move it, tap one to change its color, and drag it back onto the drawer to put
 * it away.
 */
export class Decorator {
  active = false;
  /** Every decoration is in the drawer; ones not owned yet show their price and can be bought. */
  kinds: DecorKind[] = [...DECOR_KINDS];
  owned: DecorKind[] = [];
  prices: Partial<Record<DecorKind, number>> = {};
  /** Buys a decoration; returns false if there aren't enough coins. */
  onBuy: (kind: DecorKind) => boolean = () => false;
  /** A locked decoration tapped once: tap again within a few seconds to buy it. */
  private pending: { kind: DecorKind; until: number } | null = null;
  /** Little effects on drawer slots: a shake for "not enough coins", a sparkle for a purchase. */
  private shake: { kind: DecorKind; t: number } | null = null;
  private bought: { kind: DecorKind; t: number } | null = null;
  private drag: {
    index: number | null;
    kind: DecorKind;
    from: Point;
    moved: boolean;
    at: Point;
  } | null = null;
  private time = 0;

  /**
   * The drawer's slots, centred along the top of the screen so the whole floor stays free to
   * decorate. It wraps into rows on narrow screens.
   */
  slots(w: number, h: number): { kind: DecorKind; x: number; y: number; r: number }[] {
    const r = Math.max(22, Math.min(30, Math.min(w, h) * 0.04));
    const gap = r * 0.5;
    const n = this.kinds.length;
    const cols = Math.min(n, Math.max(3, Math.floor((w - 60 + gap) / (2 * r + gap))));
    // Below the need orbs and the mode tag, so nothing is covered.
    const top = (w < 760 ? 132 : 112) + r * 1.4;
    return this.kinds.map((kind, i) => {
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, n - row * cols);
      const rowWidth = inRow * 2 * r + (inRow - 1) * gap;
      return {
        kind,
        x: w / 2 - rowWidth / 2 + r + (i % cols) * (2 * r + gap),
        y: top + row * (2 * r + gap),
        r,
      };
    });
  }

  /** The drawer's outline (around all its slots). */
  private box(w: number, h: number): { left: number; right: number; top: number; bottom: number } {
    const s = this.slots(w, h);
    const pad = s[0].r * 1.4;
    return {
      left: Math.min(...s.map((q) => q.x)) - pad,
      right: Math.max(...s.map((q) => q.x)) + pad,
      top: Math.min(...s.map((q) => q.y)) - pad,
      bottom: Math.max(...s.map((q) => q.y)) + pad,
    };
  }

  /** True if a point is over the drawer (dropping a decoration there puts it away). */
  overDrawer(p: Point, w: number, h: number): boolean {
    const b = this.box(w, h);
    return p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom;
  }

  /** The placed decoration under a point, topmost first, or null. */
  private itemAt(items: DecorItem[], p: Point, w: number, h: number): number | null {
    const s = decorSize(w, h);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const wide = WIDTH[it.kind];
      if (Math.abs(p.x - it.x * w) < s * 1.1 * wide && Math.abs(p.y - it.y * h) < s * 1.1) return i;
    }
    return null;
  }

  update(
    dt: number,
    input: PointerState,
    pressAt: Point | null,
    items: DecorItem[],
    w: number,
    h: number,
  ): DecorItem[] {
    this.time += dt;
    if (!this.active) {
      this.drag = null;
      return items;
    }
    if (pressAt && !this.drag) {
      const slot = this.slots(w, h).find(
        (s) => Math.hypot(pressAt.x - s.x, pressAt.y - s.y) <= s.r * 1.15,
      );
      if (slot && !this.owned.includes(slot.kind)) {
        // A locked decoration: first tap asks "Buy?", a second tap buys it.
        if (this.pending?.kind === slot.kind && this.time < this.pending.until) {
          this.pending = null;
          if (this.onBuy(slot.kind)) this.bought = { kind: slot.kind, t: this.time };
          else this.shake = { kind: slot.kind, t: this.time };
        } else {
          this.pending = { kind: slot.kind, until: this.time + 3 };
        }
        return items;
      }
      if (slot && items.length < MAX_DECOR) {
        this.drag = {
          index: null,
          kind: slot.kind,
          from: pressAt,
          moved: false,
          at: { ...pressAt },
        };
      } else {
        const i = this.itemAt(items, pressAt, w, h);
        if (i !== null)
          this.drag = {
            index: i,
            kind: items[i].kind,
            from: pressAt,
            moved: false,
            at: { ...pressAt },
          };
      }
    }
    if (!this.drag) return items;
    const d = this.drag;
    d.at = { x: input.x, y: input.y };
    if (Math.hypot(d.at.x - d.from.x, d.at.y - d.from.y) > TAP) d.moved = true;
    if (input.down) {
      // While dragging a placed item, it follows the finger.
      if (d.index !== null && d.moved) return moveDecor(items, d.index, d.at.x / w, d.at.y / h);
      return items;
    }
    // Let go.
    this.drag = null;
    if (d.index === null) {
      if (!d.moved || this.overDrawer(d.at, w, h)) return items; // a tap on the drawer, or dropped back
      return addDecor(items, d.kind, d.at.x / w, d.at.y / h);
    }
    if (!d.moved) return recolorDecor(items, d.index);
    if (this.overDrawer(d.at, w, h)) return removeDecor(items, d.index);
    return items;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    items: DecorItem[],
    w: number,
    h: number,
    dark: number,
  ): void {
    if (!this.active) return;
    const slots = this.slots(w, h);
    const dragging = this.drag;
    const overBin =
      dragging?.index !== null && dragging?.moved && this.overDrawer(dragging.at, w, h);
    // The drawer: a soft tray behind the slots that glows pink when an item can be dropped in.
    const box = this.box(w, h);
    const top = box.top;
    ctx.fillStyle = overBin ? "rgba(255,138,216,0.35)" : "rgba(20,14,60,0.8)";
    ctx.strokeStyle = overBin ? "#ff8ad8" : "rgba(183,160,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(box.left, box.top, box.right - box.left, box.bottom - box.top, 22);
    ctx.fill();
    ctx.stroke();
    const full = items.length >= MAX_DECOR;
    for (const s of slots) {
      const owned = this.owned.includes(s.kind);
      const shaking = this.shake?.kind === s.kind && this.time - this.shake.t < 0.5;
      const dx = shaking ? Math.sin((this.time - this.shake!.t) * 50) * 5 : 0;
      ctx.globalAlpha = !owned ? 0.4 : full ? 0.35 : 1;
      // Wide things (rug, fairy lights) are shrunk to fit their slot.
      const size = (s.r * 0.6) / Math.max(1, WIDTH[s.kind] * 0.75);
      drawDecorAt(
        ctx,
        s.kind,
        0,
        s.x + dx,
        s.y + (ON_FLOOR[s.kind] ? -size * 0.1 : size * 0.15),
        size,
        dark,
        this.time,
      );
      ctx.globalAlpha = 1;
      if (!owned) {
        // Price tag: a coin and the price, under the decoration.
        const price = String(this.prices[s.kind] ?? "?");
        ctx.font = "700 12px system-ui, sans-serif";
        const tw = ctx.measureText(price).width + 22;
        const ty = s.y + s.r * 0.72;
        ctx.fillStyle = "rgba(20,14,60,0.9)";
        ctx.beginPath();
        ctx.roundRect(s.x - tw / 2 + dx, ty - 9, tw, 18, 9);
        ctx.fill();
        drawCoin(ctx, s.x - tw / 2 + 10 + dx, ty, 6);
        ctx.fillStyle = "#ffe08a";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(price, s.x - tw / 2 + 18 + dx, ty + 1);
      }
      if (this.pending?.kind === s.kind && this.time < this.pending.until) {
        // Asking "Buy?": a pulsing gold ring and a label.
        ctx.strokeStyle = `rgba(255,210,122,${(0.6 + 0.4 * Math.sin(this.time * 8)).toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 1.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "700 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffd27a";
        ctx.beginPath();
        ctx.roundRect(s.x - 22, s.y - s.r * 1.35 - 10, 44, 20, 10);
        ctx.fill();
        ctx.fillStyle = "#1a1040";
        ctx.fillText("Buy?", s.x, s.y - s.r * 1.35);
      }
      if (this.bought?.kind === s.kind && this.time - this.bought.t < 0.8) {
        // Just bought: a burst of sparkles.
        const t = (this.time - this.bought.t) / 0.8;
        ctx.fillStyle = `rgba(255,240,170,${(1 - t).toFixed(3)})`;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(
            s.x + Math.cos(a) * s.r * (0.6 + t),
            s.y + Math.sin(a) * s.r * (0.6 + t),
            3,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }
    if (overBin) {
      // A little "put away" arrow over the drawer.
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const below = box.bottom;
      ctx.moveTo(w / 2, below + 30);
      ctx.lineTo(w / 2, below + 8);
      ctx.moveTo(w / 2 - 8, below + 16);
      ctx.lineTo(w / 2, below + 8);
      ctx.lineTo(w / 2 + 8, below + 16);
      ctx.stroke();
    }
    // A new decoration being dragged out of the drawer.
    if (dragging && dragging.index === null && dragging.moved) {
      drawDecorAt(
        ctx,
        dragging.kind,
        0,
        dragging.at.x,
        dragging.at.y,
        decorSize(w, h),
        dark,
        this.time,
      );
    }
    // Dashed outlines show which decorations can be moved.
    const s = decorSize(w, h);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    for (const it of items) {
      const wide = WIDTH[it.kind];
      ctx.beginPath();
      ctx.roundRect(it.x * w - s * 1.1 * wide, it.y * h - s * 1.1, s * 2.2 * wide, s * 2.2, 10);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}

/** The decorate button: a little potted plant (or a tick while decorating). */
export function drawDecorateButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  active: boolean,
  dark: number,
  time: number,
): void {
  const b = decorateButton(width);
  ctx.fillStyle = active ? "rgba(157,255,200,0.3)" : "rgba(20,14,60,0.85)";
  ctx.strokeStyle = active ? "#9dffc8" : "rgba(157,255,200,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (active) {
    ctx.strokeStyle = "#9dffc8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(b.x - 7, b.y);
    ctx.lineTo(b.x - 2, b.y + 6);
    ctx.lineTo(b.x + 8, b.y - 6);
    ctx.stroke();
  } else {
    drawDecorAt(ctx, "plant", 0, b.x, b.y + 4, b.r * 0.45, dark, time);
  }
}
