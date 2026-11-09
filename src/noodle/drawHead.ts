import { rimOf } from "./drawBody";
import type { Face } from "./face";
import { CLASSIC_LOOK, hsl, shade, type DragonLook } from "./look";
import type { Point } from "./spine";

export interface HeadColors {
  head: string;
  rim: string;
  snout: string;
  horn: string;
  hornShade: string;
  eye: string;
  iris: string;
  cheek: string;
  mane: string;
  maneLight: string;
}

/** Head colors that match a dragon's look. */
export function headColors(look: DragonLook): HeadColors {
  return {
    head: hsl(look.body),
    rim: hsl(rimOf(look.body)),
    snout: hsl(shade(look.body, 14, -10)),
    horn: hsl(look.horn),
    hornShade: hsl(shade(look.horn, -14, -6)),
    eye: "#1a1040",
    // Jewel eyes: a deep version of the accent color.
    iris: hsl({ h: look.accent.h, s: 80, l: 42 }),
    cheek: hsl(look.accent, 0.6),
    mane: hsl(look.accent),
    maneLight: hsl(shade(look.accent, 10, 8)),
  };
}

/** Where the mouth is, in head space (as a share of the head radius): under the snout. */
export const MOUTH = { x: 0.98, y: 0.36 };

/**
 * A cute Eastern dragon head: a round crown with a tapered muzzle pushed forward, swept-back
 * horns, a flame-like mane and big almond eyes. Always upright, with the snout on the side it is
 * heading. Drawn in local coordinates facing right; mirroring handles facing left.
 */
