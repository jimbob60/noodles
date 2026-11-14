import { DEX, DEX_COLORS, dexCount, type Dex, type DexEntry } from "../care/dex";
import { drawHead, headColors } from "../noodle/drawHead";
import { Face } from "../noodle/face";
import { CLASSIC_GENES, JINX_GENES, type Genes } from "../noodle/genes";
import { applyFinish, FINISHES, type Finish, type Hsl, type Pattern } from "../noodle/look";
import { rareOf } from "../noodle/rareGenes";
import type { Point } from "../noodle/spine";
import { cornerButton } from "./layout";
import { logEvent } from "./log";

/** The Dragondex button: a little book, just above the ❓ at the bottom of the stack. */
export function dexButton(width: number, height: number): Point & { r: number } {
  return cornerButton(7, width, height);
}

export function onDexButton(p: Point, width: number, height: number): boolean {
  const b = dexButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

/** Draws the book button; `fresh` adds a sparkle when there are new pages to look at. */
export function drawDexButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fresh: boolean,
  time: number,
): void {
  const b = dexButton(width, height);
  const s = b.r;
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(157,255,200,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // An open book: two pages and a spine.
  ctx.fillStyle = "#9dffc8";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - s * 0.32);
    ctx.quadraticCurveTo(b.x + side * s * 0.3, b.y - s * 0.5, b.x + side * s * 0.6, b.y - s * 0.4);
    ctx.lineTo(b.x + side * s * 0.6, b.y + s * 0.38);
    ctx.quadraticCurveTo(b.x + side * s * 0.3, b.y + s * 0.28, b.x, b.y + s * 0.46);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "#1a1040";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y - s * 0.32);
  ctx.lineTo(b.x, b.y + s * 0.46);
  for (const side of [-1, 1])
    for (const dy of [-0.12, 0.08]) {
      ctx.moveTo(b.x + side * s * 0.16, b.y + s * dy);
      ctx.lineTo(b.x + side * s * 0.46, b.y + s * (dy - 0.04));
    }
  ctx.stroke();
  if (fresh) {
    // New pages: a twinkling star on the corner.
    const twinkle = 0.75 + 0.25 * Math.sin(time * 5);
    ctx.fillStyle = "#ffe08a";
    ctx.font = `${Math.round(13 * twinkle + 3)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", b.x + s * 0.8, b.y - s * 0.75);
  }
  ctx.restore();
}

// ---- The little pictures on each page ----

/** A sample dragon wearing an everyday color, or a rare one. */
function colorGenes(id: string): Genes {
  const finish = FINISHES.find((f) => id === `color:${f}`);
  if (finish) return applyFinish(CLASSIC_GENES, finish as Finish);
  const c = DEX_COLORS.find((x) => id === `color:${x.id}`) ?? DEX_COLORS[0];
  const body: Hsl = { h: c.hue, s: 90, l: 74 };
  // A pink mane, unless the dragon is pink: then a minty one.
  const pinkish = c.hue > 290 || c.hue < 10;
  return {
    ...CLASSIC_GENES,
    body,
    pattern: { h: c.hue, s: 80, l: 52 },
    accent: pinkish ? { h: 160, s: 85, l: 74 } : CLASSIC_GENES.accent,
    eyeHue: pinkish ? 160 : CLASSIC_GENES.eyeHue,
  };
}

function specialGenes(id: string): Genes {
  if (id === "special:jinx") return JINX_GENES;
  return rareOf(id.slice("special:".length) as Genes["special"])?.genes ?? CLASSIC_GENES;
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const c = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = size * dpr;
  c.height = size * dpr;
  Object.assign(c.style, { width: `${size}px`, height: `${size}px`, display: "block" });
  const ctx = c.getContext("2d");
  ctx?.scale(dpr, dpr);
  return [c, ctx];
}

/** A dragon's head; a page not found yet shows only its shadow. */
function headArt(genes: Genes, size: number, found: boolean): HTMLCanvasElement {
  const [c, ctx] = canvas(size);
  if (!ctx) return c;
  const face = new Face(() => 0.5);
  face.mouthShape = "smile";
  drawHead(ctx, { x: size * 0.42, y: size * 0.6 }, size * 0.24, face, headColors(genes), 1);
  if (!found) silhouette(ctx, size);
  return c;
}

function silhouette(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "#3a2f7a";
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
  ctx.fillStyle = "rgba(243,236,255,0.75)";
  ctx.font = `700 ${Math.round(size * 0.3)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", size * 0.5, size * 0.52);
}

/** A strip of dragon skin wearing a pattern (the same lavender dragon for every one). */
function patternArt(kind: Pattern, size: number, found: boolean): HTMLCanvasElement {
  const [c, ctx] = canvas(size);
  if (!ctx) return c;
  const w = size * 0.86;
  const h = size * 0.46;
  const x0 = (size - w) / 2;
  const y0 = (size - h) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, h / 2);
  ctx.clip();
  const body = "hsl(270 85% 76%)";
  const ink = "hsl(255 80% 52%)";
  ctx.fillStyle = body;
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = ink;
  if (kind === "stripes") {
    for (let i = 0; i < 5; i++) ctx.fillRect(x0 + w * (0.1 + i * 0.19), y0, w * 0.07, h);
  } else if (kind === "spots") {
    const at = [
      [0.15, 0.35, 0.09],
      [0.32, 0.68, 0.07],
      [0.5, 0.3, 0.08],
      [0.68, 0.62, 0.09],
      [0.85, 0.38, 0.07],
    ];
    for (const [px, py, pr] of at) {
      ctx.beginPath();
      ctx.arc(x0 + w * px, y0 + h * py, w * pr * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "gradient") {
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, body);
    g.addColorStop(1, ink);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, w, h);
  } else if (kind === "backstripe") {
    ctx.fillRect(x0, y0, w, h * 0.32);
  } else if (kind === "rainbow") {
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${i * 60} 90% 72%)`);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, w, h);
  } else if (kind === "koi") {
    const blob = (px: number, py: number, rx: number, ry: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x0 + w * px, y0 + h * py, w * rx, h * ry, 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.fillStyle = "hsl(30 30% 96%)";
    ctx.fillRect(x0, y0, w, h);
    blob(0.2, 0.3, 0.16, 0.42, "hsl(12 90% 58%)");
    blob(0.62, 0.75, 0.2, 0.4, "hsl(12 90% 58%)");
    blob(0.85, 0.2, 0.1, 0.3, "hsl(230 30% 22%)");
  } else if (kind === "stars") {
    ctx.fillStyle = "hsl(240 55% 30%)";
    ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = "#fff3b0";
    ctx.font = `${Math.round(h * 0.38)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [px, py] of [
      [0.16, 0.35],
      [0.38, 0.68],
      [0.58, 0.3],
      [0.8, 0.62],
    ])
      ctx.fillText("★", x0 + w * px, y0 + h * py);
  }
  // A soft shine along the top, like the body's.
  const shine = ctx.createLinearGradient(0, y0, 0, y0 + h);
  shine.addColorStop(0, "rgba(255,255,255,0.35)");
  shine.addColorStop(0.45, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(x0, y0, w, h);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, h / 2);
  ctx.stroke();
  if (!found) silhouette(ctx, size);
  return c;
}

