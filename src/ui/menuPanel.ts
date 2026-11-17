import { drawTitle } from "../title";
import type { Settings } from "../settings";
import { logEvent } from "./log";

/**
 * Phase 44: the title screen, the ⚙️ menu (settings and help) and the credits. Every one can be
 * reached and left: the title leads to the game, settings and credits; the menu leads to
 * everything, back to the title, or closed; the credits go back to wherever they came from.
 */

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

function button(label: string, bg: string, color = "#1a1040"): HTMLButtonElement {
  return el(
    "button",
    {
      font: "600 17px system-ui, sans-serif",
      color,
      background: bg,
      border: "none",
      borderRadius: "999px",
      padding: "10px 22px",
      minHeight: "48px",
      cursor: "pointer",
    },
    label,
  );
}

function card(
  id: string,
  border: string,
  z = "12",
): { shade: HTMLDivElement; box: HTMLDivElement } {
  document.getElementById(id)?.remove();
  const shade = el("div", {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: z,
  });
  shade.id = id;
  const box = el("div", {
    width: "min(440px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#1c1450",
    border: `2px solid ${border}`,
    borderRadius: "20px",
    padding: "18px",
    color: "#f3ecff",
    font: "15px system-ui, sans-serif",
    lineHeight: "1.4",
  });
  shade.append(box);
  document.body.append(shade);
  return { shade, box };
}

function heading(box: HTMLElement, text: string, color: string, onClose: () => void): void {
  const head = el("div", {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  });
  const close = button("✕", "rgba(255,255,255,0.12)", "#f3ecff");
  close.dataset.close = "";
  close.addEventListener("click", onClose);
  head.append(
    el("div", { font: '24px "Pacifico", cursive', color }, text),
    el("div", { flex: "1" }),
    close,
  );
  box.append(head);
}

// ---- The title screen ----

/**
 * The title screen: the glowing "Noodle Dragons" title (every "o" a curled dragon) over the den,
 * with Play, Settings and Credits. `name` is the dragon waiting in the den, if there is one.
 */
export function openTitle(opts: {
  name: string | null;
  onPlay: () => void;
  onSettings: () => void;
  onCredits: () => void;
}): void {
  document.getElementById("title-screen")?.remove();
  const screen = el("div", {
    position: "fixed",
    inset: "0",
    zIndex: "11",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: "radial-gradient(ellipse at 50% 40%, rgba(40,26,110,0.82), rgba(8,6,30,0.94) 75%)",
    transition: "opacity 0.5s",
  });
  screen.id = "title-screen";
  const art = el("canvas", { width: "min(560px, 92vw)", height: "auto", maxHeight: "48vh" });
  const W = 560;
  const H = 400;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  art.width = W * dpr;
  art.height = H * dpr;
  css(art, { aspectRatio: `${W} / ${H}` });
  const ctx = art.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
    drawTitle(ctx, W, H);
  }
  const play = button(opts.name ? `▶ Play with ${opts.name}` : "▶ Play", "#9dffc8");
  play.id = "title-play";
  css(play, { font: "700 20px system-ui, sans-serif", padding: "12px 32px", minHeight: "56px" });
  play.addEventListener("click", () => {
    logEvent("title play");
    css(screen, { opacity: "0", pointerEvents: "none" });
    setTimeout(() => screen.remove(), 500);
    opts.onPlay();
  });
  const row = el("div", {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  });
  const settings = button("⚙️ Settings", "rgba(255,255,255,0.12)", "#f3ecff");
  settings.id = "title-settings";
  settings.addEventListener("click", opts.onSettings);
  const credits = button("💜 Credits", "rgba(255,255,255,0.12)", "#f3ecff");
  credits.id = "title-credits";
  credits.addEventListener("click", opts.onCredits);
  row.append(settings, credits);
  screen.append(
    art,
    play,
    row,
    el(
      "div",
      {
        color: "rgba(243,236,255,0.6)",
        font: "13px system-ui, sans-serif",
        marginTop: "6px",
      },
      "A Panda Studios game",
    ),
  );
  document.body.append(screen);
  document.body.dataset.title = "open";
  const obs = new MutationObserver(() => {
    if (!screen.isConnected) {
      document.body.dataset.title = "closed";
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true });
}

// ---- Settings (with help, from the ⚙️ button) ----

