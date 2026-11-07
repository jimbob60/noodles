import type { Point } from "./spine";

/** Thinnest part of the tail, as a share of the widest part. */
const TAIL_MIN = 0.14;
/** Where along the body (0 = head, 1 = tail) it is chubbiest. */
const CHUBBIEST = 0.16;

/**
 * Body half-width at t (0 = head, 1 = tail tip), as a share of the widest point:
 * a round head end, chubbiest just behind the head, then a long gentle taper to the tail.
 */
export function bodyProfile(t: number): number {
  const c = Math.min(Math.max(t, 0), 1);
  if (c < CHUBBIEST) return 0.86 + 0.14 * Math.sin((c / CHUBBIEST) * (Math.PI / 2));
  const u = (c - CHUBBIEST) / (1 - CHUBBIEST);
  return TAIL_MIN + (1 - TAIL_MIN) * Math.pow(1 - u, 0.85);
}

/** Direction of the body at point i (head-to-tail), from its neighbours. */
function tangent(p: Point[], i: number): Point {
  const a = p[Math.max(i - 1, 0)];
  const b = p[Math.min(i + 1, p.length - 1)];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
}

/**
 * Outline around the spine as one closed loop: down the left side, round the tail, up the right
 * side and round the head. `halfWidth` is the half-width at the chubbiest point.
 */
export function bodyOutline(spine: Point[], halfWidth: number): Point[] {
  const n = spine.length;
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < n; i++) {
    const d = tangent(spine, i);
    const w = halfWidth * bodyProfile(i / (n - 1));
    left.push({ x: spine[i].x - d.y * w, y: spine[i].y + d.x * w });
    right.push({ x: spine[i].x + d.y * w, y: spine[i].y - d.x * w });
  }
  const tail = spine[n - 1];
  const td = tangent(spine, n - 1);
  const tw = halfWidth * bodyProfile(1);
  const head = spine[0];
  const hd = tangent(spine, 0);
  const hw = halfWidth * bodyProfile(0);
  return [
    ...left,
    { x: tail.x + td.x * tw, y: tail.y + td.y * tw },
    ...right.reverse(),
    // Two points ahead of the head make a round, slightly blunt nose end.
    {
      x: head.x - hd.x * hw * 0.8 + hd.y * hw * 0.55,
      y: head.y - hd.y * hw * 0.8 - hd.x * hw * 0.55,
    },
    {
      x: head.x - hd.x * hw * 0.8 - hd.y * hw * 0.55,
      y: head.y - hd.y * hw * 0.8 + hd.x * hw * 0.55,
    },
  ];
}

/** Traces a smooth closed curve through the loop (bending at each point, passing midpoints). */
export function traceSmoothLoop(ctx: CanvasRenderingContext2D, loop: Point[]): void {
  const n = loop.length;
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(loop[n - 1], loop[0]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < n; i++) {
    const m = mid(loop[i], loop[(i + 1) % n]);
    ctx.quadraticCurveTo(loop[i].x, loop[i].y, m.x, m.y);
  }
  ctx.closePath();
}

/** A strip along the upper side of the body (toward the top of the screen), for the shine. */
export function shineLine(spine: Point[], halfWidth: number): Point[] {
  const out: Point[] = [];
  const n = spine.length;
  for (let i = 1; i < n * 0.8; i++) {
    const d = tangent(spine, i);
    // Pick whichever side of the body faces up, so light always comes from above.
    let nx = -d.y;
    let ny = d.x;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const w = halfWidth * bodyProfile(i / (n - 1)) * 0.45;
    out.push({ x: spine[i].x + nx * w, y: spine[i].y + ny * w });
  }
  return out;
}
