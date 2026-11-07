import { FOOD_IDS, wantsFood, type FoodId } from "../care/food";
import type { Needs } from "../care/needs";
import type { PointerState } from "../engine/input";
import type { Point } from "../noodle/spine";
import { drawFood } from "./foodArt";

/** What the feeding tray needs from a dragon. */
export interface Feedable {
  /** Where its mouth is right now. */
  readonly mouth: Point;
  readonly headRadius: number;
  /** A food being held out: the dragon swims to it. Null when nothing is held. */
  lure: Point | null;
  eat(food: FoodId): void;
  refuse(): void;
}

export interface FeedEvent {
  ate: FoodId;
}

/** Seconds a dropped food takes to float back to the tray. */
const RETURN_TIME = 0.35;
/** The food floats a little above the finger, so the finger doesn't hide it. */
const LIFT = 34;

interface Returning {
  food: FoodId;
  from: Point;
  t: number;
}

/**
 * The food tray (bottom-left) and the food being dragged. Drag a food to the dragon's mouth to
 * feed it; let go anywhere else and the food floats back to the tray.
 */
export class Feeding {
  held: { food: FoodId; x: number; y: number } | null = null;
  private returning: Returning[] = [];
  private refusedAt = -Infinity;
  private time = 0;
  private width = 0;
  private height = 0;

  /** Tray slot centers and radius for the current screen size. */
  slots(): { food: FoodId; x: number; y: number; r: number }[] {
    const r = Math.max(24, Math.min(34, Math.min(this.width, this.height) * 0.042));
    const gap = r * 0.55;
    return FOOD_IDS.map((food, i) => ({
      food,
      x: 14 + r + i * (2 * r + gap),
      y: this.height - 14 - r,
      r,
    }));
  }

  /** The tray slot under a point, if any. */
  slotAt(x: number, y: number): FoodId | null {
    for (const s of this.slots()) if (Math.hypot(x - s.x, y - s.y) <= s.r * 1.15) return s.food;
    return null;
  }

  /**
   * @param pressed true on the frame the finger first touches down
   * @returns true while the tray has the finger (so nothing else should react to it)
   */
  update(
    dt: number,
    input: PointerState,
    pressed: boolean,
    dragon: Feedable,
    needs: Needs,
    width: number,
    height: number,
  ): { busy: boolean; event: FeedEvent | null } {
    this.time += dt;
    this.width = width;
    this.height = height;
    for (const r of this.returning) r.t += dt / RETURN_TIME;
    this.returning = this.returning.filter((r) => r.t < 1);

    if (pressed && !this.held) {
      const food = this.slotAt(input.x, input.y);
      if (food) this.held = { food, x: input.x, y: input.y - LIFT };
    }
    if (!this.held) {
      dragon.lure = null;
      return { busy: false, event: null };
    }

    if (!input.down) {
      // Let go before reaching the mouth: float back to the tray.
      this.returning.push({ food: this.held.food, from: { x: this.held.x, y: this.held.y }, t: 0 });
      this.held = null;
      dragon.lure = null;
      return { busy: false, event: null };
    }

    this.held.x = input.x;
    this.held.y = input.y - LIFT;
    dragon.lure = { x: this.held.x, y: this.held.y };
    const m = dragon.mouth;
    if (Math.hypot(this.held.x - m.x, this.held.y - m.y) < dragon.headRadius * 0.85) {
      if (wantsFood(needs)) {
        const food = this.held.food;
        dragon.eat(food);
        this.held = null;
        dragon.lure = null;
        return { busy: true, event: { ate: food } };
      }
      if (this.time - this.refusedAt > 1.2) {
        this.refusedAt = this.time;
        dragon.refuse();
      }
    }
    return { busy: true, event: null };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const slots = this.slots();
    for (const s of slots) {
      const glow = ctx.createRadialGradient(s.x, s.y, s.r * 0.5, s.x, s.y, s.r * 1.5);
      glow.addColorStop(0, "rgba(255,210,122,0.22)");
      glow.addColorStop(1, "rgba(255,210,122,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(20,14,60,0.85)";
      ctx.strokeStyle = "rgba(255,210,122,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // The food in its slot bobs gently, inviting a drag. It hides while being held.
      if (this.held?.food !== s.food) {
        const bob = Math.sin(this.time * 2 + s.x * 0.05) * s.r * 0.05;
        drawFood(ctx, s.food, s.x, s.y + bob, s.r * 0.6);
      }
    }
    const r = slots[0].r;
    for (const back of this.returning) {
      const slot = slots.find((s) => s.food === back.food)!;
      const e = 1 - Math.pow(1 - back.t, 3);
      const x = back.from.x + (slot.x - back.from.x) * e;
      const y = back.from.y + (slot.y - back.from.y) * e;
      drawFood(ctx, back.food, x, y, r * 0.6 * (1.25 - 0.25 * e));
    }
    if (this.held) {
      // Held food is a bit bigger, with a soft glow under it.
      const { x, y, food } = this.held;
      ctx.fillStyle = "rgba(255,240,200,0.18)";
      ctx.beginPath();
      ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
      ctx.fill();
      drawFood(ctx, food, x, y, r * 0.75);
    }
  }
}