/** An on/off switch row. */
function toggle(
  label: string,
  icon: string,
  on: boolean,
  onChange: (on: boolean) => void,
  id: string,
): HTMLElement {
  const row = el("label", { display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" });
  const input = el("input", { width: "26px", height: "26px", accentColor: "#9dffc8" });
  input.type = "checkbox";
  input.checked = on;
  input.id = id;
  input.addEventListener("change", () => onChange(input.checked));
  row.append(
    el("div", { fontSize: "22px", width: "28px" }, icon),
    el("div", { flex: "1" }, label),
    input,
  );
  return row;
}

function slider(
  label: string,
  icon: string,
  value: number,
  onInput: (v: number) => void,
  id: string,
): HTMLElement {
  const row = el("label", { display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" });
  const input = el("input", { flex: "1", accentColor: "#9dffc8", height: "28px" });
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.value = String(Math.round(value * 100));
  input.id = id;
  input.setAttribute("aria-label", label);
  const shown = el("div", {
    width: "40px",
    textAlign: "right",
    fontSize: "13px",
    color: "#c8bdf0",
  });
  shown.textContent = `${input.value}%`;
  input.addEventListener("input", () => {
    shown.textContent = `${input.value}%`;
    onInput(Number(input.value) / 100);
  });
  row.append(
    el("div", { fontSize: "22px", width: "28px" }, icon),
    el("div", { width: "70px" }, label),
    input,
    shown,
  );
  return row;
}

/**
 * The ⚙️ menu: music and effects volumes, then help (how to play, feedback, bug report), the
 * credits, and back to the title. From the title screen it shows just the settings.
 */
export function openMenu(opts: {
  settings: Settings;
  onSettings: (s: Settings) => void;
  /** Leave these out when opened from the title screen. */
  onHowTo?: () => void;
  onFeedback?: () => void;
  onBug?: () => void;
  onCredits?: () => void;
  onTitle?: () => void;
}): void {
  logEvent("opened menu");
  const { shade, box } = card("menu-panel", "rgba(157,255,200,0.6)");
  const close = () => shade.remove();
  shade.addEventListener("click", (e) => {
    if (e.target === shade) close();
  });
  heading(box, opts.onTitle ? "⚙️ Menu" : "⚙️ Settings", "#c9ffe0", close);
  const s = { ...opts.settings };
  box.append(
    el(
      "div",
      { font: "600 15px system-ui, sans-serif", color: "#ffe08a", marginTop: "4px" },
      "Sound",
    ),
    slider(
      "Music",
      "🎵",
      s.music,
      (v) => opts.onSettings({ ...s, music: (s.music = v) }),
      "music-volume",
    ),
    slider(
      "Effects",
      "🔔",
      s.effects,
      (v) => opts.onSettings({ ...s, effects: (s.effects = v) }),
      "effects-volume",
    ),
    toggle(
      "Vibration",
      "📳",
      s.vibration,
      (on) => opts.onSettings({ ...s, vibration: (s.vibration = on) }),
      "vibration",
    ),
    el(
      "div",
      { fontSize: "12px", color: "#c8bdf0" },
      "The 🔊 button (the last of the buttons down the top right) turns all sound off or on.",
    ),
  );
  const links: [string, (() => void) | undefined][] = [
    ["❓ How to play", opts.onHowTo],
    ["💬 Send feedback", opts.onFeedback],
    ["🐛 Report a bug", opts.onBug],
    ["💜 Credits", opts.onCredits],
    ["🏠 Back to title", opts.onTitle],
  ];
  const list = el("div", {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "14px",
  });
  for (const [label, act] of links) {
    if (!act) continue;
    const b = button(label, "rgba(255,255,255,0.1)", "#f3ecff");
    css(b, { textAlign: "left" });
    b.addEventListener("click", () => {
      close();
      act();
    });
    list.append(b);
  }
  if (list.childElementCount) box.append(list);
}

// ---- Credits ----

const CREDITS: [string, string][] = [
  ["🐼 Created by", "Jacob, Master Panda of Panda Studios"],
  ["🎨 Game design and testing", "Master Panda, with friends who played early builds"],
  ["🧙‍♀️ Code, drawing and music", "Made with Claude, every dragon drawn by code"],
  ["🐈‍⬛ Jinxy the cat", "Drawn from a photo of Jacob's real cat"],
  ["🎶 Music", "Cozy lo-fi, played live by code (no recordings)"],
  ["✍️ Title font", "Pacifico by Vernon Adams (SIL Open Font License)"],
  ["💜 Thank you", "For raising noodle dragons with us!"],
];

export function openCredits(onClose?: () => void): void {
  logEvent("opened credits");
  const { shade, box } = card("credits-panel", "rgba(255,138,216,0.6)", "13");
  const close = () => {
    shade.remove();
    onClose?.();
  };
  shade.addEventListener("click", (e) => {
    if (e.target === shade) close();
  });
  heading(box, "💜 Credits", "#ffd6f5", close);
  box.append(
    el(
      "div",
      {
        font: '20px "Pacifico", cursive',
        color: "#9dffc8",
        textAlign: "center",
        margin: "4px 0 10px",
      },
      "Noodle Dragons",
    ),
  );
  for (const [who, what] of CREDITS) {
    const row = el("div", { margin: "8px 0", textAlign: "center" });
    row.append(
      el("div", { font: "600 14px system-ui, sans-serif", color: "#ffe08a" }, who),
      el("div", { fontSize: "14px" }, what),
    );
    box.append(row);
  }
  box.append(
    el(
      "div",
      { textAlign: "center", fontSize: "12px", color: "#a99fd6", marginTop: "10px" },
      `© ${new Date().getFullYear()} Panda Studios`,
    ),
  );
}
