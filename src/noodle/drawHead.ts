import { rimOf } from "./drawBody";
import type { Face } from "./face";
import { CLASSIC_LOOK, hsl, shade, type DragonLook, type Hsl } from "./look";
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
  /** Faint fish-scale lines, the same as on the body. */
  scale: string;
  mane: string;
  maneLight: string;
  /** Head shape from the genes: horn length and branches, and mane length. */
  hornLength: number;
  hornBranches: number;
  maneLength: number;
  /** All the genes, for the rest of the head's shape (snout, eyes, marks, teeth…). */
  look: DragonLook;
}

/** The mane's color from its gene: the accent, the pattern or the horn color. */
function maneOf(look: DragonLook): Hsl {
  if (look.maneColor === "pattern") return look.pattern;
  if (look.maneColor === "horn") return shade(look.horn, -6);
  return look.accent;
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
    // Jewel eyes: a deep color from the eye gene.
    iris: hsl({ h: look.eyeHue, s: 80, l: 42 }),
    cheek: hsl(look.accent, 0.6),
    scale: hsl(rimOf(look.body), look.scaleStrength),
    mane: hsl(maneOf(look)),
    maneLight: hsl(shade(maneOf(look), 10, 8)),
    hornLength: look.hornLength,
    hornBranches: look.hornBranches,
    maneLength: look.maneLength,
    look,
  };
}

/** Where the mouth is, in head space (as a share of the head radius): under the snout. */
export const MOUTH = { x: 0.98, y: 0.36 };

