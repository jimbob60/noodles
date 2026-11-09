import { CATALOG, ownedDecor, type ShopItem, type Stash } from "../care/shop";
import type { Wallet } from "../care/coins";
import { drawDecorAt } from "../den/decorArt";
import type { Point } from "../noodle/spine";
import { drawCoin } from "./coinCounter";
import { drawFood } from "./foodArt";

/** The shop button: under the decorate button in the top-right corner. */
export function shopButton(width: number): Point & { r: number } {
  const r = 18;
  return { x: width - 14 - r, y: 44 + 2 * (2 * r + 10) + r, r };
}

export function onShopButton(p: Point, width: number): boolean {
  const b = shopButton(width);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

/** A little shopping bag with a coin. */
export function drawShopButton(ctx: CanvasRenderingContext2D, width: number): void {
  const b = shopButton(width);
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(255,210,122,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const s = b.r * 0.55;
  ctx.fillStyle = "#ff8ad8";
  ctx.beginPath();
  ctx.roundRect(b.x - s, b.y - s * 0.55, s * 2, s * 1.55, s * 0.25);
  ctx.fill();
  ctx.strokeStyle = "#ff8ad8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y - s * 0.55, s * 0.5, Math.PI, 0);
  ctx.stroke();
  drawCoin(ctx, b.x, b.y + s * 0.25, s * 0.45);
}

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);

/** A small canvas picture of a shop item. */
function picture(item: ShopItem): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = 84 * dpr;
  c.height = 72 * dpr;
  css(c, { width: "84px", height: "72px" });
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (item.type === "treat") drawFood(ctx, item.food, 42, 38, 22);
  else drawDecorAt(ctx, item.kind, 0, 42, 40, 20, 0.8, 1);
  return c;
}

/**
 * The shop: a cozy panel of cards. Each shows the item, its price in noodle coins and a Buy
 * button. `onBuy` returns the new wallet and stash, or null if it couldn't be bought.
 */
export function openShop(
  wallet: Wallet,
  stash: Stash,
  onBuy: (item: ShopItem) => { wallet: Wallet; stash: Stash } | null,
): void {
  document.getElementById("shop-panel")?.remove();
  const shade = document.createElement("div");
  shade.id = "shop-panel";
  css(shade, {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: "10",
  });
  const card = document.createElement("div");
  css(card, {
    width: "min(560px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#1c1450",
    border: "2px solid rgba(255,210,122,0.6)",
    borderRadius: "20px",
    padding: "18px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    boxShadow: "0 0 40px rgba(255,210,122,0.3)",
  });
  const head = document.createElement("div");
  css(head, { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" });
  const title = document.createElement("div");
  title.textContent = "🛍️ Shop";
  css(title, { font: '24px "Pacifico", cursive', color: "#ffd27a" });
  const purse = document.createElement("div");
  css(purse, {
    marginLeft: "auto",
    background: "rgba(255,210,122,0.15)",
    color: "#ffe08a",
    font: "600 16px system-ui, sans-serif",
    padding: "6px 12px",
    borderRadius: "999px",
  });
  const close = document.createElement("button");
  close.textContent = "✕";
  css(close, {
    background: "rgba(255,255,255,0.12)",
    color: "#f3ecff",
    border: "none",
    borderRadius: "999px",
    padding: "8px 14px",
    minHeight: "40px",
    font: "600 16px system-ui",
    cursor: "pointer",
  });
  close.addEventListener("click", () => shade.remove());
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });
  head.append(title, purse, close);

  const grid = document.createElement("div");
  css(grid, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "10px",
  });

  const render = () => {
    purse.textContent = `🪙 ${wallet.coins}`;
    grid.replaceChildren();
    let section = "";
    for (const item of CATALOG) {
      if (item.type !== section) {
        section = item.type;
        const h = document.createElement("div");
        h.textContent = item.type === "treat" ? "🍓 Treats" : "🏮 Decorations";
        css(h, {
          gridColumn: "1 / -1",
          font: "600 16px system-ui, sans-serif",
          color: "#ffd27a",
          marginTop: "4px",
        });
        grid.append(h);
      }
      const tile = document.createElement("div");
      css(tile, {
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(183,160,255,0.35)",
        borderRadius: "16px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      });
      const name = document.createElement("div");
      name.textContent = item.name;
      css(name, { fontWeight: "600", textAlign: "center" });
      const note = document.createElement("div");
      css(note, { fontSize: "13px", color: "#c9bdf0", minHeight: "16px" });
      const owned = item.type === "decor" && ownedDecor(stash).includes(item.kind);
      if (item.type === "treat")
        note.textContent = `×${item.pack} · you have ${stash.pantry[item.food] ?? 0}`;
      else note.textContent = owned ? "In your drawer" : "Decoration";
      const btn = document.createElement("button");
      const afford = wallet.coins >= item.cost;
      btn.textContent = owned ? "✓ Owned" : `🪙 ${item.cost}`;
      btn.disabled = owned || !afford;
      css(btn, {
        font: "600 15px system-ui, sans-serif",
        border: "none",
        borderRadius: "999px",
        padding: "8px 16px",
        minHeight: "40px",
        cursor: btn.disabled ? "default" : "pointer",
        background: owned
          ? "rgba(157,255,200,0.25)"
          : afford
            ? "#ffd27a"
            : "rgba(255,255,255,0.12)",
        color: owned ? "#9dffc8" : afford ? "#1a1040" : "#8f86b8",
      });
      btn.addEventListener("click", () => {
        const r = onBuy(item);
        if (!r) return;
        wallet = r.wallet;
        stash = r.stash;
        render();
      });
      tile.append(picture(item), name, note, btn);
      grid.append(tile);
    }
  };
  render();
  const foot = document.createElement("div");
  foot.textContent =
    "Earn noodle coins by caring for your dragon. Everyday food, toys and decorations stay free.";
  css(foot, { fontSize: "13px", color: "#c9bdf0", marginTop: "12px", textAlign: "center" });
  card.append(head, grid, foot);
  shade.append(card);
  document.body.append(shade);
}
