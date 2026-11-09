import { FOOD_IDS, TREAT_IDS, wantsFood, type FoodId } from "../care/food";
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

/** Seconds a food takes to drift back home to its bubble (slowly, on purpose). */
export const RETURN_TIME = 2.5;
/** Seconds a dropped food hangs in the air before a full dragon's food heads home. */
export const LINGER_TIME = 1.2;
/** Fastest a thrown food can start floating, in px per second. */
const MAX_THROW = 600;
/** The food floats a little above the finger, so the finger doesn't hide it. */
const LIFT = 34;

/** A dropped food: it floats about until eaten, or drifts home if the dragon doesn't want it. */
export interface Floater {
  food: FoodId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  /** Set once it starts drifting home: where it started from, and progress 0–1. */
  home: { from: Point; t: number } | null;
}

/**
 * The food tray (bottom-left), the food being dragged, and dropped food floating about.
 * Drag a food to the dragon's mouth to feed it. Let go anywhere and the food floats: a hungry
 * dragon swims after it, and a full one leaves it to drift slowly back home to its bubble.
 */
export class Feeding {
  held: { food: FoodId; x: number; y: number } | null = null;
  floating: Floater[] = [];
  private lastHeld: Point | null = null;
  private throwV: Point = { x: 0, y: 0 };
  private refusedAt = -Infinity;
  private time = 0;
  private width = 0;
  private height = 0;
  /** Treats from the shop, and how many of each are in the pantry. */
  pantry: Partial<Record<FoodId, number>> = {};

  /**
   * Tray slot centers and radius for the current screen size: the everyday foods along the
   * bottom, and any treats in the pantry in a row just above them.
   */
  slots(): { food: FoodId; x: number; y: number; r: number }[] {
    const r = Math.max(24, Math.min(34, Math.min(this.width, this.height) * 0.042));
    const gap = r * 0.55;
    const row = (foods: FoodId[], y: number) =>
      foods.map((food, i) => ({ food, x: 14 + r + i * (2 * r + gap), y, r }));
    const treats = TREAT_IDS.filter((t) => (this.pantry[t] ?? 0) > 0);
    return [
      ...row(FOOD_IDS, this.height - 14 - r),
      ...row(treats, this.height - 14 - r - (2 * r + gap)),
    ];
  }

  /** Treats of a kind still in the pantry and not already out (held or floating). */
  available(food: FoodId): number {
    if (!TREAT_IDS.includes(food)) return Infinity;
    const out =
      (this.held?.food === food ? 1 : 0) +
      this.floating.filter((f) => f.food === food && !f.home).length;
    return (this.pantry[food] ?? 0) - out;
  }

  /** The tray slot under a point, if any. */
  slotAt(x: number, y: number): FoodId | null {
    for (const s of this.slots()) if (Math.hypot(x - s.x, y - s.y) <= s.r * 1.15) return s.food;
    return null;
  }

  /**
   * @param pressed where a press started, on the frame it is first seen (null otherwise)
   * @returns true while the tray has the finger (so nothing else should react to it)
   */
  update(
    dt: number,
    input: PointerState,
    pressed: Point | null,
    dragon: Feedable,
    needs: Needs,
    width: number,
    height: number,
  ): { busy: boolean; event: FeedEvent | null } {
    this.time += dt;
    this.width = width;
    this.height = height;
    const hungry = wantsFood(needs);
    this.updateFloaters(dt, hungry);

    if (pressed && !this.held) {
      const food = this.slotAt(pressed.x, pressed.y);
      if (food && this.available(food) > 0) {
        this.held = { food, x: input.x, y: input.y - LIFT };
        this.lastHeld = null;
      }
    }
    if (!this.held) {
      // Nothing in hand: a hungry dragon goes after the nearest floating food, unless the
      // finger is busy steering it.
      const meal = hungry && !input.down ? this.nearestFloater(dragon.mouth) : null;
      dragon.lure = meal ? { x: meal.x, y: meal.y } : null;
      if (meal && this.reaches(meal, dragon)) {
        this.floating.splice(this.floating.indexOf(meal), 1);
        dragon.eat(meal.food);
        dragon.lure = null;
        return { busy: false, event: { ate: meal.food } };
      }
      return { busy: false, event: null };
    }

    if (!input.down) {
      // Let go: the food floats off with a little of the throw.
      const v = this.throwV;
      const speed = Math.hypot(v.x, v.y);
      const k = speed > MAX_THROW ? MAX_THROW / speed : 1;
      this.floating.push({
        food: this.held.food,
        x: this.held.x,
        y: this.held.y,
        vx: v.x * k * 0.5,
        vy: v.y * k * 0.5,
        age: 0,
        home: null,
      });
      this.held = null;
      dragon.lure = null;
      // Full: a clear "no thanks" so it's obvious why it isn't chasing the food.
      if (!hungry) this.refuse(dragon);
      return { busy: false, event: null };
    }

    this.held.x = input.x;
    this.held.y = input.y - LIFT;
    if (this.lastHeld && dt > 0) {
      // Smoothed finger speed, so a flick sends the food floating that way.
      const k = 1 - Math.exp(-15 * dt);
      this.throwV.x += ((this.held.x - this.lastHeld.x) / dt - this.throwV.x) * k;
      this.throwV.y += ((this.held.y - this.lastHeld.y) / dt - this.throwV.y) * k;
    } else {
      this.throwV = { x: 0, y: 0 };
    }
    this.lastHeld = { x: this.held.x, y: this.held.y };
    dragon.lure = { x: this.held.x, y: this.held.y };
    if (this.reaches(this.held, dragon)) {
      if (hungry) {
        const food = this.held.food;
        dragon.eat(food);
        this.held = null;
        dragon.lure = null;
        return { busy: true, event: { ate: food } };
      }
      this.refuse(dragon);
    }
    return { busy: true, event: null };
  }