export function drawHead(
  ctx: CanvasRenderingContext2D,
  at: Point,
  r: number,
  face: Face,
  c = headColors(CLASSIC_LOOK),
): void {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(face.facing, 1);
  ctx.rotate(face.tilt + face.shakeAngle);
  const rimWidth = Math.max(1.5, r * 0.09);
  ctx.lineWidth = rimWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Mane: flame-shaped tufts streaming back from behind the head.
  const tufts = [
    { a: -2.35, len: 1.05 },
    { a: -2.8, len: 1.2 },
    { a: 2.95, len: 1.0 },
    { a: 2.45, len: 0.7 },
  ];
  for (const pass of [0, 1]) {
    for (const t of tufts) {
      const base = { x: Math.cos(t.a) * r * 0.55, y: Math.sin(t.a) * r * 0.5 };
      const len = r * t.len * (pass ? 0.78 : 1);
      const tip = { x: base.x + Math.cos(t.a) * len, y: base.y + Math.sin(t.a) * len - r * 0.15 };
      const side = r * (pass ? 0.2 : 0.32);
      const nx = -Math.sin(t.a) * side;
      const ny = Math.cos(t.a) * side;
      ctx.beginPath();
      ctx.moveTo(base.x + nx, base.y + ny);
      ctx.quadraticCurveTo(
        (base.x + tip.x) / 2 + nx * 1.4,
        (base.y + tip.y) / 2 + ny * 1.4 + r * 0.12,
        tip.x,
        tip.y,
      );
      ctx.quadraticCurveTo(
        (base.x + tip.x) / 2 - nx * 0.6,
        (base.y + tip.y) / 2 - ny * 0.6,
        base.x - nx,
        base.y - ny,
      );
      ctx.closePath();
      ctx.fillStyle = pass ? c.maneLight : c.mane;
      ctx.fill();
    }
  }

  // Horns: two long antlers sweeping back, each with a little branch; the far one paler.
  for (const [x, scale, far] of [
    [-0.5, 0.8, true],
    [-0.08, 1, false],
  ] as const) {
    ctx.save();
    ctx.translate(x * r, -0.6 * r);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0.2 * r, 0.1 * r);
    ctx.bezierCurveTo(0.2 * r, -0.45 * r, -0.4 * r, -0.75 * r, -1.15 * r, -0.85 * r);
    ctx.bezierCurveTo(-0.6 * r, -0.6 * r, -0.2 * r, -0.4 * r, -0.2 * r, 0.12 * r);
    ctx.closePath();
    // The branch: a short tine curling up from the middle.
    ctx.moveTo(-0.3 * r, -0.62 * r);
    ctx.quadraticCurveTo(-0.32 * r, -0.95 * r, -0.12 * r, -1.1 * r);
    ctx.quadraticCurveTo(-0.15 * r, -0.85 * r, -0.05 * r, -0.5 * r);
    ctx.closePath();
    ctx.fillStyle = far ? c.hornShade : c.horn;
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.lineWidth = rimWidth / scale;
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = rimWidth;

  // Head and muzzle as one shape: a round crown, a bridge sloping down to a rounded nose that
  // tips up a little, and a soft jaw curving back under the cheek.
  const headPath = () => {
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, r * 0.05);
    ctx.bezierCurveTo(-r * 0.98, -r * 0.75, r * 0.2, -r * 1.02, r * 0.55, -r * 0.42);
    ctx.bezierCurveTo(r * 0.8, -r * 0.24, r * 1.18, -r * 0.24, r * 1.36, -r * 0.14);
    ctx.bezierCurveTo(r * 1.58, -r * 0.04, r * 1.56, r * 0.28, r * 1.32, r * 0.32);
    ctx.bezierCurveTo(r * 1.05, r * 0.4, r * 0.8, r * 0.46, r * 0.55, r * 0.66);
    ctx.bezierCurveTo(r * 0.2, r * 0.98, -r * 0.92, r * 0.86, -r * 0.95, r * 0.05);
    ctx.closePath();
  };
  headPath();
  ctx.fillStyle = c.head;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Pale chin and lower jaw.
  ctx.beginPath();
  ctx.ellipse(r * 0.7, r * 0.62, r * 0.85, r * 0.32, -0.12, 0, Math.PI * 2);
  ctx.fillStyle = c.snout;
  ctx.fill();
  ctx.restore();
  headPath();
  ctx.strokeStyle = c.rim;
  ctx.stroke();

  // Nostril: a little curl on top of the nose.
  ctx.beginPath();
  ctx.arc(r * 1.3, -r * 0.04, r * 0.07, Math.PI * 0.9, Math.PI * 2.2);
  ctx.strokeStyle = c.rim;
  ctx.lineWidth = Math.max(1.2, r * 0.065);
  ctx.stroke();

  const mx = MOUTH.x * r;
  const my = MOUTH.y * r;
  const open = face.mouthOpen;
  ctx.lineWidth = Math.max(1.2, r * 0.065);
  if (open > 0.08) {
    // Chomping: the jaw drops open from the corner of the mouth, with a pink tongue.
    const drop = r * 0.36 * Math.min(open, 1.3);
    ctx.beginPath();
    ctx.moveTo(r * 0.6, r * 0.34);
    ctx.lineTo(r * 1.32, r * 0.26);
    ctx.quadraticCurveTo(r * 1.36, r * 0.32 + drop * 0.6, r * 1.22, r * 0.32 + drop);
    ctx.quadraticCurveTo(r * 0.9, r * 0.4 + drop, r * 0.6, r * 0.34);
    ctx.closePath();
    ctx.fillStyle = c.eye;
    ctx.fill();
    // The lower jaw's edge, so the open mouth stands out on a dark night.
    ctx.strokeStyle = c.rim;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      r * 0.98,
      r * 0.32 + drop * 0.8,
      r * 0.18,
      r * 0.04 + drop * 0.25,
      -0.08,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#ff8fb1";
    ctx.fill();
  } else if (face.mouthShape === "smile") {
    // Happy: a wide open grin along the muzzle with a pink tongue.
    ctx.beginPath();
    ctx.moveTo(r * 0.55, r * 0.3);
    ctx.quadraticCurveTo(r * 0.9, r * 0.82, r * 1.3, r * 0.27);
    ctx.quadraticCurveTo(r * 0.92, r * 0.4, r * 0.55, r * 0.3);
    ctx.closePath();
    ctx.fillStyle = c.eye;
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r * 0.9, r * 0.52, r * 0.14, r * 0.06, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8fb1";
    ctx.fill();
  } else if (face.mouthShape === "pout") {
    // Hungry or sad: the mouth line turns down at the corner.
    ctx.beginPath();
    ctx.moveTo(r * 1.28, r * 0.28);
    ctx.quadraticCurveTo(r * 0.95, r * 0.34, r * 0.66, r * 0.5);
    ctx.strokeStyle = c.eye;
    ctx.stroke();
  } else {
    // A gentle smiling mouth line along the muzzle, curling up at the cheek.
    ctx.beginPath();
    ctx.moveTo(r * 1.28, r * 0.28);
    ctx.quadraticCurveTo(r * 0.9, r * 0.42, r * 0.68, r * 0.34);
    ctx.quadraticCurveTo(r * 0.6, r * 0.31, r * 0.6, r * 0.25);
    ctx.strokeStyle = c.eye;
    ctx.stroke();
  }

  // A little beard tuft under the chin.
  ctx.beginPath();
  ctx.moveTo(r * 0.3, r * 0.82);
  ctx.quadraticCurveTo(r * 0.3, r * 1.15, r * 0.05, r * 1.32);
  ctx.quadraticCurveTo(r * 0.12, r * 1.12, -r * 0.05, r * 0.88);
  ctx.closePath();
  ctx.fillStyle = c.mane;
  ctx.fill();

  // Cheek blush under the eye; puffed up while chewing.
  const puff = face.chewLeft > 0 ? 1.45 : face.mouthShape === "smile" ? 1.2 : 1;
  ctx.fillStyle = c.cheek;
  ctx.beginPath();
  ctx.ellipse(r * 0.22, r * 0.4, r * 0.2 * puff, r * 0.11 * puff, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes: the near one big, the far one peeking over the bridge of the nose (three-quarter view).
  // Looking is in screen space, so undo the mirroring for the x offset.
  const lookX = face.look.x * face.facing;
  const eye = (x: number, y: number, size: number) =>
    drawEye(
      ctx,
      x,
      y,
      size,
      lookX,
      face.look.y,
      face.blink,
      c,
      face.asleep,
      face.droop,
      face.pleading,
    );
  eye(-r * 0.3, -r * 0.3, r * 0.22);
  eye(r * 0.14, -r * 0.14, r * 0.34);

  ctx.restore();
}

