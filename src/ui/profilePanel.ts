import {
  ageText,
  birthdayText,
  cleanName,
  NAME_MAX,
  suggestName,
  type Identity,
} from "../care/identity";
import { stageOf, type Growth } from "../care/growth";
import type { FoodId } from "../care/food";
import { drawHead, headColors } from "../noodle/drawHead";
import { Face } from "../noodle/face";
import { TRAITS, type Genes } from "../noodle/genes";
import { mainTrait, TRAIT_LABEL } from "../noodle/personality";
import { towardNext } from "./growthBadge";

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);

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

function pill(label: string, bg = "#7af3ff", color = "#1a1040"): HTMLButtonElement {
  const b = el(
    "button",
    {
      font: "600 16px system-ui, sans-serif",
      color,
      background: bg,
      border: "none",
      borderRadius: "999px",
      padding: "10px 18px",
      minHeight: "44px",
      cursor: "pointer",
    },
    label,
  );
  return b;
}

/** A dimmed backdrop with a glowing card in the middle. */
function shell(id: string, glow: string): { shade: HTMLDivElement; card: HTMLDivElement } {
  document.getElementById(id)?.remove();
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
  shade.id = id;
  const card = el("div", {
    width: "min(460px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: `2px solid ${glow}`,
    borderRadius: "20px",
    padding: "18px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    boxShadow: `0 0 40px ${glow}`,
  });
  shade.appendChild(card);
  document.body.appendChild(shade);
  return { shade, card };
}

/**
 * Asks for a name: a text box filled with a suggestion, a 🎲 for another idea, and Done.
 * `canCancel` adds a ✕ (renaming); a just-hatched dragon must be named (any suggestion will do).
 */
export function openNamePanel(opts: {
  title: string;
  initial: string;
  canCancel: boolean;
  onDone: (name: string) => void;
}): void {
  const { shade, card } = shell("name-panel", "rgba(157,255,200,0.55)");
  const title = el("div", { font: '24px "Pacifico", cursive', color: "#9dffc8" }, opts.title);
  const row = el("div", { display: "flex", gap: "8px", margin: "14px 0" });
  const input = el("input", {
    flex: "1",
    minWidth: "0",
    font: "600 20px system-ui, sans-serif",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "2px solid rgba(157,255,200,0.6)",
    background: "#130d3a",
    color: "#ffffff",
  });
  input.value = opts.initial;
  input.maxLength = NAME_MAX * 2; // emoji take two; cleanName counts properly
  input.setAttribute("aria-label", "Dragon name");
  input.autocomplete = "off";
  const dice = pill("🎲", "rgba(255,255,255,0.14)", "#ffffff");
  dice.title = "Another name idea";
  dice.addEventListener("click", () => {
    input.value = suggestName();
    input.focus();
  });
  row.append(input, dice);
  const done = pill("That's the one! ✨", "#9dffc8");
  css(done, { width: "100%" });
  const finish = () => {
    const name = cleanName(input.value);
    if (!name) {
      input.style.borderColor = "#ff8ad8";
      input.focus();
      return;
    }
    shade.remove();
    opts.onDone(name);
  };
  done.addEventListener("click", finish);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish();
  });
  card.append(title, row, done);
  if (opts.canCancel) {
    const cancel = pill("Never mind", "transparent", "#c9bfff");
    css(cancel, { width: "100%", marginTop: "6px" });
    cancel.addEventListener("click", () => shade.remove());
    card.appendChild(cancel);
    shade.addEventListener("click", (e) => {
      if (e.target === shade) shade.remove();
    });
  }
  setTimeout(() => input.select(), 50);
}

const FOOD_LABEL: Record<FoodId, string> = {
  noodles: "🍜 Noodles",
  dumpling: "🥟 Dumplings",
  fish: "🐟 Fish",
  berries: "🫐 Berries",
  mooncake: "🥮 Mooncake",
};
const TRAIT_EMOJI = { playful: "🎾", sleepy: "😴", greedy: "🍜", shy: "🙈" } as const;
const STAGE_LABEL = { baby: "🐣 Baby", kid: "🌱 Kid", teen: "⭐ Teen", adult: "🐉 Grown-up" };

/** The special things about how it looks, as short labels. */
export function lookTraits(g: Genes): string[] {
  const out: string[] = [];
  out.push({ antler: "Antler horns", curl: "Curly horns", spike: "Spike horns" }[g.hornStyle]);
  out.push({ spikes: "Spiky back", scallops: "Scalloped back", sail: "Sail fin" }[g.ridgeStyle]);
  out.push({ flame: "Flame tail", fan: "Fan tail", pompom: "Pompom tail" }[g.tailStyle]);
  out.push(
    {
      plain: "Sweet smile",
      fangs: "Little fangs",
      toothy: "Toothy grin",
      snaggle: "Snaggle-tooth",
    }[g.mouthStyle],
  );
  const pattern = {
    plain: "",
    stripes: "Stripes",
    spots: "Spots",
    gradient: "Ombré",
    backstripe: "Back stripe",
  }[g.patternKind];
  if (pattern) out.push(pattern);
  if (g.mark !== "none")
    out.push(
      { gem: "💎 Gem mark", star: "⭐ Star mark", moon: "🌙 Moon mark", heart: "💗 Heart mark" }[
        g.mark
      ],
    );
  if (g.freckles) out.push("Freckles");
  if (g.frills) out.push("Cheek frills");
  if (g.size > 1.05) out.push("Big");
  if (g.size < 0.95) out.push("Petite");
  if (g.chubby > 1.08) out.push("Chubby");
  if (g.chubby < 0.92) out.push("Slim");
  if (g.eyeSize > 1.1) out.push("Big eyes");
  if (g.glow > 1.3) out.push("Extra glowy");
  if (g.snoutLength > 1.12) out.push("Long snout");
  if (g.snoutLength < 0.92) out.push("Button nose");
  return out;
}