  /** Bedtime: drop whatever is held, and float every food home. */
  sendHome(): void {
    if (this.held) {
      this.floating.push({ ...this.held, vx: 0, vy: 0, age: 0, home: null });
      this.held = null;
    }
    for (const f of this.floating) if (!f.home) f.home = { from: { x: f.x, y: f.y }, t: 0 };
  }

  /** A polite head shake, at most once every 1.2 s. */
  private refuse(dragon: Feedable): void {
    if (this.time - this.refusedAt > 1.2) {
      this.refusedAt = this.time;
      dragon.refuse();
    }
  }

  private reaches(food: Point, dragon: Feedable): boolean {
    const m = dragon.mouth;
    return Math.hypot(food.x - m.x, food.y - m.y) < dragon.headRadius * 0.85;
  }

  private nearestFloater(from: Point): Floater | null {
    let best: Floater | null = null;
    let bestD = Infinity;
    for (const f of this.floating) {
      if (f.home) continue;
      const d = Math.hypot(f.x - from.x, f.y - from.y);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  /** Floating food drifts, slows down and bobs; unwanted food heads home slowly. */
  private updateFloaters(dt: number, hungry: boolean): void {
    const margin = 30;
    for (const f of this.floating) {
      f.age += dt;
      if (f.home) {
        f.home.t = Math.min(1, f.home.t + dt / RETURN_TIME);
        const slot = this.slots().find((s) => s.food === f.food) ?? this.slots()[0];
        const e = f.home.t * f.home.t * (3 - 2 * f.home.t);
        f.x = f.home.from.x + (slot.x - f.home.from.x) * e;
        // A gentle arc on the way home, so it floats rather than slides.
        f.y = f.home.from.y + (slot.y - f.home.from.y) * e - Math.sin(e * Math.PI) * 40;
        continue;
      }
      const damp = Math.exp(-1.8 * dt);
      f.vx *= damp;
      f.vy *= damp;
      f.x += f.vx * dt;
      f.y += (f.vy + Math.sin(f.age * 2.4) * 14) * dt;
      // Soft walls: stay on screen.
      if (f.x < margin) f.vx = Math.abs(f.vx);
      if (f.x > this.width - margin) f.vx = -Math.abs(f.vx);
      if (f.y < margin) f.vy = Math.abs(f.vy);
      if (f.y > this.height - margin) f.vy = -Math.abs(f.vy);
      f.x = Math.min(this.width - margin, Math.max(margin, f.x));
      f.y = Math.min(this.height - margin, Math.max(margin, f.y));
      if (!hungry && f.age > LINGER_TIME) f.home = { from: { x: f.x, y: f.y }, t: 0 };
    }
    this.floating = this.floating.filter((f) => !f.home || f.home.t < 1);
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
      // The food in its slot bobs gently, inviting a drag. It hides while being held (or, for a
      // treat, when every one is already out).
      const left = this.available(s.food);
      if (this.held?.food !== s.food || left > 0) {
        const bob = Math.sin(this.time * 2 + s.x * 0.05) * s.r * 0.05;
        ctx.globalAlpha = left > 0 ? 1 : 0.35;
        drawFood(ctx, s.food, s.x, s.y + bob, s.r * 0.6);
        ctx.globalAlpha = 1;
      }
      if (TREAT_IDS.includes(s.food)) {
        // How many are left, in a little badge.
        const n = String(Math.max(0, left));
        ctx.fillStyle = "#ff8ad8";
        ctx.beginPath();
        ctx.arc(s.x + s.r * 0.72, s.y - s.r * 0.72, s.r * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1040";
        ctx.font = `700 ${Math.round(s.r * 0.42)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n, s.x + s.r * 0.72, s.y - s.r * 0.7);
      }
    }
    const r = slots[0].r;
    for (const f of this.floating) {
      // A soft glow and a gentle tilt, so it looks like it's floating.
      const shrink = f.home ? 1.25 - 0.25 * f.home.t : 1.25;
      ctx.fillStyle = "rgba(255,240,200,0.14)";
      ctx.beginPath();
      ctx.arc(f.x, f.y, r * 0.95 * shrink, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.sin(f.age * 1.7) * 0.15);
      drawFood(ctx, f.food, 0, 0, r * 0.6 * shrink);
      ctx.restore();
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
