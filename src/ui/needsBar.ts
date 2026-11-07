import { FLOOR, MAX, NEED_NAMES, type NeedName, type Needs } from "../care/needs";

/** One short word under each orb (Jacob's choice). */
export const LABELS: Record<NeedName, string> = {
  fullness: "Food",
  happiness: "Love",
  energy: "Energy",
  cleanliness: "Hygiene",
};

/** Below this, a need gently asks for attention (a soft wobble every few seconds). */
export const LOW = 40;
/** How quickly the liquid glides to new levels (so a snack tops it up smoothly). */
const GLIDE_RATE = 4;

const COLORS: Record<NeedName, { glow: string; ring: string; icon: string }> = {
  fullness: { glow: "255,210,122", ring: "#ffd27a", icon: "#ffe6ad" },
  happiness: { glow: "255,138,216", ring: "#ff8ad8", icon: "#ffb3e6" },
  energy: { glow: "183,160,255", ring: "#b7a0ff", icon: "#d9ccff" },
  cleanliness: { glow: "122,243,255", ring: "#7af3ff", icon: "#bff9ff" },
};

/**
 * How full the orb's liquid is, in whole-percent stages from 1% to 100%. The cozy floor shows
 * as a 1% puddle (never fully empty) and a perfectly cared-for need as 100%.
 */
export function fillLevel(value: number): number {
  const t = Math.min(1, Math.max(0, (value - FLOOR) / (MAX - FLOOR)));
  return Math.round(1 + t * 99) / 100;
}

/** Height of the liquid surface inside a bubble of radius r (r = bottom, -r = top). */
export function surfaceY(level: number, r: number): number {
  return r - 2 * r * level;
}

/** Brightness of a bubble: low needs look sleepier and dimmer, never alarming. */
export function brightness(value: number): number {
  return 0.55 + 0.45 * fillLevel(value);
}

/** A soft side-to-side wobble for low needs: a short shake every 4 seconds, still otherwise. */
export function wobble(value: number, time: number, offset: number): number {
  if (value >= LOW) return 0;
  const t = (time + offset) % 4;
  return t < 0.6 ? Math.sin(t * Math.PI * 5) * (1 - t / 0.6) * 0.18 : 0;
}

/**
 * The four need bubbles in the top-left corner: little glass orbs of glowing liquid that drain
 * as a need drops, each with one short word under it. No numbers, no red.
 */
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

  /** Current on-screen value of a need (for tests and the gliding liquid). */
  shownValue(name: NeedName): number {
    return this.shown?.[name] ?? 0;
  }

  draw(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    if (!this.shown) return;
    const r = Math.max(17, Math.min(26, Math.min(screenW, screenH) * 0.032));
    const gap = r * 0.9;
    ctx.font = `600 ${Math.round(r * 0.55)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    NEED_NAMES.forEach((name, i) => {
      const x = 14 + r + i * (r * 2 + gap);
      const y = 14 + r;
      this.drawBubble(ctx, name, x, y, r, this.shown![name], i);
      ctx.fillStyle = COLORS[name].icon;
      ctx.fillText(LABELS[name], x, y + r + 6);
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

    // Soft glow outside the glass, brighter when fuller.
    const level = fillLevel(value);
    const glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.6);
    glow.addColorStop(0, `rgba(${c.glow},${(0.35 * level).toFixed(3)})`);
    glow.addColorStop(1, `rgba(${c.glow},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // The dark inside of the glass orb.
    ctx.fillStyle = "rgba(20,14,60,0.88)";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Glowing liquid, clipped to the orb, with a gently rolling wave on top.
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.clip();
    const top = surfaceY(level, r);
    const wave = r * 0.07;
    const phase = this.time * 2.2 + index * 1.3;
    ctx.beginPath();
    ctx.moveTo(-r, r);
    for (let i = 0; i <= 12; i++) {
      const x = -r + (2 * r * i) / 12;
      ctx.lineTo(x, top + Math.sin(phase + i * 0.7) * wave);
    }
    ctx.lineTo(r, r);
    ctx.closePath();
    const liquid = ctx.createLinearGradient(0, top, 0, r);
    liquid.addColorStop(0, `rgba(${c.glow},0.95)`);
    liquid.addColorStop(1, `rgba(${c.glow},0.78)`);
    ctx.fillStyle = liquid;
    ctx.fill();
    // A thin bright line on the surface.
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.stroke();
    ctx.restore();

    // Glass rim and a little shine, so it reads as a potion orb.
    ctx.strokeStyle = c.ring;
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.2, r * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, Math.PI * 1.1, Math.PI * 1.4);
    ctx.stroke();

    // Icon floats on top; a dark halo keeps it readable over the liquid.
    ctx.shadowColor = "rgba(20,14,60,0.9)";
    ctx.shadowBlur = r * 0.25;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    const s = r * 0.5;
    if (name === "fullness") drawBowl(ctx, s);
    else if (name === "happiness") drawHeart(ctx, s);
    else if (name === "energy") drawMoon(ctx, s);
    else drawBubbles(ctx, s);
    ctx.restore();
  }
}

export function drawBowl(ctx: CanvasRenderingContext2D, s: number): void {
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

export function drawHeart(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.8);
  ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.6, -s * 1.05, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.6, -s * 1.05, s * 1.3, -s * 0.1, 0, s * 0.8);
  ctx.fill();
}

export function drawMoon(ctx: CanvasRenderingContext2D, s: number): void {
  // A crescent drawn as one shape (outer arc, then the inner bite back), plus a tiny star, so it
  // looks right over the liquid as well as the dark glass.
  ctx.beginPath();
  ctx.arc(-s * 0.1, 0, s * 0.85, -0.25 * Math.PI, 1.55 * Math.PI, false);
  ctx.arc(s * 0.3, -s * 0.25, s * 0.7, 1.12 * Math.PI, 0.25 * Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.6, s * 0.45, s * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBubbles(ctx: CanvasRenderingContext2D, s: number): void {
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

/** Draws a need's icon (white, about 2s across) at the current origin. */
export function drawNeedIcon(ctx: CanvasRenderingContext2D, name: NeedName, s: number): void {
  if (name === "fullness") drawBowl(ctx, s);
  else if (name === "happiness") drawHeart(ctx, s);
  else if (name === "energy") drawMoon(ctx, s);
  else drawBubbles(ctx, s);
}
