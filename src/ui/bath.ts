import type { Needs } from "../care/needs";
import type { PointerState } from "../engine/input";
import type { Point } from "../noodle/spine";

/** Hygiene gained per pixel scrubbed (about +35 for 500 px of scrubbing). */
export const CLEAN_PER_PX = 1 / 14;
/** Most Hygiene a bath gives per second, however hard you scrub. */
export const MAX_CLEAN_PER_SECOND = 20;
/** A soap bubble pops out every this many pixels scrubbed. */
const BUBBLE_EVERY = 18;
const LIFT = 30;

/** What the bath needs from a dragon. */
export interface Bathable {
  /** Where on the body a point is (0 nose – 1 tail), or null if not on the dragon. */
  spotAt(x: number, y: number): number | null;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

export interface BathResult {
  /** True while the sponge has the finger. */
  busy: boolean;
  /** True while the sponge is on the dragon (moving or not). */
  scrubbing: boolean;
  clean: number;
  /** True on the frame Hygiene reaches 100: squeaky clean! */
  squeaky: boolean;
}

/** The sponge button, beside the bedtime button above the toys. */
export function spongeButton(width: number, height: number): Point & { r: number } {
  const r = Math.max(24, Math.min(34, Math.min(width, height) * 0.042));
  const gap = r * 0.55;
  return { x: width - 14 - r - (2 * r + gap), y: height - 14 - r - (2 * r + gap), r };
}

/** Bath time: grab the sponge and scrub the dragon. Foamy bubbles, smudges fade, Hygiene fills. */
export class Bath {
  held: Point | null = null;
  bubbles: Bubble[] = [];
  private last: Point = { x: 0, y: 0 };
  private bubbleRub = 0;
  private time = 0;
  /**
   * Cleaning allowed but not yet used. Fingers report movement less often than the game updates,
   * so the speed cap builds up between reports instead of being lost on the quiet updates.
   */
  private allowance = 0;

  update(
    dt: number,
    input: PointerState,
    pressAt: Point | null,
    dragon: Bathable,
    needs: Needs,
    width: number,
    height: number,
  ): BathResult {
    this.time += dt;
    this.allowance = Math.min(
      this.allowance + MAX_CLEAN_PER_SECOND * dt,
      MAX_CLEAN_PER_SECOND * 0.25,
    );
    const result: BathResult = { busy: false, scrubbing: false, clean: 0, squeaky: false };
    for (const b of this.bubbles) {
      b.age += dt;
      b.x += b.vx * dt + Math.sin(b.age * 5 + b.r) * 8 * dt;
      b.y += b.vy * dt;
    }
    this.bubbles = this.bubbles.filter((b) => b.age < b.life);

    const btn = spongeButton(width, height);
    if (pressAt && !this.held && Math.hypot(pressAt.x - btn.x, pressAt.y - btn.y) <= btn.r * 1.15) {
      this.held = { x: input.x, y: input.y - LIFT };
      this.last = { ...this.held };
    }
    if (!this.held) return result;
    result.busy = true;
    if (!input.down) {
      this.held = null;
      return result;
    }
    this.held = { x: input.x, y: input.y - LIFT };
    const d = Math.hypot(this.held.x - this.last.x, this.held.y - this.last.y);
    this.last = { ...this.held };
    result.scrubbing = dragon.spotAt(this.held.x, this.held.y) !== null;
    if (d > 0 && result.scrubbing) {
      const before = needs.cleanliness;
      result.clean = Math.max(0, Math.min(d * CLEAN_PER_PX, this.allowance, 100 - before));
      this.allowance -= result.clean;
      if (before < 99.5 && before + result.clean >= 99.5) result.squeaky = true;
      this.bubbleRub += d;
      while (this.bubbleRub >= BUBBLE_EVERY) {
        this.bubbleRub -= BUBBLE_EVERY;
        this.bubbles.push({
          x: this.held.x + (Math.random() - 0.5) * 30,
          y: this.held.y + (Math.random() - 0.5) * 20,
          r: 6 + Math.random() * 11,
          vx: (Math.random() - 0.5) * 40,
          vy: -20 - Math.random() * 50,
          age: 0,
          life: 1.2 + Math.random() * 1.2,
        });
      }
    }
    return result;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Soap bubbles: see-through, with a rainbow sheen and a shine.
    for (const b of this.bubbles) {
      const fade = Math.min(1, (b.life - b.age) * 2);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(200,240,255,0.25)";
      ctx.strokeStyle = `hsla(${(b.x + b.y + this.time * 60) % 360}, 90%, 85%, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const btn = spongeButton(width, height);
    const glow = ctx.createRadialGradient(btn.x, btn.y, btn.r * 0.5, btn.x, btn.y, btn.r * 1.5);
    glow.addColorStop(0, "rgba(122,243,255,0.22)");
    glow.addColorStop(1, "rgba(122,243,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.r * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20,14,60,0.85)";
    ctx.strokeStyle = "rgba(122,243,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!this.held)
      drawSponge(ctx, btn.x, btn.y + Math.sin(this.time * 2) * btn.r * 0.04, btn.r * 0.55);
    else drawSponge(ctx, this.held.x, this.held.y, btn.r * 0.75);
  }
}

/** A squishy yellow sponge with holes and a dollop of foam on top. */
function drawSponge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15);
  ctx.fillStyle = "#ffe07a";
  ctx.strokeStyle = "#d9a93c";
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.beginPath();
  ctx.roundRect(-s, -s * 0.6, s * 2, s * 1.2, s * 0.35);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e8b94a";
  for (const [hx, hy, hr] of [
    [-0.5, -0.1, 0.13],
    [0.1, 0.2, 0.1],
    [0.55, -0.2, 0.12],
    [-0.1, -0.3, 0.07],
    [0.4, 0.3, 0.07],
  ]) {
    ctx.beginPath();
    ctx.arc(hx * s, hy * s, hr * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  for (const [fx, fr] of [
    [-0.5, 0.28],
    [-0.1, 0.36],
    [0.35, 0.3],
    [0.7, 0.2],
  ]) {
    ctx.beginPath();
    ctx.arc(fx * s, -s * 0.62, fr * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
