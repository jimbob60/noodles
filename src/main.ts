import { palette } from "./palette";

// Phase 3 placeholder: proves the build works. Phase 5 replaces this with the real game loop.
const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function draw(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, palette.night);
  sky.addColorStop(1, palette.dusk);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.font = `bold ${Math.round(Math.min(w, h) / 10)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = palette.glowPink;
  ctx.shadowBlur = 24;
  ctx.fillStyle = palette.glowPink;
  ctx.fillText("Noodle Dragons", w / 2, h / 2);
}

window.addEventListener("resize", draw);
draw();
