import { MAX, NEED_NAMES, type NeedName, type Needs } from "../care/needs";

/** Below this, a need gently asks for attention (a soft wobble every few seconds). */
export const LOW = 40;
/** How quickly the rings glide to new values (so a snack fills the ring smoothly). */
const GLIDE_RATE = 4;

const COLORS: Record<NeedName, { glow: string; ring: string; icon: string }> = {
  fullness: { glow: "255,210,122", ring: "#ffd27a", icon: "#ffe6ad" },
  happiness: { glow: "255,138,216", ring: "#ff8ad8", icon: "#ffb3e6" },
  energy: { glow: "183,160,255", ring: "#b7a0ff", icon: "#d9ccff" },
  cleanliness: { glow: "122,243,255", ring: "#7af3ff", icon: "#bff9ff" },
};

/** Ring fill (0–1) for a need value. */
export function ringFill(value: number): number {
  return Math.min(1, Math.max(0, value / MAX));
}

/** Brightness of a bubble: low needs look sleepier and dimmer, never alarming. */
export function brightness(value: number): number {
  return 0.55 + 0.45 * ringFill(value);
}

/** A soft side-to-side wobble for low needs: a short shake every 4 seconds, still otherwise. */
export function wobble(value: number, time: number, offset: number): number {
  if (value >= LOW) return 0;
  const t = (time + offset) % 4;
  return t < 0.6 ? Math.sin(t * Math.PI * 5) * (1 - t / 0.6) * 0.18 : 0;
}

/** The four need bubbles in the top-left corner. No numbers, no words, no red. */
export class NeedsBar {
  private shown: Needs | null = null;
  private time = 0;

  update(dt: number, needs: Needs): void {
    this.time += dt;
    if (!this.shown) {
      this.shown = { ...needs };
      return;
    }
    const k = 1 - Math.exp(-GLIDE_RATE * dt);
    for (const n of NEED_NAMES) this.shown[n] += (needs[n] - this.shown[n]) * k;
  }

  /** Current on-screen value of a need (for tests and the gliding rings). */
  shownValue(name: NeedName): number {
    return this.shown?.[name] ?? 0;
  }

  draw(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    if (!this.shown) return;
    const r = Math.max(17, Math.min(26, Math.min(screenW, screenH) * 0.032));
    const gap = r * 0.75;
    NEED_NAMES.forEach((name, i) => {
      const x = 14 + r + i * (r * 2 + gap);
      const y = 14 + r;
      this.drawBubble(ctx, name, x, y, r, this.shown![name], i);
    });
  }

  private drawBubble(
    ctx: CanvasRenderingContext2D,
    name: NeedName,
    x: number,
    y: number,
    r: number,
    value: number,
    index: number,
  ): void {
    const c = COLORS[name];
    const light = brightness(value);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wobble(value, this.time, index * 0.9));
    ctx.globalAlpha = light;

    // Soft glow, then the dark bubble the icon sits in.
    const glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.6);
    glow.addColorStop(0, `rgba(${c.glow},${(0.35 * ringFill(value)).toFixed(3)})`);
    glow.addColorStop(1, `rgba(${c.glow},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20,14,60,0.85)";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Ring: a faint track, then the filled part, starting at the top and going clockwise.
    const ringW = r * 0.18;
    ctx.lineCap = "round";
    ctx.lineWidth = ringW;
    ctx.strokeStyle = `rgba(${c.glow},0.18)`;
    ctx.beginPath();
    ctx.arc(0, 0, r - ringW / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = c.ring;
    ctx.beginPath();
    ctx.arc(0, 0, r - ringW / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringFill(value));
    ctx.stroke();

    ctx.fillStyle = c.icon;
    ctx.strokeStyle = c.icon;
    const s = r * 0.5;
    if (name === "fullness") drawBowl(ctx, s);
    else if (name === "happiness") drawHeart(ctx, s);
    else if (name === "energy") drawMoon(ctx, s, c.icon);
    else drawBubbles(ctx, s);
    ctx.restore();
  }
}

function drawBowl(ctx: CanvasRenderingContext2D, s: number): void {
  // Noodles: three wavy lines rising out of a round bowl.
  ctx.lineWidth = s * 0.16;
  for (const dx of [-0.35, 0, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, s * 0.05);
    ctx.quadraticCurveTo((dx + 0.18) * s, -s * 0.3, dx * s, -s * 0.55);
    ctx.quadraticCurveTo((dx - 0.18) * s, -s * 0.8, dx * s, -s * 1.0);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, 0);
  ctx.lineTo(s * 0.95, 0);
  ctx.quadraticCurveTo(s * 0.85, s * 0.85, 0, s * 0.85);
  ctx.quadraticCurveTo(-s * 0.85, s * 0.85, -s * 0.95, 0);
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.8);
  ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.6, -s * 1.05, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.6, -s * 1.05, s * 1.3, -s * 0.1, 0, s * 0.8);
  ctx.fill();
}

function drawMoon(ctx: CanvasRenderingContext2D, s: number, color: string): void {
  // A crescent: a full circle with a dark circle bitten out, plus a tiny star.
  ctx.beginPath();
  ctx.arc(-s * 0.1, 0, s * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20,14,60,1)";
  ctx.beginPath();
  ctx.arc(s * 0.3, -s * 0.25, s * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(s * 0.6, s * 0.45, s * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawBubbles(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.lineWidth = s * 0.14;
  for (const [x, y, r] of [
    [-0.25, 0.2, 0.55],
    [0.5, -0.35, 0.35],
    [0.45, 0.55, 0.2],
  ]) {
    ctx.beginPath();
    ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2);
    ctx.stroke();
    // A shine on each bubble.
    ctx.beginPath();
    ctx.arc((x - r * 0.35) * s, (y - r * 0.35) * s, r * s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}
