/** A tiny noodle dragon curled into a ring, used for the "o"s in the title. */
export interface RingDragon {
  x: number;
  y: number;
  /** Radius of the ring the body follows. */
  radius: number;
  /** Body color (a glow color from the palette). */
  color: string;
  /** Angle of the head on the ring, in radians (0 = right, -PI/2 = top). */
  headAngle: number;
  /** +1 = body runs clockwise from the head, -1 = counter-clockwise. */
  direction: 1 | -1;
  sleepy?: boolean;
}

/** How much of the ring the body covers (the rest is the gap between nose and tail). */
const BODY_SWEEP = Math.PI * 1.75;
const SEGMENTS = 28;

/** Thickness of the body at t (0 = head, 1 = tail tip): chubby near the head, thin at the tail. */
export function bodyThickness(t: number, radius: number): number {
  const max = radius * 0.62;
  const min = radius * 0.12;
  return max - (max - min) * Math.pow(t, 1.4);
}

function pointOnRing(d: RingDragon, t: number): { x: number; y: number; angle: number } {
  const angle = d.headAngle + d.direction * t * BODY_SWEEP;
  return { x: d.x + Math.cos(angle) * d.radius, y: d.y + Math.sin(angle) * d.radius, angle };
}

export function drawRingDragon(ctx: CanvasRenderingContext2D, d: RingDragon): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = d.color;
  ctx.shadowBlur = d.radius * 0.9;

  // Body: tail first so the chubbier parts sit on top.
  for (let i = SEGMENTS - 1; i >= 0; i--) {
    const a = pointOnRing(d, i / SEGMENTS);
    const b = pointOnRing(d, (i + 1) / SEGMENTS);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = bodyThickness(i / SEGMENTS, d.radius);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Back spines: little light dots along the top of the body.
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 3; i < SEGMENTS - 4; i += 4) {
    const p = pointOnRing(d, i / SEGMENTS);
    const out = bodyThickness(i / SEGMENTS, d.radius) * 0.32;
    ctx.beginPath();
    ctx.arc(
      p.x + Math.cos(p.angle) * out,
      p.y + Math.sin(p.angle) * out,
      d.radius * 0.07,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Tail tuft: a small fluffy puff at the tail tip.
  const tip = pointOnRing(d, 1);
  ctx.fillStyle = d.color;
  ctx.shadowColor = d.color;
  ctx.shadowBlur = d.radius * 0.6;
  for (let i = -1; i <= 1; i++) {
    const a = tip.angle + d.direction * Math.PI * 0.5 + i * 0.6;
    ctx.beginPath();
    ctx.ellipse(
      tip.x + Math.cos(a) * d.radius * 0.18,
      tip.y + Math.sin(a) * d.radius * 0.18,
      d.radius * 0.2,
      d.radius * 0.11,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  drawHead(ctx, d);
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, d: RingDragon): void {
  const head = pointOnRing(d, 0);
  const r = d.radius * 0.58;
  // "Forward" is where the nose points: along the ring, away from the body.
  const fwd = head.angle - d.direction * Math.PI * 0.5;
  const fx = Math.cos(fwd);
  const fy = Math.sin(fwd);
  // "Up" points out of the ring, so the face looks outward.
  const ux = Math.cos(head.angle);
  const uy = Math.sin(head.angle);

  // Horns: two little nubs on top of the head.
  ctx.strokeStyle = "#fff6d8";
  ctx.lineWidth = r * 0.28;
  for (const back of [0.15, -0.35]) {
    const bx = head.x + fx * r * back + ux * r * 0.7;
    const by = head.y + fy * r * back + uy * r * 0.7;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + ux * r * 0.45 - fx * r * 0.2, by + uy * r * 0.45 - fy * r * 0.2);
    ctx.stroke();
  }

  // Head and snout.
  ctx.fillStyle = d.color;
  ctx.shadowColor = d.color;
  ctx.shadowBlur = d.radius * 0.8;
  ctx.beginPath();
  ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    head.x + fx * r * 0.75 - ux * r * 0.15,
    head.y + fy * r * 0.75 - uy * r * 0.15,
    r * 0.6,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.shadowBlur = 0;

  // Whiskers: two wavy lines from the snout.
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = r * 0.09;
  for (const side of [1, -1]) {
    const sx = head.x + fx * r * 1.2 - ux * r * 0.1 * side;
    const sy = head.y + fy * r * 1.2 - uy * r * 0.1 * side;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      sx + fx * r * 0.7 + ux * r * 0.6 * side,
      sy + fy * r * 0.7 + uy * r * 0.6 * side,
      sx + fx * r * 1.3 - ux * r * 0.1 * side,
      sy + fy * r * 1.3 - uy * r * 0.1 * side,
    );
    ctx.stroke();
  }

  // Big sparkly eye (or a sleepy curve).
  const ex = head.x + fx * r * 0.25 + ux * r * 0.25;
  const ey = head.y + fy * r * 0.25 + uy * r * 0.25;
  if (d.sleepy) {
    ctx.strokeStyle = "#1a1040";
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.24, head.angle + Math.PI * 0.15, head.angle + Math.PI * 0.85);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#1a1040";
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex + r * 0.1, ey - r * 0.12, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - r * 0.1, ey + r * 0.1, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rosy cheek.
  ctx.fillStyle = "rgba(255,120,190,0.55)";
  ctx.beginPath();
  ctx.arc(
    head.x + fx * r * 0.55 - ux * r * 0.3,
    head.y + fy * r * 0.55 - uy * r * 0.3,
    r * 0.16,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}