/** Moves a point on the muzzle (in head radii) for a longer or shorter snout. */
export function muzzleX(x: number, snoutLength: number): number {
  return x <= 0.55 ? x : 0.55 + (x - 0.55) * snoutLength;
}

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
  /** How grown up, 0 to 1: babies have little nub horns and a short mane. */
  grown = 1,
): void {
  const hornSize = (0.45 + 0.55 * grown) * c.hornLength;
  const maneSize = (0.6 + 0.4 * grown) * c.maneLength;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(face.facing, 1);
  ctx.rotate(face.tilt + face.shakeAngle);
  const rimWidth = Math.max(1.5, r * 0.09);
  // The snout gene stretches or shortens only the muzzle (in front of the eye).
  const X = (x: number) => r * muzzleX(x, c.look.snoutLength);
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
      const len = r * t.len * maneSize * (pass ? 0.78 : 1);
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

  // Horns, from the genes: branching antlers, curly ram horns or straight spikes; the far one
  // paler.
  for (const [x, scale, far] of [
    [-0.5, 0.8, true],
    [-0.08, 1, false],
  ] as const) {
    ctx.save();
    ctx.translate(x * r, -0.6 * r);
    ctx.scale(scale * hornSize, scale * hornSize);
    ctx.beginPath();
    if (c.look.hornStyle === "spike") {
      // A straight, smooth spike pointing back.
      ctx.moveTo(0.18 * r, 0.1 * r);
      ctx.quadraticCurveTo(0.08 * r, -0.5 * r, -0.75 * r, -1.15 * r);
      ctx.quadraticCurveTo(-0.28 * r, -0.45 * r, -0.2 * r, 0.12 * r);
      ctx.closePath();
    } else if (c.look.hornStyle === "curl") {
      // A curly ram's horn: up and over the back of the head, curling round at the end.
      ctx.moveTo(0.15 * r, 0.1 * r);
      ctx.bezierCurveTo(0.25 * r, -0.75 * r, -0.8 * r, -1.0 * r, -0.88 * r, -0.38 * r);
      ctx.bezierCurveTo(-0.92 * r, 0.02 * r, -0.55 * r, 0.12 * r, -0.48 * r, -0.08 * r);
      ctx.bezierCurveTo(-0.6 * r, -0.25 * r, -0.55 * r, -0.6 * r, -0.2 * r, -0.5 * r);
      ctx.quadraticCurveTo(-0.15 * r, -0.2 * r, -0.2 * r, 0.12 * r);
      ctx.closePath();
    } else {
      ctx.moveTo(0.2 * r, 0.1 * r);
      ctx.bezierCurveTo(0.2 * r, -0.45 * r, -0.4 * r, -0.75 * r, -1.15 * r, -0.85 * r);
      ctx.bezierCurveTo(-0.6 * r, -0.6 * r, -0.2 * r, -0.4 * r, -0.2 * r, 0.12 * r);
      ctx.closePath();
      // Branches: short tines curling up from the horn (a baby's are too small to show).
      const tines = grown < 0.3 ? 0 : c.hornBranches;
      for (let k = 0; k < tines; k++) {
        const at = k === 0 ? -0.3 : -0.62;
        const lift = k === 0 ? -0.62 : -0.76;
        ctx.moveTo(at * r, lift * r);
        ctx.quadraticCurveTo(
          (at - 0.02) * r,
          (lift - 0.33) * r,
          (at + 0.18) * r,
          (lift - 0.48) * r,
        );
        ctx.quadraticCurveTo(
          (at + 0.15) * r,
          (lift - 0.23) * r,
          (at + 0.25) * r,
          (lift + 0.12) * r,
        );
        ctx.closePath();
      }
    }
    ctx.fillStyle = far ? c.hornShade : c.horn;
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.lineWidth = rimWidth / (scale * hornSize);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = rimWidth;

  if (c.look.frills) {
    // Cheek frills: webbed fins fanning down and back from behind the jaw, with darker ribs.
    const fx = -r * 0.45;
    const fy = r * 0.5;
    const ends = [2.15, 2.5, 2.85, 3.2].map((a, k) => {
      const len = r * (0.95 - k * 0.08);
      return { x: fx + Math.cos(a) * len, y: fy + Math.sin(a) * len };
    });
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    for (let k = 0; k < ends.length; k++) {
      const e = ends[k];
      if (k === 0) ctx.lineTo(e.x, e.y);
      else {
        const p = ends[k - 1];
        ctx.quadraticCurveTo(
          (p.x + e.x) / 2 + (fx - (p.x + e.x) / 2) * 0.18,
          (p.y + e.y) / 2 + (fy - (p.y + e.y) / 2) * 0.18,
          e.x,
          e.y,
        );
      }
    }
    ctx.closePath();
    ctx.fillStyle = c.maneLight;
    ctx.fill();
    ctx.strokeStyle = c.mane;
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.stroke();
    for (const e of ends) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }
    ctx.lineWidth = rimWidth;
  }

  // Head and muzzle as one shape: a round crown, a bridge sloping down to a rounded nose that
  // tips up a little, and a soft jaw curving back under the cheek.
  const headPath = () => {
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, r * 0.05);
    ctx.bezierCurveTo(-r * 0.98, -r * 0.75, r * 0.2, -r * 1.02, r * 0.55, -r * 0.42);
    ctx.bezierCurveTo(X(0.8), -r * 0.24, X(1.18), -r * 0.24, X(1.36), -r * 0.14);
    ctx.bezierCurveTo(X(1.58), -r * 0.04, X(1.56), r * 0.28, X(1.32), r * 0.32);
    ctx.bezierCurveTo(X(1.05), r * 0.4, X(0.8), r * 0.46, r * 0.55, r * 0.66);
    ctx.bezierCurveTo(r * 0.2, r * 0.98, -r * 0.92, r * 0.86, -r * 0.95, r * 0.05);
    ctx.closePath();
  };
  headPath();
  ctx.fillStyle = c.head;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Fish scales over the crown and the back of the head, matching the body's: rows of little
  // arcs, rounded edge toward the neck. They stop before the muzzle so the face stays clean.
  ctx.strokeStyle = c.scale;
  ctx.lineWidth = Math.max(1, r * 0.045);
  const sz = r * 0.2;
  for (let row = 0; row < 7; row++) {
    const y = -r * 0.95 + row * sz * 1.25;
    const shift = row % 2 === 0 ? 0 : sz;
    for (let x = -r * 1.1 + shift; x < r * 0.5; x += sz * 2) {
      // Fewer, smaller scales toward the face.
      const near = Math.max(0, Math.min(1, (x + r * 0.2) / (r * 0.7)));
      if (near > 0.85) continue;
      ctx.beginPath();
      ctx.arc(x, y, sz * (1 - near * 0.4), Math.PI * 0.5 + 0.35, Math.PI * 1.5 - 0.35);
      ctx.stroke();
    }
  }
  // Pale chin and lower jaw.
  ctx.beginPath();
  ctx.ellipse(X(0.7), r * 0.62, r * 0.85, r * 0.32, -0.12, 0, Math.PI * 2);
  ctx.fillStyle = c.snout;
  ctx.fill();
  ctx.restore();
  headPath();
  ctx.strokeStyle = c.rim;
  ctx.stroke();

  // Nostril: a little curl on top of the nose.
  ctx.beginPath();
  ctx.arc(X(1.3), -r * 0.04, r * 0.07, Math.PI * 0.9, Math.PI * 2.2);
  ctx.strokeStyle = c.rim;
  ctx.lineWidth = Math.max(1.2, r * 0.065);
  ctx.stroke();

  const open = face.mouthOpen;
  ctx.lineWidth = Math.max(1.2, r * 0.065);
  if (open > 0.08) {
    // Chomping: the jaw drops open from the corner of the mouth, with a pink tongue.
    const drop = r * 0.36 * Math.min(open, 1.3);
    ctx.beginPath();
    ctx.moveTo(X(0.6), r * 0.34);
    ctx.lineTo(X(1.32), r * 0.26);
    ctx.quadraticCurveTo(X(1.36), r * 0.32 + drop * 0.6, X(1.22), r * 0.32 + drop);
    ctx.quadraticCurveTo(X(0.9), r * 0.4 + drop, X(0.6), r * 0.34);
    ctx.closePath();
    ctx.fillStyle = c.eye;
    ctx.fill();
    // The lower jaw's edge, so the open mouth stands out on a dark night.
    ctx.strokeStyle = c.rim;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      X(0.98),
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
    ctx.quadraticCurveTo(X(0.9), r * 0.82, X(1.3), r * 0.27);
    ctx.quadraticCurveTo(X(0.92), r * 0.4, r * 0.55, r * 0.3);
    ctx.closePath();
    ctx.fillStyle = c.eye;
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(X(0.9), r * 0.52, r * 0.14, r * 0.06, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8fb1";
    ctx.fill();
  } else if (face.mouthShape === "pout") {
    // Hungry or sad: the mouth line turns down at the corner.
    ctx.beginPath();
    ctx.moveTo(X(1.28), r * 0.28);
    ctx.quadraticCurveTo(X(0.95), r * 0.34, X(0.66), r * 0.5);
    ctx.strokeStyle = c.eye;
    ctx.stroke();
  } else {
    // A gentle smiling mouth line along the muzzle, curling up at the cheek.
    ctx.beginPath();
    ctx.moveTo(X(1.28), r * 0.28);
    ctx.quadraticCurveTo(X(0.9), r * 0.42, X(0.68), r * 0.34);
    ctx.quadraticCurveTo(X(0.6), r * 0.31, X(0.6), r * 0.25);
    ctx.strokeStyle = c.eye;
    ctx.stroke();
  }

  drawTeeth(ctx, r, X, face, c);

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
  if (c.look.freckles) {
    ctx.fillStyle = c.rim;
    for (const [fx, fy] of [
      [0.08, 0.3],
      [0.22, 0.27],
      [0.36, 0.31],
      [0.16, 0.38],
      [0.3, 0.4],
    ])
      (ctx.beginPath(), ctx.arc(r * fx, r * fy, r * 0.028, 0, Math.PI * 2), ctx.fill());
  }
  if (c.look.mark !== "none") drawMark(ctx, c.look.mark, r * 0.47, -r * 0.52, r * 0.12, c);

  // One big eye: the head is seen in side profile. Looking is in screen space, so undo the
  // mirroring for the x offset.
  drawEye(
    ctx,
    r * 0.08,
    -r * 0.18,
    r * 0.36 * c.look.eyeSize,
    face.look.x * face.facing,
    face.look.y,
    face.blink,
    c,
    face.asleep,
    face.droop,
    face.pleading,
  );

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

/** A little mark on the forehead, from the genes: a gem, a star, a moon or a heart. */
function drawMark(
  ctx: CanvasRenderingContext2D,
  mark: DragonLook["mark"],
  x: number,
  y: number,
  s: number,
  c: HeadColors,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (mark === "gem") {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.7, 0);
    ctx.closePath();
  } else if (mark === "star") {
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? s * 0.45 : s;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  } else if (mark === "moon") {
    ctx.arc(0, 0, s, Math.PI * 0.3, Math.PI * 1.7);
    ctx.arc(s * 0.4, -s * 0.05, s * 0.75, Math.PI * 1.55, Math.PI * 0.45, true);
    ctx.closePath();
  } else {
    ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo(-s * 1.2, 0, -s * 0.6, -s, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.6, -s, s * 1.2, 0, 0, s * 0.85);
  }
  ctx.fillStyle = c.mane;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, s * 0.18);
  ctx.stroke();
  ctx.restore();
}

