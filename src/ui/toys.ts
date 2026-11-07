import type { Needs } from "../care/needs";
import type { PointerState } from "../engine/input";
import { Spine, type Point } from "../noodle/spine";

export type ToyId = "ribbon" | "ball";
export const TOY_IDS: ToyId[] = ["ribbon", "ball"];

/** Below this Energy the dragon is too sleepy to play. */
export const PLAY_ENERGY = 25;
/** Each boop of the ball: Love up, Energy down. */
export const BOOP_LOVE = 4;
export const BOOP_ENERGY = 1.5;
/** Chasing the ribbon, per second: Love up, Energy down. */
export const RIBBON_LOVE_PER_S = 3;
export const RIBBON_ENERGY_PER_S = 1;
/** After this many boops, or this many seconds without a boop, the game is over. */
export const BOOPS_PER_GAME = 8;
export const BORED_AFTER = 6;
/** Seconds the ball takes to drift home. */
export const HOME_TIME = 2.2;

const GRAVITY = 420;
const BOUNCE = 0.72;
const MAX_THROW = 1100;
const BOOP_SPEED = 520;
const LIFT = 34;

export function wantsToPlay(needs: Needs): boolean {
  return needs.energy >= PLAY_ENERGY;
}

/** What the toys need from a dragon. */
export interface Playful {
  readonly mouth: Point;
  readonly headRadius: number;
  /** A point to chase; null when nothing to chase. */
  lure: Point | null;
  /** The ball got booped (hearts!). */
  boop(): void;
  refuse(): void;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  /** Boops so far this game, and seconds since the last boop or throw. */
  boops: number;
  idle: number;
  home: { from: Point; t: number } | null;
}

export interface PlayResult {
  /** True while a toy has the finger. */
  busy: boolean;
  love: number;
  energy: number;
}

/**
 * The toy tray (bottom-right): a ball to throw, which the dragon chases and boops, and a ribbon
 * wand to wave, whose streamer tip the dragon chases.
 */
export class Toys {
  held: { toy: ToyId; x: number; y: number } | null = null;
  ball: Ball | null = null;
  /** The ribbon's streamer while the wand is held. */
  streamer: Spine | null = null;
  private throwV: Point = { x: 0, y: 0 };
  private lastHeld: Point | null = null;
  private boopCooldown = 0;
  private refusedAt = -Infinity;
  private time = 0;
  private width = 0;
  private height = 0;

  slots(): { toy: ToyId; x: number; y: number; r: number }[] {
    const r = Math.max(24, Math.min(34, Math.min(this.width, this.height) * 0.042));
    const gap = r * 0.55;
    // Right to left: ball in the corner, ribbon next to it.
    return TOY_IDS.map((toy, i) => ({
      toy,
      x: this.width - 14 - r - (TOY_IDS.length - 1 - i) * (2 * r + gap),
      y: this.height - 14 - r,
      r,
    }));
  }

  /** Ball radius for the current screen. */
  get ballR(): number {
    return this.slots()[0].r * 0.55;
  }

  /** The tip of the ribbon streamer, which the dragon chases. */
  get ribbonTip(): Point | null {
    if (!this.streamer) return null;
    const p = this.streamer.points;
    return p[p.length - 1];
  }

