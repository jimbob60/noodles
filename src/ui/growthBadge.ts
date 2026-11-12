import { STAGES, stageOf, type Growth } from "../care/growth";

const ICON: Record<(typeof STAGES)[number]["id"], string> = {
  baby: "🐣",
  kid: "🌱",
  teen: "⭐",
  adult: "🐉",
};
const LABEL: Record<(typeof STAGES)[number]["id"], string> = {
  baby: "Baby",
  kid: "Kid",
  teen: "Teen",
  adult: "Grown-up",
};

/** How far along to the next stage, 0–1 (1 once grown). */
export function towardNext(g: Growth): number {
  const i = STAGES.findIndex((s) => s.id === stageOf(g).id);
  const next = STAGES[i + 1];
  if (!next) return 1;
  return (g.hours - STAGES[i].hours) / (next.hours - STAGES[i].hours);
}

/** Where the badge was last drawn, so a tap on it can open the profile. */
let lastBox = { x: 12, y: 138, w: 120, h: 44 };

/** True if a point is on the name badge. */
export function onGrowthBadge(p: { x: number; y: number }): boolean {
  const b = lastBox;
  return p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 6 && p.y <= b.y + b.h + 6;
}

/**
 * A little pill under the coins: the dragon's name, its life stage, and a bar filling toward the
 * next stage. Tap it for the profile card.
 */
export function drawGrowthBadge(ctx: CanvasRenderingContext2D, g: Growth, name = ""): void {
  const stage = stageOf(g);
  ctx.save();
  ctx.font = "700 14px system-ui, sans-serif";
  const nameW = name ? ctx.measureText(name).width : 0;
  const x = 12;
  const y = 138;
  const w = Math.max(120, Math.min(220, nameW + 44));
  const h = 44;
  lastBox = { x, y, w, h };
  ctx.fillStyle = "rgba(20,14,60,0.75)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.font = "16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ICON[stage.id], x + 17, y + h / 2);
  ctx.textAlign = "left";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.fillStyle = "#ffd6f5";
  if (name) ctx.fillText(name, x + 33, y + 13, w - 42);
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = "#e6dcff";
  ctx.fillText(LABEL[stage.id], x + 33, name ? y + 28 : y + 18);
  // The bar toward the next stage (full and gold once grown up).
  const done = towardNext(g);
  const bx = x + 33 + (name ? 54 : 0);
  const by = name ? y + 26 : y + 30;
  const bw = Math.max(20, x + w - 12 - bx);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = done >= 1 ? "#ffe08a" : "#9dffc8";
  ctx.beginPath();
  ctx.roundRect(bx, by, Math.max(5, bw * done), 5, 2.5);
  ctx.fill();
  ctx.restore();
}

/** The message when a dragon reaches a new stage. */
export function stageMessage(g: Growth): string {
  const stage = stageOf(g);
  return stage.id === "adult"
    ? `${ICON.adult} All grown up!`
    : `${ICON[stage.id]} Your dragon is a ${LABEL[stage.id].toLowerCase()} now!`;
}

/** A banner across the top that floats in, stays a few seconds and fades. */
export function drawStageBanner(
  ctx: CanvasRenderingContext2D,
  width: number,
  text: string,
  age: number,
  life: number,
): void {
  const fade = Math.min(1, age / 0.4, (life - age) / 0.6);
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.font = "700 20px system-ui, sans-serif";
  const w = ctx.measureText(text).width + 44;
  const x = width / 2 - w / 2;
  const y = 60 + (1 - Math.min(1, age / 0.4)) * -20;
  ctx.fillStyle = "rgba(40,20,90,0.9)";
  ctx.strokeStyle = "#ffe08a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 44, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff6d6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, y + 23);
  ctx.restore();
}
