import type { Point } from "../noodle/spine";

/**
 * Phase 46, juice: the little extras that make every tap feel rewarding. Ripples and sparkles
 * where a button is tapped, a gentle buzz on phones that can vibrate, sparkle bursts for happy
 * moments, a soft dip to dark between scenes, and springy pop-ins for the cards.
 */

/** A springy squash-and-stretch wobble: `t` runs 1 → 0 as it settles. Returns [sx, sy]. */
export function boing(t: number, strength = 0.18): [number, number] {
  if (t <= 0) return [1, 1];
  const f = Math.sin((1 - t) * Math.PI * 3) * t * strength;
  return [1 + f, 1 - f];
}

/** A dip's darkness at time `t` (0–1 through it): fades in, holds a moment, fades out. */
export function dipAlpha(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  if (t < 0.35) return t / 0.35;
  if (t < 0.5) return 1;
  return 1 - (t - 0.5) / 0.5;
}

interface Ripple {
  x: number;
  y: number;
  t: number;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  size: number;
  color: string;
}

const SPARK_COLORS = ["#ffe08a", "#9dffc8", "#7af3ff", "#ff8ad8", "#ffffff"];

export class Juice {
  private ripples: Ripple[] = [];
  private sparks: Spark[] = [];
  private dip: { t: number; dur: number; color: string } | null = null;
  /** Buzz on taps (the ⚙️ menu can turn it off). */
  vibration = true;

  /** A button was tapped: a ripple ring, a few tiny sparkles, and a short buzz. */
  tap(at: Point): void {
    this.ripples.push({ x: at.x, y: at.y, t: 0 });
    this.burst(at, 5, 70);
    this.buzz(8);
  }

  /** A sparkle burst (a happy moment: hatching, a goal, a new page, a coin gift). */
  burst(at: Point, count = 14, speed = 160, colors = SPARK_COLORS): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.sparks.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.3,
        t: 0,
        life: 0.5 + Math.random() * 0.4,
        size: 2.5 + Math.random() * 3,
        color: colors[i % colors.length],
      });
    }
    // Keep it light on slower tablets.
    if (this.sparks.length > 160) this.sparks.splice(0, this.sparks.length - 160);
  }

  /** A short vibration, where the device can (most Android phones; not iPhones). */
  buzz(ms: number | number[]): void {
    if (!this.vibration) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      // Not allowed here: no buzz.
    }
  }

  /** A soft dip to dark and back, to smooth a change of scene. */
  transition(dur = 0.6, color = "8,6,30"): void {
    this.dip = { t: 0, dur, color };
  }

  get busy(): boolean {
    return this.ripples.length > 0 || this.sparks.length > 0 || this.dip !== null;
  }

  update(dt: number): void {
    for (const r of this.ripples) r.t += dt / 0.45;
    this.ripples = this.ripples.filter((r) => r.t < 1);
    for (const s of this.sparks) {
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 260 * dt;
      s.vx *= 1 - 2 * dt;
    }
    this.sparks = this.sparks.filter((s) => s.t < s.life);
    if (this.dip) {
      this.dip.t += dt / this.dip.dur;
      if (this.dip.t >= 1) this.dip = null;
    }
  }

  /** Draws the ripples and sparkles (above the game, under the cards). */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.ripples.length && !this.sparks.length) return;
    ctx.save();
    for (const r of this.ripples) {
      ctx.strokeStyle = `rgba(255,240,200,${(0.7 * (1 - r.t)).toFixed(3)})`;
      ctx.lineWidth = 3 * (1 - r.t) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 10 + r.t * 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const s of this.sparks) {
      const k = 1 - s.t / s.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = s.color;
      // A little four-pointed twinkle.
      const z = s.size * (0.6 + 0.4 * k);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - z * 1.6);
      ctx.quadraticCurveTo(s.x, s.y, s.x + z * 1.6, s.y);
      ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + z * 1.6);
      ctx.quadraticCurveTo(s.x, s.y, s.x - z * 1.6, s.y);
      ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - z * 1.6);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Draws the scene-change dip over everything on the canvas. */
  drawDip(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.dip) return;
    const a = dipAlpha(this.dip.t) * 0.85;
    if (a <= 0) return;
    ctx.fillStyle = `rgba(${this.dip.color},${a.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Cards (the shop, family, Dragondex and the rest) pop in with a little spring, and every button
 * squishes when pressed and buzzes. Done once, for the whole page, so no card needs to know.
 */
export function juiceTheCards(juice: Juice): void {
  const style = document.createElement("style");
  style.textContent = `
button { transition: transform 0.08s ease-out, filter 0.12s; }
button:active:not(:disabled) { transform: scale(0.93); filter: brightness(1.12); }
@keyframes nd-shade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes nd-card-in {
  0% { transform: scale(0.88) translateY(12px); opacity: 0 }
  60% { transform: scale(1.03) translateY(-2px); opacity: 1 }
  100% { transform: scale(1) translateY(0) }
}
.nd-pop { animation: nd-shade-in 0.18s ease-out both; }
.nd-pop > * { animation: nd-card-in 0.32s cubic-bezier(.2,.9,.3,1.2) both; }`;
  document.head.append(style);
  new MutationObserver((changes) => {
    for (const c of changes)
      for (const n of c.addedNodes)
        if (n instanceof HTMLElement && /-panel$/.test(n.id)) n.classList.add("nd-pop");
  }).observe(document.body, { childList: true });
  document.addEventListener(
    "pointerdown",
    (e) => {
      if ((e.target as HTMLElement | null)?.closest?.("button:not(:disabled)")) juice.buzz(6);
    },
    { capture: true },
  );
}