  update(
    dt: number,
    input: PointerState,
    pressAt: Point | null,
    dragon: Playful,
    needs: Needs,
    width: number,
    height: number,
  ): PlayResult {
    this.time += dt;
    this.width = width;
    this.height = height;
    this.boopCooldown = Math.max(0, this.boopCooldown - dt);
    const result: PlayResult = { busy: false, love: 0, energy: 0 };
    const keen = wantsToPlay(needs);

    // Pick up: a toy from the tray, or the ball wherever it is.
    if (pressAt && !this.held) {
      const slot = this.slots().find(
        (s) => Math.hypot(pressAt.x - s.x, pressAt.y - s.y) <= s.r * 1.15,
      );
      const onBall =
        this.ball &&
        Math.hypot(pressAt.x - this.ball.x, pressAt.y - this.ball.y) < this.ballR * 2.2;
      if (onBall || (slot?.toy === "ball" && !this.ball)) {
        this.held = { toy: "ball", x: input.x, y: input.y - LIFT };
        this.ball = null;
      } else if (slot?.toy === "ribbon") {
        this.held = { toy: "ribbon", x: input.x, y: input.y - LIFT };
        this.streamer = new Spine(input.x, input.y - LIFT, 14, slot.r * 0.75, Math.PI / 4);
      }
      if (this.held) {
        this.lastHeld = null;
        this.throwV = { x: 0, y: 0 };
        if (!keen) this.refuse(dragon);
      }
    }

    if (this.held) {
      result.busy = true;
      if (!input.down) {
        if (this.held.toy === "ball") this.throwBall();
        this.held = null;
        this.streamer = null;
      } else {
        this.trackHeld(dt, input);
        if (this.held.toy === "ribbon") {
          this.streamer!.follow(this.held.x, this.held.y);
          const tip = this.ribbonTip!;
          if (keen) {
            dragon.lure = { x: tip.x, y: tip.y };
            // Love while the dragon keeps up with a moving ribbon.
            const m = dragon.mouth;
            const moving = Math.hypot(this.throwV.x, this.throwV.y) > 60;
            if (moving && Math.hypot(tip.x - m.x, tip.y - m.y) < dragon.headRadius * 2) {
              result.love += RIBBON_LOVE_PER_S * dt;
              result.energy -= RIBBON_ENERGY_PER_S * dt;
            }
          }
        }
      }
    }

    if (this.ball) this.updateBall(dt, dragon, keen, result);
    return result;
  }

  /** Bedtime: put the toys away (the ball drifts home). */
  sendHome(): void {
    if (this.held?.toy === "ball") this.throwBall();
    this.held = null;
    this.streamer = null;
    if (this.ball && !this.ball.home)
      this.ball.home = { from: { x: this.ball.x, y: this.ball.y }, t: 0 };
  }

  private trackHeld(dt: number, input: PointerState): void {
    const held = this.held!;
    held.x = input.x;
    held.y = input.y - LIFT;
    if (this.lastHeld && dt > 0) {
      const k = 1 - Math.exp(-15 * dt);
      this.throwV.x += ((held.x - this.lastHeld.x) / dt - this.throwV.x) * k;
      this.throwV.y += ((held.y - this.lastHeld.y) / dt - this.throwV.y) * k;
    }
    this.lastHeld = { x: held.x, y: held.y };
  }

  private throwBall(): void {
    const v = this.throwV;
    const speed = Math.hypot(v.x, v.y);
    const k = speed > MAX_THROW ? MAX_THROW / speed : 1;
    this.ball = {
      x: this.held!.x,
      y: this.held!.y,
      vx: v.x * k,
      vy: v.y * k,
      spin: 0,
      boops: 0,
      idle: 0,
      home: null,
    };
  }

  private updateBall(dt: number, dragon: Playful, keen: boolean, result: PlayResult): void {
    const b = this.ball!;
    if (b.home) {
      b.home.t = Math.min(1, b.home.t + dt / HOME_TIME);
      const slot = this.slots().find((s) => s.toy === "ball")!;
      const e = b.home.t * b.home.t * (3 - 2 * b.home.t);
      b.x = b.home.from.x + (slot.x - b.home.from.x) * e;
      b.y = b.home.from.y + (slot.y - b.home.from.y) * e - Math.sin(e * Math.PI) * 50;
      if (b.home.t >= 1) this.ball = null;
      return;
    }

    // Bouncy physics, staying on screen.
    const r = this.ballR;
    b.vy += GRAVITY * dt;
    const drag = Math.exp(-0.6 * dt);
    b.vx *= drag;
    b.vy *= drag;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.spin += (b.vx / r) * dt;
    if (b.x < r) [b.x, b.vx] = [r, Math.abs(b.vx) * BOUNCE];
    if (b.x > this.width - r) [b.x, b.vx] = [this.width - r, -Math.abs(b.vx) * BOUNCE];
    if (b.y < r) [b.y, b.vy] = [r, Math.abs(b.vy) * BOUNCE];
    if (b.y > this.height - r) {
      b.y = this.height - r;
      b.vy = -Math.abs(b.vy) * BOUNCE;
      b.vx *= 0.9; // a little rolling friction on the floor
    }

    b.idle += dt;
    if (keen && b.boops < BOOPS_PER_GAME) {
      dragon.lure = { x: b.x, y: b.y };
      const m = dragon.mouth;
      if (this.boopCooldown === 0 && Math.hypot(b.x - m.x, b.y - m.y) < dragon.headRadius + r) {
        // Boop! Nudge the ball away from the snout and up into the air.
        const dx = b.x - m.x;
        const dy = b.y - m.y;
        const len = Math.hypot(dx, dy) || 1;
        b.vx = (dx / len) * BOOP_SPEED * 0.8;
        b.vy = (dy / len) * BOOP_SPEED * 0.5 - BOOP_SPEED * 0.9;
        b.boops++;
        b.idle = 0;
        this.boopCooldown = 0.4;
        result.love += BOOP_LOVE;
        result.energy -= BOOP_ENERGY;
        dragon.boop();
      }
    } else if (!keen && b.idle < dt * 1.5) {
      this.refuse(dragon);
    }
    // Game over (enough boops, bored, or too sleepy): the ball drifts home.
    const done = b.boops >= BOOPS_PER_GAME || b.idle > BORED_AFTER || (!keen && b.idle > 2);
    if (done) b.home = { from: { x: b.x, y: b.y }, t: 0 };
  }

