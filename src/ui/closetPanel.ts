import {
  ACCESSORIES,
  ACCESSORY_COLORS,
  buyAccessory,
  recolor,
  SLOTS,
  toggleWear,
  type AccessoryId,
  type Slot,
  type Wardrobe,
} from "../care/wardrobe";
import type { Wallet } from "../care/coins";
import { Dragon } from "../noodle/dragon";
import type { Genes } from "../noodle/genes";
import type { Point } from "../noodle/spine";
import { cornerButton } from "./layout";

/** The closet button: a pink bow, at the bottom of the top-right stack. */
export function closetButton(width: number, height: number): Point & { r: number } {
  return cornerButton(4, width, height);
}

export function onClosetButton(p: Point, width: number, height: number): boolean {
  const b = closetButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

export function drawClosetButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const b = closetButton(width, height);
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(255,138,216,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const s = b.r * 0.55;
  ctx.fillStyle = "#ff8ad8";
  for (const dir of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + s * dir, b.y - s * 0.65);
    ctx.lineTo(b.x + s * dir, b.y + s * 0.65);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(b.x, b.y, s * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd6f5";
  ctx.fill();
  ctx.restore();
}

const ICON: Record<AccessoryId, string> = {
  hairBow: "🎀",
  partyHat: "🎉",
  beanie: "🧶",
  chefHat: "👨‍🍳",
  flowerCrown: "🌸",
  santaHat: "🎅",
  propellerCap: "🧢",
  witchHat: "🧙",
  cowboyHat: "🤠",
  topHat: "🎩",
  crown: "👑",
  halo: "😇",
  bowTie: "🎀",
  bandana: "🔺",
  bellCollar: "🔔",
  lei: "🌺",
  scarf: "🧣",
  heartLocket: "💗",
  pearls: "📿",
  backpack: "🎒",
  cape: "🦸",
  butterflyWings: "🦋",
  fairyWings: "🧚",
  tailBow: "🎀",
  tailFlower: "🌼",
  tailBell: "🔔",
  streamers: "🎏",
  tailStar: "⭐",
  tailRings: "💍",
};
const SLOT_LABEL: Record<Slot, string> = {
  head: "🎩 Hats",
  neck: "🧣 Neck",
  back: "🦋 Back",
  tail: "🎀 Tail",
};

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);

/**
 * The closet: a picture of your dragon wearing its outfit, then hats, neck things and tail
 * things. Buy one with coins (yours to keep), tap it to put it on or take it off, and tap a color
 * dot to change the color of what's worn.
 */
export function openCloset(opts: {
  wardrobe: Wardrobe;
  wallet: Wallet;
  genes: Genes;
  growthShare: number;
  onChange: (wardrobe: Wardrobe, wallet: Wallet) => void;
}): void {
  let { wardrobe, wallet } = opts;
  document.getElementById("closet-panel")?.remove();
  const shade = document.createElement("div");
  shade.id = "closet-panel";
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
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });
  const card = document.createElement("div");
  css(card, {
    width: "min(560px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: "2px solid rgba(255,138,216,0.6)",
    borderRadius: "20px",
    padding: "16px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    boxShadow: "0 0 40px rgba(255,138,216,0.3)",
  });
  shade.appendChild(card);
  document.body.appendChild(shade);

  const head = document.createElement("div");
  css(head, { display: "flex", alignItems: "center", gap: "10px" });
  const title = document.createElement("div");
  title.textContent = "🎀 Dress up";
  css(title, { font: '24px "Pacifico", cursive', color: "#ff8ad8" });
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
  head.append(title, purse, close);

  // The preview: the whole dragon, swimming gently, in its outfit.
  const W = 500;
  const H = 170;
  const preview = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  preview.width = W * dpr;
  preview.height = H * dpr;
  css(preview, {
    display: "block",
    width: "100%",
    margin: "10px 0",
    borderRadius: "16px",
    background: "radial-gradient(circle at 50% 50%, #34277e, #15103d 75%)",
  });
  const pc = preview.getContext("2d");
  const unit = 6.8;
  const world = { width: W, height: H, unit };
  const model = new Dragon(W * 0.15, H * 0.5, unit, world, opts.genes, () => 0.5);
  model.setGrowth(opts.growthShare);
  // Swim it across into a gentle wave, ending in the middle, so the neck and tail things show.
  const steps = 200;
  for (let t = 0; t <= steps; t++)
    model.update(
      1 / 60,
      { x: W * (0.15 + 0.55 * (t / steps)), y: H * 0.5 + Math.sin(t / 18) * 18, down: true },
      world,
    );
  const paint = () => {
    if (!pc) return;
    model.outfit = wardrobe.worn;
    pc.setTransform(dpr, 0, 0, dpr, 0, 0);
    pc.clearRect(0, 0, W, H);
    model.draw(pc);
  };

  const list = document.createElement("div");
  const render = () => {
    purse.textContent = `🪙 ${wallet.coins}`;
    paint();
    list.replaceChildren();
    for (const slot of SLOTS) {
      const top = document.createElement("div");
      css(top, { display: "flex", alignItems: "center", gap: "8px", margin: "10px 0 6px" });
      const h = document.createElement("div");
      h.textContent = SLOT_LABEL[slot];
      css(h, { font: "600 16px system-ui, sans-serif", color: "#ffd27a" });
      top.appendChild(h);
      // Color dots for whatever's worn here.
      const worn = wardrobe.worn[slot];
      if (worn) {
        const dots = document.createElement("div");
        css(dots, { display: "flex", gap: "6px", marginLeft: "auto" });
        ACCESSORY_COLORS.forEach((c, k) => {
          const dot = document.createElement("button");
          dot.setAttribute("aria-label", `Color ${k + 1}`);
          css(dot, {
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: c,
            border: k === worn.color ? "3px solid #ffffff" : "2px solid rgba(0,0,0,0.3)",
            cursor: "pointer",
            padding: "0",
          });
          dot.addEventListener("click", () => {
            wardrobe = recolor(wardrobe, slot, k);
            opts.onChange(wardrobe, wallet);
            render();
          });
          dots.appendChild(dot);
        });
        top.appendChild(dots);
      }
      const grid = document.createElement("div");
      css(grid, {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))",
        gap: "8px",
      });
      for (const a of ACCESSORIES.filter((x) => x.slot === slot)) {
        const owned = wardrobe.owned.includes(a.id);
        const wearing = wardrobe.worn[slot]?.id === a.id;
        const tile = document.createElement("button");
        tile.dataset.accessory = a.id;
        const afford = wallet.coins >= a.cost;
        css(tile, {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          padding: "8px 6px",
          borderRadius: "14px",
          cursor: owned || afford ? "pointer" : "default",
          border: wearing ? "2px solid #9dffc8" : "1px solid rgba(183,160,255,0.35)",
          background: wearing ? "rgba(157,255,200,0.16)" : "rgba(255,255,255,0.06)",
          color: "#f3ecff",
          font: "14px system-ui, sans-serif",
          minHeight: "44px",
        });
        const icon = document.createElement("div");
        icon.textContent = ICON[a.id];
        css(icon, { fontSize: "26px" });
        const name = document.createElement("div");
        name.textContent = a.name;
        css(name, { fontWeight: "600" });
        const note = document.createElement("div");
        note.textContent = wearing ? "✓ Wearing" : owned ? "Tap to wear" : `🪙 ${a.cost}`;
        css(note, {
          fontSize: "13px",
          color: wearing ? "#9dffc8" : owned ? "#c9bdf0" : afford ? "#ffe08a" : "#8f86b8",
        });
        tile.append(icon, name, note);
        tile.addEventListener("click", () => {
          if (!owned) {
            const r = buyAccessory(wardrobe, wallet, a.id);
            if (!r.ok) return;
            wallet = r.wallet;
            wardrobe = r.wardrobe;
          }
          // Buying puts it straight on; tapping an owned one puts it on or takes it off.
          wardrobe = toggleWear(wardrobe, a.id, wardrobe.worn[slot]?.color ?? 0);
          if (!owned && !wardrobe.worn[slot]) wardrobe = toggleWear(wardrobe, a.id);
          opts.onChange(wardrobe, wallet);
          render();
        });
        grid.appendChild(tile);
      }
      list.append(top, grid);
    }
  };
  card.append(head, preview, list);
  render();
}
