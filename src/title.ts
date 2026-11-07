import { palette } from "./palette";
import { drawRingDragon, type RingDragon } from "./ringDragon";

export const TITLE_FONT = "Pacifico";
const LINES = ["Noodle", "Dragons"];
export const GREETING = "Hello, Noodle!";
/** Each "o" in the title becomes a dragon; these give each one its own look. */
const O_DRAGONS: Omit<RingDragon, "x" | "y" | "radius">[] = [
  { color: palette.glowCyan, headAngle: -Math.PI * 0.6, direction: 1 },
  { color: palette.glowGold, headAngle: -Math.PI * 0.4, direction: -1, sleepy: true },
  { color: palette.glowMint, headAngle: -Math.PI * 0.55, direction: 1 },
];

/** Draws the title centered in a w × h area: fancy glowing letters, with every "o" a curled dragon. */
export function drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const size = Math.min(w / 4.6, h / 4.3);
  ctx.save();
  ctx.font = `${size}px "${TITLE_FONT}", cursive`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const xHeight = ctx.measureText("x").actualBoundingBoxAscent;
  const lineGap = size * 1.05;
  // Shifted up a little to leave room for the greeting underneath.
  const firstBaseline = h / 2 - lineGap / 2 + xHeight / 2 - size * 0.22;

  let dragon = 0;
  LINES.forEach((word, line) => {
    const baseline = firstBaseline + line * lineGap;
    const left = w / 2 - ctx.measureText(word).width / 2;
    const xAt = (i: number) => left + ctx.measureText(word.slice(0, i)).width;

    // Letters: every run of letters between the "o"s, with a soft pink glow.
    let start = 0;
    for (let i = 0; i <= word.length; i++) {
      if (i === word.length || word[i] === "o") {
        if (i > start) drawGlowText(ctx, word.slice(start, i), xAt(start), baseline, size);
        start = i + 1;
      }
    }

    // Dragons: one per "o", sized and placed like the letter would be.
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== "o") continue;
      const look = O_DRAGONS[dragon++ % O_DRAGONS.length];
      const width = xAt(i + 1) - xAt(i);
      drawRingDragon(ctx, {
        ...look,
        x: xAt(i) + width / 2,
        y: baseline - xHeight / 2,
        radius: xHeight * 0.44,
      });
    }
  });

  // Greeting under the title, in a smaller cyan glow.
  const greetSize = size * 0.32;
  ctx.font = `${greetSize}px "${TITLE_FONT}", cursive`;
  ctx.textAlign = "center";
  ctx.shadowColor = palette.glowCyan;
  ctx.shadowBlur = greetSize * 0.5;
  ctx.fillStyle = palette.glowCyan;
  ctx.fillText(GREETING, w / 2, firstBaseline + lineGap + size * 0.78);
  ctx.restore();
}

function drawGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
): void {
  // A light rim drawn first and then covered by the fill, so only the outer edge shows
  // (no seams where joined script letters overlap).
  ctx.shadowColor = palette.glowPink;
  ctx.shadowBlur = size * 0.25;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.strokeStyle = "rgba(255,235,250,0.9)";
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = palette.glowPink;
  ctx.fillText(text, x, y);
}
