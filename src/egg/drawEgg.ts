import { hsl, seededRandom, shade, type DragonLook } from "../noodle/look";
import type { Point } from "../noodle/spine";
import { HATCH_TIME, type Egg } from "./egg";

/** The egg outline: rounder at the bottom, narrower at the top. Size is the egg's half-height. */
function eggPath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.62, -s, s * 0.85, s * 0.05, s * 0.78, s * 0.42);
  ctx.bezierCurveTo(s * 0.7, s * 0.9, s * 0.35, s, 0, s);
  ctx.bezierCurveTo(-s * 0.35, s, -s * 0.7, s * 0.9, -s * 0.78, s * 0.42);
  ctx.bezierCurveTo(-s * 0.85, s * 0.05, -s * 0.62, -s, 0, -s);
  ctx.closePath();
}

/** The zig-zag crack line around the middle; `upTo` (0–1) is how far round it has spread. */
function crackPoints(s: number, upTo: number): Point[] {
  const pts: Point[] = [];
  const n = 9;
  for (let i = 0; i <= Math.round(n * upTo); i++) {
    const x = -s * 0.78 + (i / n) * s * 1.56;
    pts.push({ x, y: -s * 0.05 + (i % 2 ? -s * 0.13 : s * 0.05) });
  }
  return pts;
}

/**
 * Draws the egg at `at`. It's tinted with the dragon's colors (a hint of who is inside), glows
 * and wiggles as it warms, shows its cracks, and bursts open while hatching.
 */
export function drawEgg(
  ctx: CanvasRenderingContext2D,
  egg: Egg,
  at: Point,
  s: number,
  look: DragonLook,
): void {
  const t = egg.time;
  const w = egg.wiggle;
  const jolt =
    egg.sinceCrack < 0.25 ? Math.sin(egg.sinceCrack * 60) * 0.12 * (1 - egg.sinceCrack / 0.25) : 0;
  const tilt = Math.sin(t * (3 + w * 6)) * 0.12 * w + jolt;
  const shell = shade(look.body, 6, -12);
  const rim = shade(look.body, -25, -10);

  // Nest: a ring of soft twigs and leaves under the egg.
  ctx.save();
  ctx.translate(at.x, at.y + s * 0.85);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.08, s * 1.05, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a5a3c";
  ctx.lineWidth = Math.max(2, s * 0.07);
  ctx.lineCap = "round";
  const r = seededRandom(5);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.22);
    ctx.lineTo(Math.cos(a + 0.6) * s * (0.7 + r() * 0.3), Math.sin(a + 0.6) * s * 0.18);
    ctx.stroke();
  }
  ctx.restore();

  const hatching = egg.phase === "hatching" || egg.phase === "done";
  const h = hatching ? Math.min(1, egg.hatchClock / HATCH_TIME) : 0;

  // Warm glow around it, growing with warmth; a bright flash when it hatches.
  const glowA = 0.1 + 0.4 * egg.warmth + (hatching ? Math.sin(h * Math.PI) * 0.6 : 0);
  const g = ctx.createRadialGradient(at.x, at.y, s * 0.3, at.x, at.y, s * (2 + egg.warmth + h * 2));
  g.addColorStop(0, `hsla(${look.accent.h} 95% 80% / ${glowA.toFixed(3)})`);
  g.addColorStop(1, `hsla(${look.accent.h} 95% 80% / 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(at.x, at.y, s * (2 + egg.warmth + h * 2), 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(at.x, at.y + s * 0.85);
  ctx.rotate(tilt);
  ctx.translate(0, -s * 0.85);

  const paintShell = () => {
    const grad = ctx.createLinearGradient(-s, -s, s, s);
    grad.addColorStop(0, hsl(shade(shell, 14)));
    grad.addColorStop(1, hsl(shell));
    ctx.fillStyle = grad;
    ctx.fill();
    // Speckles in the dragon's pattern color.
    ctx.save();
    ctx.clip();
    const sp = seededRandom(look.seed);
    ctx.fillStyle = hsl(look.pattern, 0.75);
    for (let i = 0; i < 11; i++) {
      ctx.beginPath();
      ctx.ellipse(
        (sp() - 0.5) * s * 1.4,
        (sp() - 0.5) * s * 1.8,
        s * (0.06 + sp() * 0.1),
        s * (0.05 + sp() * 0.08),
        sp() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // A band in the accent color.
    ctx.fillStyle = hsl(look.accent, 0.5);
    ctx.fillRect(-s, s * 0.35, s * 2, s * 0.12);
    ctx.restore();
    // Outline the egg itself (the speckles above replaced the current path).
    eggPath(ctx, s);
    ctx.strokeStyle = hsl(rim);
    ctx.lineWidth = Math.max(1.5, s * 0.05);
    ctx.stroke();
  };

  if (!hatching) {
    eggPath(ctx, s);
    paintShell();
    // Shine.
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, -s * 0.45, s * 0.12, s * 0.25, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Cracks spread further with each tap.
    if (egg.cracks > 0) {
      const pts = crackPoints(s, 0.4 + (egg.cracks / 3) * 0.6);
      ctx.strokeStyle = hsl(shade(rim, -15));
      ctx.lineWidth = Math.max(2, s * 0.07);
      ctx.lineJoin = "miter";
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      // Light shining through the cracks.
      ctx.strokeStyle = `hsla(${look.accent.h} 100% 85% / 0.8)`;
      ctx.lineWidth = Math.max(1, s * 0.02);
      ctx.stroke();
    }
  } else {
    // Bottom half stays in the nest...
    ctx.save();
    ctx.beginPath();
    ctx.rect(-s * 1.2, -s * 0.05, s * 2.4, s * 1.3);
    ctx.clip();
    eggPath(ctx, s);
    paintShell();
    ctx.restore();
    // ...and the top half pops up and tumbles away.
    ctx.save();
    ctx.translate(s * 0.9 * h, -s * 2.2 * Math.sin(h * Math.PI * 0.8) - s * 0.3 * h);
    ctx.rotate(h * 2.4);
    ctx.globalAlpha = Math.max(0, 1 - h * 1.1);
    ctx.beginPath();
    ctx.rect(-s * 1.2, -s * 1.2, s * 2.4, s * 1.15);
    ctx.clip();
    eggPath(ctx, s);
    paintShell();
    ctx.restore();
    // Shell crumbs and sparkles bursting out.
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i - 4.5) * 0.28;
      const d = s * (0.6 + h * 2.2);
      ctx.globalAlpha = Math.max(0, 1 - h);
      ctx.fillStyle = i % 2 ? hsl(shell) : "#fff6c9";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, -s * 0.1 + Math.sin(a) * d, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/**
 * A wordless hint: a little glowing finger rubbing back and forth (to warm) or tapping (to crack).
 */
export function drawEggHint(ctx: CanvasRenderingContext2D, egg: Egg, at: Point, s: number): void {
  if (egg.phase !== "warming" && egg.phase !== "cracking") return;
  const t = egg.time;
  const rubbing = egg.phase === "warming";
  const x = at.x + (rubbing ? Math.sin(t * 4) * s * 0.5 : s * 0.15);
  const press = rubbing ? 0 : Math.max(0, Math.sin(t * 5));
  const y = at.y - s * 0.1 + press * 6;
  ctx.globalAlpha = 0.85;
  if (!rubbing && press > 0.8) {
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 14 + (press - 0.8) * 60, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.roundRect(x - 6, y, 12, 26, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
}