  private refuse(dragon: Playful): void {
    if (this.time - this.refusedAt > 1.2) {
      this.refusedAt = this.time;
      dragon.refuse();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const slots = this.slots();
    for (const s of slots) {
      const glow = ctx.createRadialGradient(s.x, s.y, s.r * 0.5, s.x, s.y, s.r * 1.5);
      glow.addColorStop(0, "rgba(183,160,255,0.22)");
      glow.addColorStop(1, "rgba(183,160,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(20,14,60,0.85)";
      ctx.strokeStyle = "rgba(183,160,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const bob = Math.sin(this.time * 2 + s.x * 0.05) * s.r * 0.05;
      if (s.toy === "ball" && !this.ball && this.held?.toy !== "ball") {
        drawBall(ctx, s.x, s.y + bob, s.r * 0.55, this.time * 0.5);
      }
      if (s.toy === "ribbon" && this.held?.toy !== "ribbon") drawWand(ctx, s.x, s.y + bob, s.r);
    }
    if (this.ball) drawBall(ctx, this.ball.x, this.ball.y, this.ballR, this.ball.spin);
    if (this.held?.toy === "ball") drawBall(ctx, this.held.x, this.held.y, this.ballR * 1.1, 0);
    if (this.held?.toy === "ribbon" && this.streamer) {
      drawStreamer(ctx, this.streamer, slots[0].r, this.time);
      drawWand(ctx, this.held.x, this.held.y + slots[0].r * 0.5, slots[0].r);
    }
  }
}

/** A glowing beach-ball: pink, white and cyan wedges that spin as it rolls. */
function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(255,138,216,0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(spin);
  const colors = ["#ff8ad8", "#ffffff", "#7af3ff", "#ffffff", "#ffd27a", "#ffffff"];
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
    ctx.closePath();
    ctx.fill();
  });
  ctx.rotate(-spin);
  ctx.strokeStyle = "#d9549f";
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The ribbon wand: a short stick with a gold star on top. */
function drawWand(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#c98a5a";
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, r * 0.5);
  ctx.lineTo(r * 0.1, -r * 0.2);
  ctx.stroke();
  // A little pink ribbon curl in the tray.
  ctx.strokeStyle = "#ff8ad8";
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(r * 0.1, -r * 0.2);
  ctx.bezierCurveTo(r * 0.6, -r * 0.1, r * 0.2, r * 0.4, r * 0.55, r * 0.45);
  ctx.stroke();
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r * 0.3 : r * 0.13;
    const px = r * 0.12 + Math.cos(a) * rr;
    const py = -r * 0.32 + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The silky streamer: a tapered, gently rippling ribbon from pink to lavender. */
function drawStreamer(
  ctx: CanvasRenderingContext2D,
  streamer: Spine,
  r: number,
  time: number,
): void {
  const p = streamer.points;
  ctx.lineCap = "round";
  for (let i = 0; i < p.length - 1; i++) {
    const t = i / (p.length - 1);
    const ripple = Math.sin(time * 9 - i * 0.9) * r * 0.08;
    ctx.strokeStyle = `hsl(${320 - t * 60} 95% ${78 - t * 6}%)`;
    ctx.lineWidth = r * (0.5 - t * 0.32);
    ctx.beginPath();
    ctx.moveTo(p[i].x, p[i].y + ripple);
    ctx.lineTo(p[i + 1].x, p[i + 1].y + ripple);
    ctx.stroke();
  }
}
