import {
  addDecor,
  DECOR_KINDS,
  STARTER_DECOR,
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
  /** Which decorations are in the drawer (the starter set plus anything bought). */
  kinds: DecorKind[] = [...STARTER_DECOR];
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
      ctx.globalAlpha = full ? 0.35 : 1;
      // Wide things (rug, fairy lights) are shrunk to fit their slot.
      const size = (s.r * 0.6) / Math.max(1, WIDTH[s.kind] * 0.75);
      drawDecorAt(
        ctx,
        s.kind,
        0,
        s.x,
        s.y + (ON_FLOOR[s.kind] ? -size * 0.1 : size * 0.15),
        size,
        dark,
        this.time,
      );
      ctx.globalAlpha = 1;
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