function art(entry: DexEntry, size: number, found: boolean): HTMLCanvasElement {
  if (entry.page === "patterns")
    return patternArt(entry.id.slice("pattern:".length) as Pattern, size, found);
  return headArt(
    entry.page === "colors" ? colorGenes(entry.id) : specialGenes(entry.id),
    size,
    found,
  );
}

// ---- The book ----

const css = (e: HTMLElement, style: Partial<CSSStyleDeclaration>) => Object.assign(e.style, style);
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
  text = "",
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  css(e, style);
  if (text) e.textContent = text;
  return e;
}

const PAGES = [
  { page: "colors", label: "🎨 Colors" },
  { page: "patterns", label: "🌀 Patterns" },
  { page: "specials", label: "🎉 Specials" },
] as const;

const day = (at: number) =>
  at > 0 ? new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

/**
 * The Dragondex: every color, pattern and special dragon, filled in as they hatch. Pages found
 * since the book was last opened (`fresh`) wear a NEW tag.
 */
export function openDex(dex: Dex, fresh: string[]): void {
  document.getElementById("dex-panel")?.remove();
  logEvent("opened dragondex");
  const shade = el("div", {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: "10",
  });
  shade.id = "dex-panel";
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });
  const card = el("div", {
    width: "min(560px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: "2px solid rgba(157,255,200,0.6)",
    borderRadius: "20px",
    padding: "16px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    boxShadow: "0 0 40px rgba(157,255,200,0.25)",
  });
  const all = dexCount(dex);
  const head = el("div", { display: "flex", alignItems: "center", gap: "10px" });
  const close = el(
    "button",
    {
      marginLeft: "auto",
      font: "600 15px system-ui, sans-serif",
      background: "rgba(255,255,255,0.12)",
      color: "#f3ecff",
      border: "none",
      borderRadius: "999px",
      padding: "8px 16px",
      minHeight: "44px",
      cursor: "pointer",
    },
    "✕",
  );
  close.addEventListener("click", () => shade.remove());
  head.append(
    el("div", { font: '24px "Pacifico", cursive', color: "#c9ffe0" }, "📖 Dragondex"),
    close,
  );
  // How full the book is.
  const meter = el("div", { margin: "10px 0 4px" });
  const bar = el("div", {
    height: "12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  });
  bar.append(
    el("div", {
      width: `${(100 * all.found) / all.total}%`,
      height: "100%",
      borderRadius: "999px",
      background: "linear-gradient(90deg, #7af3ff, #9dffc8, #ffe08a)",
    }),
  );
  meter.append(
    el(
      "div",
      { font: "600 14px system-ui, sans-serif", color: "#c9ffe0", marginBottom: "4px" },
      all.found === all.total
        ? `🏆 All ${all.total} found! What a collection!`
        : `${all.found} of ${all.total} found. Hatch eggs to fill the book!`,
    ),
    bar,
  );
  const tabs = el("div", { display: "flex", gap: "6px", margin: "10px 0", flexWrap: "wrap" });
  const grid = el("div", {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))",
    gap: "8px",
  });
  const show = (page: DexEntry["page"]) => {
    tabs.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.page === page;
      css(b, {
        background: on ? "#9dffc8" : "rgba(255,255,255,0.1)",
        color: on ? "#1a1040" : "#f3ecff",
      });
    });
    grid.replaceChildren();
    for (const entry of DEX.filter((e) => e.page === page)) {
      const find = dex.find((f) => f.id === entry.id);
      const tile = el("div", {
        background: find ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `2px solid ${entry.rare ? "rgba(255,224,138,0.65)" : "rgba(255,255,255,0.15)"}`,
        borderRadius: "14px",
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
      });
      tile.dataset.dex = entry.id;
      tile.dataset.found = find ? "yes" : "no";
      tile.append(art(entry, 76, !!find));
      tile.append(
        el(
          "div",
          { font: "600 14px system-ui, sans-serif", marginTop: "2px" },
          find ? `${entry.rare ? "✨ " : ""}${entry.name}` : "???",
        ),
        el(
          "div",
          { fontSize: "12px", color: "#c8bdf0", lineHeight: "1.25", marginTop: "2px" },
          find ? `Found by ${find.by || "you"}${find.at ? ` · ${day(find.at)}` : ""}` : entry.hint,
        ),
      );
      if (fresh.includes(entry.id))
        tile.append(
          el(
            "div",
            {
              position: "absolute",
              top: "4px",
              right: "4px",
              background: "#ffe08a",
              color: "#1a1040",
              font: "700 11px system-ui, sans-serif",
              borderRadius: "999px",
              padding: "2px 6px",
            },
            "NEW",
          ),
        );
      grid.append(tile);
    }
  };
  for (const p of PAGES) {
    const n = dexCount(dex, p.page);
    const b = el(
      "button",
      {
        font: "600 14px system-ui, sans-serif",
        border: "none",
        borderRadius: "999px",
        padding: "8px 12px",
        minHeight: "44px",
        cursor: "pointer",
      },
      `${p.label} ${n.found}/${n.total}`,
    );
    b.dataset.page = p.page;
    b.addEventListener("click", () => show(p.page));
    tabs.append(b);
  }
  card.append(head, meter, tabs, grid);
  shade.append(card);
  document.body.append(shade);
  // Open on the page with something new, if anything is.
  const newPage = DEX.find((e) => fresh.includes(e.id))?.page;
  show(newPage ?? "colors");
}
