import { ADOPT_COST, MAX_FAMILY } from "../care/family";
import { stageOf, type Growth } from "../care/growth";
import { NEED_NAMES, type Needs } from "../care/needs";
import type { Worn } from "../care/wardrobe";
import { drawHead, headColors } from "../noodle/drawHead";
import { Face } from "../noodle/face";
import { genesFromSeed, JINX_SEED, type Genes } from "../noodle/genes";
import type { Point } from "../noodle/spine";
import { cornerButton } from "./layout";

/** The family button: two little hearts, at the bottom of the top-right stack. */
export function familyButton(width: number, height: number): Point & { r: number } {
  return cornerButton(6, width, height);
}

export function onFamilyButton(p: Point, width: number, height: number): boolean {
  const b = familyButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.05, x + s * 1.3, y, x, y + s * 0.9);
  ctx.fill();
}

export function drawFamilyButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
): void {
  const b = familyButton(width, height);
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(255,214,245,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ff8ad8";
  heart(ctx, b.x - b.r * 0.2, b.y - b.r * 0.05, b.r * 0.42);
  ctx.fillStyle = "#7af3ff";
  heart(ctx, b.x + b.r * 0.32, b.y + b.r * 0.22, b.r * 0.3);
  if (count > 1) {
    // How many dragons are in the family.
    ctx.fillStyle = "#9dffc8";
    ctx.beginPath();
    ctx.arc(b.x + b.r * 0.75, b.y - b.r * 0.7, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1040";
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), b.x + b.r * 0.75, b.y - b.r * 0.68);
  }
  ctx.restore();
}

/** What the family card shows for one dragon. */
export interface FamilyCard {
  name: string;
  genes: Genes;
  growth: Growth;
  growthShare: number;
  needs: Needs;
  asleep: boolean;
  hat?: Worn;
  egg: boolean;
  /** The one out in the den right now. */
  here: boolean;
  /** In the den too, as a friend. */
  visiting: boolean;
}

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);
const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
  text = "",
): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  css(e, style);
  if (text) e.textContent = text;
  return e;
};

const NEED_ICON = { fullness: "🍜", happiness: "💗", energy: "🌙", cleanliness: "🫧" } as const;
const NEED_COLOR = {
  fullness: "#ffd27a",
  happiness: "#ff8ad8",
  energy: "#b7a0ff",
  cleanliness: "#7af3ff",
} as const;
const STAGE = { baby: "🐣 Baby", kid: "🌱 Kid", teen: "⭐ Teen", adult: "🐉 Grown-up" };

function portrait(genes: Genes, growthShare: number, hat: Worn | undefined, size: number) {
  const c = el("canvas", { width: `${size}px`, height: `${size}px`, borderRadius: "14px" });
  css(c, { background: "radial-gradient(circle at 50% 45%, #3a2a8a, #15103d 75%)", flex: "none" });
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = size * dpr;
  c.height = size * dpr;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
    const face = new Face(() => 0.5);
    face.mouthShape = "smile";
    drawHead(
      ctx,
      { x: size * 0.42, y: size * 0.62 },
      size * 0.24,
      face,
      headColors(genes),
      growthShare,
      hat,
    );
  }
  return c;
}

