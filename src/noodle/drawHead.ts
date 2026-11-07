import type { Face } from "./face";
import type { Point } from "./spine";

export interface HeadColors {
  head: string;
  rim: string;
  snout: string;
  horn: string;
  eye: string;
  cheek: string;
}

export const CYAN_HEAD: HeadColors = {
  head: "#7af3ff",
  rim: "#2fb4cc",
  snout: "#c4fbff",
  horn: "#fff3c9",
  eye: "#1a1040",
  cheek: "rgba(255,120,190,0.6)",
};

/**
 * Phase 8 look: a round chibi head, always upright, with the snout on the side it is heading.
 * Drawn in local coordinates facing right; mirroring handles facing left.
 */
export function drawHead(
  ctx: CanvasRenderingContext2D,
  at: Point,
  r: number,
  face: Face,
  c = CYAN_HEAD,
): void {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(face.facing, 1);
  ctx.rotate(face.tilt);
  const rimWidth = Math.max(1.5, r * 0.09);
  ctx.lineWidth = rimWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Horn nubs, behind the head.
  for (const [x, lean] of [
    [-0.05, -0.12],
    [-0.5, -0.3],
  ]) {
    ctx.beginPath();
    ctx.moveTo((x - 0.2) * r, -0.7 * r);
    ctx.quadraticCurveTo((x + lean) * r, -1.65 * r, (x + lean + 0.04) * r, -1.42 * r);
    ctx.quadraticCurveTo((x + 0.24) * r, -1.05 * r, (x + 0.2) * r, -0.7 * r);
    ctx.closePath();
    ctx.fillStyle = c.horn;
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.stroke();
  }

  // Head: a soft, slightly wide round shape.
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.head;
  ctx.fill();
  ctx.strokeStyle = c.rim;
  ctx.stroke();

  // Snout: a pale bump pushed out the front, with two little nostrils.
  ctx.beginPath();
  ctx.ellipse(r * 0.72, r * 0.28, r * 0.52, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.snout;
  ctx.fill();
  ctx.strokeStyle = c.rim;
  ctx.stroke();
  ctx.fillStyle = c.rim;
  for (const dx of [0.88, 1.05]) {
    ctx.beginPath();
    ctx.arc(dx * r, r * 0.12, r * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny "w" mouth under the snout.
  ctx.beginPath();
  ctx.moveTo(r * 0.55, r * 0.5);
  ctx.quadraticCurveTo(r * 0.64, r * 0.62, r * 0.72, r * 0.5);
  ctx.quadraticCurveTo(r * 0.8, r * 0.62, r * 0.89, r * 0.5);
  ctx.strokeStyle = c.eye;
  ctx.lineWidth = Math.max(1.2, r * 0.07);
  ctx.stroke();

  // Cheek blush between eye and snout.
  ctx.fillStyle = c.cheek;
  ctx.beginPath();
  ctx.ellipse(r * 0.2, r * 0.42, r * 0.18, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes: the far one a bit smaller and further back, for a three-quarter view.
  // Looking is in screen space, so undo the mirroring for the x offset.
  const lookX = face.look.x * face.facing;
  drawEye(ctx, r * 0.3, -r * 0.16, r * 0.34, lookX, face.look.y, face.blink, c);
  drawEye(ctx, -r * 0.36, -r * 0.2, r * 0.28, lookX, face.look.y, face.blink, c);

  ctx.restore();
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  lookX: number,
  lookY: number,
  blink: number,
  c: HeadColors,
): void {
  if (blink > 0.75) {
    // Shut: a happy closed-eye curve.
    ctx.beginPath();
    ctx.arc(x, y + size * 0.15, size * 0.75, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = Math.max(1.5, size * 0.28);
    ctx.stroke();
    return;
  }
  const open = 1 - blink;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, open);
  // White of the eye, then a big dark iris that slides toward what the dragon looks at.
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.92, size * 1.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const ix = lookX * size * 0.28;
  const iy = lookY * size * 0.32;
  ctx.beginPath();
  ctx.ellipse(ix, iy, size * 0.72, size * 0.9, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.eye;
  ctx.fill();
  // Sparkles: one big, one small.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ix + size * 0.22, iy - size * 0.32, size * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix - size * 0.24, iy + size * 0.3, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
