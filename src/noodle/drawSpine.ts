import { palette } from "../palette";
import type { Spine } from "./spine";

/** Phase 6 look: a glowing ribbon through the spine points, with a bead at every joint. */
export function drawSpine(ctx: CanvasRenderingContext2D, spine: Spine, pressed: boolean): void {
  const p = spine.points;
  const s = spine.segment;

  // A smooth curve through the points (through the midpoints, bending at each point).
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2;
    const my = (p[i].y + p[i + 1].y) / 2;
    ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my);
  }
  ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Two strokes instead of a blur: a wide soft glow, then a bright core. Much cheaper per frame.
  ctx.strokeStyle = "rgba(122,243,255,0.16)";
  ctx.lineWidth = s * 2.2;
  ctx.stroke();
  ctx.strokeStyle = palette.glowCyan;
  ctx.lineWidth = s * 0.45;
  ctx.stroke();

  // Beads at the joints, shrinking toward the tail.
  for (let i = p.length - 1; i >= 1; i--) {
    const t = i / (p.length - 1);
    ctx.fillStyle = i % 2 ? palette.glowPink : palette.glowMint;
    ctx.beginPath();
    ctx.arc(p[i].x, p[i].y, s * (0.42 - 0.27 * t), 0, Math.PI * 2);
    ctx.fill();
  }

  // Head: the glowing dot from phase 5, now leading the noodle.
  const r = s * (pressed ? 1.15 : 1);
  const head = p[0];
  const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r * 2.4);
  glow.addColorStop(0, "rgba(122,243,255,0.5)");
  glow.addColorStop(1, "rgba(122,243,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(head.x, head.y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.glowCyan;
  ctx.beginPath();
  ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(head.x - r * 0.3, head.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}