/**
 * A big almond dragon eye, slanting up toward the back, with a brow ridge above it, a jewel
 * colored iris, a soft slit pupil and two sparkles.
 */
function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  lookX: number,
  lookY: number,
  blink: number,
  c: HeadColors,
  sleeping = false,
  droop = 0,
  pleading = false,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.22);
  // Brow ridge: a bold curve over the eye that sweeps back.
  ctx.beginPath();
  ctx.moveTo(size * 0.95, -size * 0.85);
  ctx.quadraticCurveTo(0, -size * 1.45, -size * 1.25, -size * 0.95);
  ctx.strokeStyle = c.rim;
  ctx.lineWidth = Math.max(1.5, size * 0.22);
  ctx.stroke();
  if (blink > 0.75) {
    // Shut: a happy "^" curve for a blink, a droopy "︶" curve while asleep.
    ctx.beginPath();
    if (sleeping) {
      ctx.moveTo(size * 0.9, 0);
      ctx.quadraticCurveTo(0, size * 0.6, -size * 1.0, -size * 0.1);
    } else {
      ctx.moveTo(size * 0.9, size * 0.15);
      ctx.quadraticCurveTo(0, -size * 0.6, -size * 1.0, size * 0.05);
    }
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = Math.max(1.5, size * 0.26);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const open = 1 - blink;
  ctx.scale(1, open);
  // The almond: pointed at both corners, rounder on top.
  const almond = () => {
    ctx.beginPath();
    ctx.moveTo(size * 1.0, size * 0.15);
    ctx.bezierCurveTo(
      size * 0.7,
      -size * 1.25,
      -size * 0.85,
      -size * 1.2,
      -size * 1.1,
      -size * 0.1,
    );
    ctx.bezierCurveTo(-size * 0.8, size * 1.0, size * 0.65, size * 1.0, size * 1.0, size * 0.15);
    ctx.closePath();
  };
  almond();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Iris and pupil slide toward what the dragon looks at.
  const ix = lookX * size * 0.3;
  const iy = lookY * size * 0.25;
  ctx.beginPath();
  ctx.arc(ix, iy, size * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = c.iris;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix, iy, size * 0.72, 0, Math.PI * 2);
  ctx.strokeStyle = c.eye;
  ctx.lineWidth = size * 0.12;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ix, iy, size * (pleading ? 0.42 : 0.26), size * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.eye;
  ctx.fill();
  // Sparkles: one big, one small (extra big and shiny for pleading puppy eyes).
  const shine = pleading ? 1.45 : 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ix + size * 0.24, iy - size * 0.3, size * 0.24 * shine, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix - size * 0.24, iy + size * 0.28, size * 0.11 * shine, 0, Math.PI * 2);
  ctx.fill();
  if (pleading) {
    ctx.beginPath();
    ctx.arc(ix + size * 0.32, iy + size * 0.18, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  if (droop > 0.02) {
    // Tired: a heavy eyelid in the head color slides down over the top of the eye.
    const lid = -size * 1.0 + size * 2.0 * droop;
    ctx.fillStyle = c.head;
    ctx.fillRect(-size * 1.2, -size * 1.3, size * 2.4, lid + size * 1.3);
    ctx.beginPath();
    ctx.moveTo(-size * 1.2, lid);
    ctx.quadraticCurveTo(0, lid + size * 0.2, size * 1.2, lid);
    ctx.strokeStyle = c.rim;
    ctx.lineWidth = Math.max(1.2, size * 0.16);
    ctx.stroke();
  }
  ctx.restore();
  // Outline the almond, so the eye reads clearly on any body color.
  almond();
  ctx.strokeStyle = c.eye;
  ctx.lineWidth = Math.max(1.2, size * 0.12);
  ctx.stroke();
  ctx.restore();
}
