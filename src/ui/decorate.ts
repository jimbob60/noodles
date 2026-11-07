import {
  addDecor,
  DECOR_KINDS,
  MAX_DECOR,
  moveDecor,
  recolorDecor,
  removeDecor,
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
   * decorate (below the need orbs on narrow phones).
   */
  slots(w: number, h: number): { kind: DecorKind; x: number; y: number; r: number }[] {
    const r = Math.max(22, Math.min(32, Math.min(w, h) * 0.04));
    const gap = r * 0.5;
    const total = DECOR_KINDS.length * 2 * r + (DECOR_KINDS.length - 1) * gap;
    return DECOR_KINDS.map((kind, i) => ({
      kind,
      x: w / 2 - total / 2 + r + i * (2 * r + gap),
      y: (w < 760 ? 112 : 18) + r,
      r,
    }));
  }

  /** True if a point is over the drawer (dropping a decoration there puts it away). */
  overDrawer(p: Point, w: number, h: number): boolean {
    const s = this.slots(w, h);
    const r = s[0].r * 1.4;
    return p.y > s[0].y - r && p.y < s[0].y + r && p.x > s[0].x - r && p.x < s[s.length - 1].x + r;
  }

  /** The placed decoration under a point, topmost first, or null. */
  private itemAt(items: DecorItem[], p: Point, w: number, h: number): number | null {
    const s = decorSize(w, h);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const wide = it.kind === "rug" ? 2 : 1;
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
    const left = slots[0].x - slots[0].r * 1.4;
    const right = slots[slots.length - 1].x + slots[0].r * 1.4;
    const top = slots[0].y - slots[0].r * 1.4;
    ctx.fillStyle = overBin ? "rgba(255,138,216,0.35)" : "rgba(20,14,60,0.75)";
    ctx.strokeStyle = overBin ? "#ff8ad8" : "rgba(183,160,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(left, top, right - left, slots[0].r * 2.8, 22);
    ctx.fill();
    ctx.stroke();
    const full = items.length >= MAX_DECOR;
    for (const s of slots) {
      ctx.globalAlpha = full ? 0.35 : 1;
      drawDecorAt(
        ctx,
        s.kind,
        0,
        s.x,
        s.y + (s.kind === "lantern" ? s.r * 0.15 : 0),
        s.r * 0.55,
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
      const below = top + slots[0].r * 2.8;
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
      const wide = it.kind === "rug" ? 2 : 1;
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