/**
 * The profile card: a portrait, the name (✏️ to rename), birthday and age, how grown up it is,
 * its personality, favorite food and the special things about how it looks.
 */
export function openProfile(info: {
  identity: Identity;
  genes: Genes;
  growth: Growth;
  growthShare: number;
  now: number;
  onRename: (name: string) => void;
}): void {
  const { identity: id, genes: g, growth } = info;
  const { shade, card } = shell("profile-panel", "rgba(183,160,255,0.55)");
  shade.addEventListener("click", (e) => {
    if (e.target === shade) shade.remove();
  });

  // Top: name, rename and close.
  const head = el("div", { display: "flex", alignItems: "center", gap: "8px" });
  const name = el(
    "div",
    {
      font: '26px "Pacifico", cursive',
      color: "#ffd6f5",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    id.name,
  );
  name.id = "profile-name";
  const rename = pill("✏️", "rgba(255,255,255,0.12)", "#ffffff");
  rename.title = "Rename";
  rename.addEventListener("click", () => {
    shade.remove();
    openNamePanel({
      title: "A new name?",
      initial: id.name,
      canCancel: true,
      onDone: info.onRename,
    });
  });
  const close = pill("✕", "rgba(255,255,255,0.12)", "#f3ecff");
  css(close, { marginLeft: "auto" });
  close.addEventListener("click", () => shade.remove());
  head.append(name, rename, close);

  // A portrait: its head, smiling.
  const portrait = el("canvas", {
    display: "block",
    width: "100%",
    maxWidth: "300px",
    margin: "6px auto",
    borderRadius: "16px",
    background: "radial-gradient(circle at 50% 45%, #3a2a8a, #15103d 70%)",
  });
  const W = 300;
  const H = 190;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  portrait.width = W * dpr;
  portrait.height = H * dpr;
  const pc = portrait.getContext("2d");
  if (pc) {
    pc.scale(dpr, dpr);
    const face = new Face(() => 0.5);
    face.mouthShape = "smile";
    drawHead(pc, { x: W * 0.46, y: H * 0.56 }, 54, face, headColors(g), info.growthShare);
  }

  const line = (text: string) => el("div", { margin: "6px 0" }, text);
  const born = line(`🥚 Hatched ${birthdayText(id.birthday)} · ${ageText(id.birthday, info.now)}`);

  // Growing up: the stage and a bar toward the next one.
  const stage = stageOf(growth);
  const grow = el("div", { display: "flex", alignItems: "center", gap: "10px", margin: "6px 0" });
  grow.append(
    el("div", { minWidth: "96px" }, STAGE_LABEL[stage.id]),
    bar(towardNext(growth), "#9dffc8"),
  );

  // Personality: the main trait, and a meter for each.
  const main = mainTrait(g.personality);
  const pers = el("div", { margin: "12px 0 6px", fontWeight: "700", color: "#ffe08a" });
  pers.textContent = `Mostly ${TRAIT_LABEL[main]} ${TRAIT_EMOJI[main]}`;
  const meters = el("div", { display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 10px" });
  for (const t of TRAITS) {
    meters.append(
      el("div", { fontSize: "14px" }, `${TRAIT_EMOJI[t]} ${TRAIT_LABEL[t]}`),
      bar(g.personality[t], t === main ? "#ffe08a" : "#b7a0ff"),
    );
  }

  const food = line(`Favorite food: ${FOOD_LABEL[g.favorite]}`);
  css(food, { marginTop: "12px" });

  // Looks: little chips.
  const chips = el("div", { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" });
  for (const t of lookTraits(g))
    chips.appendChild(
      el(
        "span",
        {
          background: "rgba(122,243,255,0.14)",
          color: "#bff9ff",
          borderRadius: "999px",
          padding: "4px 10px",
          fontSize: "13px",
        },
        t,
      ),
    );
  const tag = el(
    "div",
    { marginTop: "12px", fontSize: "12px", color: "rgba(243,236,255,0.45)", textAlign: "right" },
    `Dragon #${g.seed}`,
  );
  card.append(head, portrait, born, grow, pers, meters, food, chips, tag);
}

function bar(share: number, color: string): HTMLDivElement {
  const track = el("div", {
    height: "10px",
    borderRadius: "5px",
    background: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  });
  track.appendChild(
    el("div", {
      width: `${Math.round(Math.max(0.04, Math.min(1, share)) * 100)}%`,
      height: "100%",
      background: color,
      borderRadius: "5px",
    }),
  );
  return track;
}
