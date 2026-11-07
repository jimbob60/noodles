import { bodyOutline, shineLine, traceSmoothLoop } from "./body";
import type { Spine } from "./spine";

export interface BodyColors {
  body: string;
  /** Soft glow around the edge. */
  halo: string;
  /** Darker rim for a clear, cute outline. */
  rim: string;
  shine: string;
}

export const CYAN_BODY: BodyColors = {
  body: "#7af3ff",
  halo: "rgba(122,243,255,0.13)",
  rim: "#2fb4cc",
  shine: "rgba(255,255,255,0.55)",
};

/** Half-width of the chubbiest part, from the spine spacing. */
export function bodyHalfWidth(spine: Spine): number {
  return spine.segment * 1.7;
}

/** Phase 7 look: a chubby tapered body with a soft glowing edge, a rim and a shine. */
export function drawBody(
  ctx: CanvasRenderingContext2D,
  spine: Spine,
  colors = CYAN_BODY,
  puff = 1,
): void {
  const hw = bodyHalfWidth(spine) * puff;
  const outline = bodyOutline(spine.points, hw);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  traceSmoothLoop(ctx, outline);
  // Soft glowing edge: see-through strokes behind the body, stacked so the glow fades outward
  // (much cheaper than a blur on every frame).
  ctx.strokeStyle = colors.halo;
  for (const width of [1.6, 1.0, 0.5]) {
    ctx.lineWidth = hw * width;
    ctx.stroke();
  }
  ctx.fillStyle = colors.body;
  ctx.fill();
  ctx.strokeStyle = colors.rim;
  ctx.lineWidth = Math.max(1.5, hw * 0.12);
  ctx.stroke();

  // Shine along the top of the body, so it reads as round rather than flat.
  const shine = shineLine(spine.points, hw);
  ctx.beginPath();
  ctx.moveTo(shine[0].x, shine[0].y);
  for (let i = 1; i < shine.length - 1; i++) {
    const mx = (shine[i].x + shine[i + 1].x) / 2;
    const my = (shine[i].y + shine[i + 1].y) / 2;
    ctx.quadraticCurveTo(shine[i].x, shine[i].y, mx, my);
  }
  ctx.strokeStyle = colors.shine;
  ctx.lineWidth = hw * 0.28;
  ctx.stroke();
}