function button(label: string, bg: string, color = "#1a1040"): HTMLButtonElement {
  return el(
    "button",
    {
      font: "600 15px system-ui, sans-serif",
      color,
      background: bg,
      border: "none",
      borderRadius: "999px",
      padding: "8px 16px",
      minHeight: "44px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    label,
  );
}

/**
 * The family card: every dragon with its portrait, age and needs. "Visit" swaps which one is
 * out in the den. Below, adopt an egg for coins: a surprise one, or one of your ♥ favorites
 * from the 50-dragon gallery.
 */
export function openFamily(opts: {
  cards: FamilyCard[];
  coins: number;
  /** Jinx's special egg (the dragon that matches Jinxy the cat) hasn't been adopted yet. */
  jinxEgg: boolean;
  /** Dragon numbers ♥ed in the gallery (a few are offered as eggs). */
  favorites: number[];
  /** Brings a family member (by its place in `cards`) out into the den. */
  onVisit: (index: number) => void;
  /** Invites a family member over to play in the den as a friend, or sends it home. */
  onInvite: (index: number, over: boolean) => void;
  /** Adopts an egg: a favorite's number, or null for a surprise. False if it couldn't. */
  onAdopt: (seed: number | null) => boolean;
}): void {
  document.getElementById("family-panel")?.remove();
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
  shade.id = "family-panel";
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });
  const card = el("div", {
    width: "min(520px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: "2px solid rgba(255,214,245,0.6)",
    borderRadius: "20px",
    padding: "16px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    boxShadow: "0 0 40px rgba(255,214,245,0.3)",
  });
  const head = el("div", { display: "flex", alignItems: "center", gap: "10px" });
  head.append(
    el("div", { font: '24px "Pacifico", cursive', color: "#ffd6f5" }, "💕 Family"),
    el(
      "div",
      {
        marginLeft: "auto",
        background: "rgba(255,210,122,0.15)",
        color: "#ffe08a",
        font: "600 16px system-ui, sans-serif",
        padding: "6px 12px",
        borderRadius: "999px",
      },
      `🪙 ${opts.coins}`,
    ),
  );
  const close = button("✕", "rgba(255,255,255,0.12)", "#f3ecff");
  close.addEventListener("click", () => shade.remove());
  head.appendChild(close);
  card.appendChild(head);

  opts.cards.forEach((m, i) => {
    const row = el("div", {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "10px",
      padding: "10px",
      borderRadius: "16px",
      background: m.here ? "rgba(157,255,200,0.12)" : "rgba(255,255,255,0.06)",
      border: m.here ? "2px solid #9dffc8" : "1px solid rgba(183,160,255,0.35)",
    });
    row.dataset.member = String(i);
    if (m.egg) {
      const eggPic = el(
        "div",
        {
          width: "72px",
          height: "72px",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "38px",
          background: "radial-gradient(circle at 50% 45%, #3a2a8a, #15103d 75%)",
          flex: "none",
        },
        "🥚",
      );
      row.appendChild(eggPic);
    } else row.appendChild(portrait(m.genes, m.growthShare, m.hat, 72));
    const info = el("div", { flex: "1", minWidth: "0" });
    info.appendChild(
      el(
        "div",
        {
          font: "700 17px system-ui, sans-serif",
          color: "#ffd6f5",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        m.egg ? "An egg" : m.name,
      ),
    );
    info.appendChild(
      el(
        "div",
        { fontSize: "13px", color: "#c9bdf0", margin: "2px 0 6px" },
        m.egg
          ? "Waiting to be warmed and hatched"
          : `${STAGE[stageOf(m.growth).id]}${m.asleep ? " · 😴 asleep in bed" : ""}${
              m.visiting ? " · 🤝 playing in the den" : ""
            }`,
      ),
    );
    if (!m.egg) {
      // Its own four needs, as little bars.
      const bars = el("div", {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "6px",
      });
      for (const n of NEED_NAMES) {
        const cell = el("div", { display: "flex", alignItems: "center", gap: "3px" });
        cell.appendChild(el("span", { fontSize: "12px" }, NEED_ICON[n]));
        const track = el("div", {
          flex: "1",
          height: "7px",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.14)",
          overflow: "hidden",
        });
        track.appendChild(
          el("div", {
            width: `${Math.round(Math.max(4, Math.min(100, m.needs[n])))}%`,
            height: "100%",
            background: NEED_COLOR[n],
          }),
        );
        cell.appendChild(track);
        bars.appendChild(cell);
      }
      info.appendChild(bars);
    }
    row.appendChild(info);
    if (m.here) {
      row.appendChild(
        el("div", { color: "#9dffc8", fontWeight: "700", fontSize: "13px" }, "Here now"),
      );
    } else {
      const side = el("div", { display: "flex", flexDirection: "column", gap: "6px" });
      if (!m.egg && !m.asleep) {
        // A friend plays in the den alongside the one you're caring for.
        const invite = button(
          m.visiting ? "🏠 Send home" : "🤝 Invite over",
          m.visiting ? "rgba(255,255,255,0.14)" : "#ffd6f5",
          m.visiting ? "#f3ecff" : "#1a1040",
        );
        invite.dataset.invite = String(i);
        invite.addEventListener("click", () => {
          shade.remove();
          opts.onInvite(i, !m.visiting);
        });
        side.appendChild(invite);
      }
      const visit = button(m.egg ? "Hatch" : "Care for", "#7af3ff");
      visit.addEventListener("click", () => {
        shade.remove();
        opts.onVisit(i);
      });
      side.appendChild(visit);
      row.appendChild(side);
    }
    card.appendChild(row);
  });

  // The family pet.
  const pet = el("div", {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(77,255,106,0.08)",
    border: "1px solid rgba(77,255,106,0.35)",
  });
  pet.append(
    el("div", { fontSize: "34px", width: "72px", textAlign: "center", flex: "none" }, "🐈‍⬛"),
    el(
      "div",
      { fontSize: "14px", lineHeight: "1.35" },
      "Jinxy, the dragons' cat, lives in the den. Tap her for a purr; she rubs up against a dragon that swims close.",
    ),
  );
  card.appendChild(pet);

  // Adopting.
  const full = opts.cards.length >= MAX_FAMILY;
  const afford = opts.coins >= ADOPT_COST;
  const adoptBox = el("div", { marginTop: "14px" });
  adoptBox.appendChild(
    el("div", { font: "600 16px system-ui, sans-serif", color: "#ffd27a" }, "🥚 Adopt an egg"),
  );
  const note = el(
    "div",
    { fontSize: "13px", color: "#c9bdf0", margin: "4px 0 8px" },
    full
      ? `Your family is full (${MAX_FAMILY} dragons).`
      : afford
        ? `Room for ${MAX_FAMILY - opts.cards.length} more. Each dragon keeps its own needs, age and outfit.`
        : `An egg costs 🪙 ${ADOPT_COST}. Keep caring and playing to earn more coins.`,
  );
  adoptBox.appendChild(note);
  if (!full) {
    const row = el("div", { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" });
    const adoptButton = (label: string, seed: number | null) => {
      const b = button(
        label,
        afford ? "#ffd27a" : "rgba(255,255,255,0.12)",
        afford ? "#1a1040" : "#8f86b8",
      );
      b.disabled = !afford;
      if (!afford) b.style.cursor = "default";
      b.addEventListener("click", () => {
        if (opts.onAdopt(seed)) shade.remove();
      });
      return b;
    };
    if (opts.jinxEgg) {
      // A gift: the black dragon that matches Jinxy.
      const jinx = button("🐈‍⬛ Jinx's egg · a gift", "#4dff6a");
      jinx.id = "adopt-jinx";
      jinx.addEventListener("click", () => {
        if (opts.onAdopt(JINX_SEED)) shade.remove();
      });
      row.appendChild(jinx);
    }
    const surprise = adoptButton(`🎁 Surprise egg · 🪙 ${ADOPT_COST}`, null);
    surprise.id = "adopt-surprise";
    row.appendChild(surprise);
    adoptBox.appendChild(row);
    const favs = opts.favorites.slice(-6).reverse();
    if (favs.length) {
      adoptBox.appendChild(
        el(
          "div",
          { fontSize: "13px", color: "#c9bdf0", margin: "10px 0 6px" },
          `Or one of your ♥ favorites from the gallery (🪙 ${ADOPT_COST} each):`,
        ),
      );
      const favRow = el("div", { display: "flex", gap: "8px", flexWrap: "wrap" });
      for (const seed of favs) {
        const b = el("button", {
          padding: "0",
          border: afford ? "2px solid #ffd27a" : "2px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          background: "none",
          cursor: afford ? "pointer" : "default",
          opacity: afford ? "1" : "0.55",
          lineHeight: "0",
        });
        b.disabled = !afford;
        b.dataset.favorite = String(seed);
        b.setAttribute("aria-label", `Adopt favorite dragon number ${seed}`);
        b.appendChild(portrait(genesFromSeed(seed), 1, undefined, 60));
        b.addEventListener("click", () => {
          if (opts.onAdopt(seed)) shade.remove();
        });
        favRow.appendChild(b);
      }
      adoptBox.appendChild(favRow);
    }
  }
  card.appendChild(adoptBox);
  shade.appendChild(card);
  document.body.appendChild(shade);
}