/**
 * Teeth, from the genes: none showing, two little fangs, a grin full of sharp little teeth, or
 * one snaggle-tooth poking up. They follow the mouth: along the lip when it is shut, along the
 * top (and, chomping, the bottom) of an open mouth.
 */
function drawTeeth(
  ctx: CanvasRenderingContext2D,
  r: number,
  X: (x: number) => number,
  face: Face,
  c: HeadColors,
): void {
  const style = c.look.mouthStyle;
  if (style === "plain") return;
  const open = face.mouthOpen;
  const drop = r * 0.36 * Math.min(open, 1.3);
  const grin = open <= 0.08 && face.mouthShape === "smile";
  // The upper lip from the nose end (t = 0) back to the corner (t = 1).
  const upper =
    open > 0.08
      ? { ax: X(1.3), ay: r * 0.27, bx: X(0.66), by: r * 0.34 }
      : grin
        ? { ax: X(1.24), ay: r * 0.3, bx: X(0.72), by: r * 0.37 }
        : { ax: X(1.26), ay: r * 0.29, bx: X(0.72), by: r * 0.35 };
  const lower = { ax: X(1.2), ay: r * 0.31 + drop, bx: X(0.8), by: r * 0.37 + drop * 0.75 };
  const tooth = (line: typeof upper, t: number, size: number, dir: 1 | -1) => {
    const x = line.ax + (line.bx - line.ax) * t;
    const y = line.ay + (line.by - line.ay) * t;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.45, y);
    ctx.lineTo(x + size * 0.12, y + dir * size);
    ctx.lineTo(x + size * 0.45, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  ctx.save();
  ctx.fillStyle = "#fffaf0";
  ctx.strokeStyle = c.rim;
  ctx.lineWidth = Math.max(0.8, r * 0.03);
  ctx.lineJoin = "round";
  if (style === "toothy") {
    // Lots of sharp little teeth: a row along the top, and a row along the bottom when chomping.
    for (let k = 0; k < 6; k++) tooth(upper, 0.06 + k * 0.17, r * 0.11, 1);
    if (open > 0.08) for (let k = 0; k < 5; k++) tooth(lower, 0.08 + k * 0.2, r * 0.1, -1);
  } else if (style === "fangs") {
    tooth(upper, 0.22, r * 0.17, 1);
    tooth(upper, 0.62, r * 0.15, 1);
  } else {
    // Snaggle-tooth: one bottom tooth poking up over the lip.
    const line =
      open > 0.08 ? lower : { ...upper, ay: upper.ay + r * 0.05, by: upper.by + r * 0.05 };
    tooth(line, 0.3, r * 0.15, -1);
  }
  ctx.restore();
}
