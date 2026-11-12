import type { Point } from "../noodle/spine";
import { cornerButton } from "./layout";

export type Expression = "normal" | "happy" | "wow" | "sleepy";
export type Frame = "none" | "polaroid" | "stars";

/** Photo mode: everything else steps aside so you can pose your dragon and snap it. */
export interface PhotoState {
  /** Holding still: the dragon stops moving so the pose stays put. */
  frozen: boolean;
  expression: Expression;
  frame: Frame;
}

export const newPhoto = (): PhotoState => ({
  frozen: false,
  expression: "normal",
  frame: "polaroid",
});

/** The camera button: sixth in the top-right stack. */
export function cameraButton(width: number, height: number): Point & { r: number } {
  return cornerButton(5, width, height);
}

export function onCameraButton(p: Point, width: number, height: number): boolean {
  const b = cameraButton(width, height);
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.3;
}

/** A little camera in a bubble. */
export function drawCameraButton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const b = cameraButton(width, height);
  ctx.save();
  ctx.fillStyle = "rgba(20,14,60,0.85)";
  ctx.strokeStyle = "rgba(122,243,255,0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const s = b.r * 0.5;
  ctx.fillStyle = "#bff9ff";
  ctx.beginPath();
  ctx.roundRect(b.x - s, b.y - s * 0.6, s * 2, s * 1.4, s * 0.3);
  ctx.fill();
  ctx.fillRect(b.x - s * 0.35, b.y - s * 0.85, s * 0.7, s * 0.3);
  ctx.beginPath();
  ctx.arc(b.x, b.y + s * 0.1, s * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1040";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(b.x, b.y + s * 0.1, s * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = "#7af3ff";
  ctx.fill();
  ctx.restore();
}

/** A photo's file name, like "noodlepuff-2026-11-12-1734.png". */
export function photoFileName(name: string, when: Date): string {
  const slug =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dragon";
  const two = (n: number) => String(n).padStart(2, "0");
  const stamp = `${when.getFullYear()}-${two(when.getMonth() + 1)}-${two(when.getDate())}-${two(when.getHours())}${two(when.getMinutes())}`;
  return `${slug}-${stamp}.png`;
}

/** The date for a polaroid caption, like "Nov 12, 2026". */
export const captionDate = (when: Date): string =>
  when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Draws the chosen frame over the whole screen (it's part of the photo): a polaroid border with
 * the name and date, or a starry border. A tiny "Noodle Dragons" mark sits in the corner.
 */
export function drawPhotoFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: Frame,
  name: string,
  when: Date,
  time: number,
): void {
  ctx.save();
  if (frame === "polaroid") {
    const side = Math.max(14, Math.min(w, h) * 0.04);
    const bottom = Math.max(56, h * 0.13);
    ctx.fillStyle = "#fdfbf6";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.roundRect(side, side, w - side * 2, h - side - bottom, 6);
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(side, side, w - side * 2, h - side - bottom);
    ctx.fillStyle = "#4b3a8a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const big = Math.min(bottom * 0.42, 40);
    ctx.font = `${big}px "Pacifico", cursive`;
    ctx.fillText(name, w / 2, h - bottom * 0.58, w - side * 4);
    ctx.font = `600 ${Math.max(11, big * 0.38)}px system-ui, sans-serif`;
    ctx.fillStyle = "#8b7fb8";
    ctx.fillText(captionDate(when), w / 2, h - bottom * 0.2);
  } else if (frame === "stars") {
    // A soft dark vignette, then twinkling gold stars round the edge.
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.75,
    );
    g.addColorStop(0, "rgba(10,6,40,0)");
    g.addColorStop(1, "rgba(10,6,40,0.75)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const n = 28;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      // Walk round the edge of the screen.
      const per = 2 * (w + h);
      let d = t * per;
      let x: number;
      let y: number;
      if (d < w) [x, y] = [d, 0];
      else if ((d -= w) < h) [x, y] = [w, d];
      else if ((d -= h) < w) [x, y] = [w - d, h];
      else [x, y] = [0, h - (d - w)];
      const inset = Math.min(w, h) * 0.035 * (1 + (k % 3) * 0.4);
      x = Math.min(w - inset, Math.max(inset, x));
      y = Math.min(h - inset, Math.max(inset, y));
      const tw = 0.6 + 0.4 * Math.sin(time * 3 + k * 1.7);
      const r = Math.min(w, h) * (k % 3 === 0 ? 0.022 : 0.013) * tw;
      ctx.beginPath();
      for (let q = 0; q < 10; q++) {
        const a = -Math.PI / 2 + (q * Math.PI) / 5;
        const rr = q % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = k % 4 === 0 ? "#ffd6f5" : "#ffe08a";
      ctx.fill();
    }
  }
  // A tiny mark in the corner.
  ctx.font = '12px "Pacifico", cursive';
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = frame === "polaroid" ? "rgba(75,58,138,0.5)" : "rgba(255,255,255,0.55)";
  const pad = frame === "polaroid" ? Math.max(14, Math.min(w, h) * 0.04) + 4 : 10;
  ctx.fillText("Noodle Dragons", w - pad, h - 6);
  ctx.restore();
}

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) =>
  Object.assign(el.style, style);

function chip(label: string, on: boolean): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = label;
  css(b, {
    font: "600 15px system-ui, sans-serif",
    color: on ? "#1a1040" : "#f3ecff",
    background: on ? "#7af3ff" : "rgba(255,255,255,0.12)",
    border: "none",
    borderRadius: "999px",
    padding: "8px 12px",
    minHeight: "40px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });
  return b;
}

/**
 * The photo toolbar along the top: hold still, faces, frames, snap and done. It changes `state`
 * in place; `onSnap` takes the picture and `onDone` leaves photo mode.
 */
export function openPhotoBar(
  state: PhotoState,
  onSnap: () => void,
  onDone: () => void,
  onChange: () => void,
): void {
  document.getElementById("photo-bar")?.remove();
  const bar = document.createElement("div");
  bar.id = "photo-bar";
  css(bar, {
    position: "fixed",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "calc(100% - 16px)",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    background: "rgba(20,14,60,0.88)",
    border: "2px solid rgba(122,243,255,0.5)",
    borderRadius: "22px",
    zIndex: "9",
  });
  const render = () => {
    bar.replaceChildren();
    const hold = chip(state.frozen ? "▶ Move" : "✋ Hold still", state.frozen);
    hold.addEventListener("click", () => {
      state.frozen = !state.frozen;
      onChange();
      render();
    });
    bar.appendChild(hold);
    const faces: [Expression, string][] = [
      ["normal", "🙂"],
      ["happy", "😊"],
      ["wow", "😮"],
      ["sleepy", "😴"],
    ];
    for (const [e, icon] of faces) {
      const b = chip(icon, state.expression === e);
      b.setAttribute("aria-label", `Face: ${e}`);
      b.addEventListener("click", () => {
        state.expression = e;
        onChange();
        render();
      });
      bar.appendChild(b);
    }
    const frames: [Frame, string][] = [
      ["none", "⬚"],
      ["polaroid", "🖼️"],
      ["stars", "⭐"],
    ];
    for (const [f, icon] of frames) {
      const b = chip(icon, state.frame === f);
      b.setAttribute("aria-label", `Frame: ${f}`);
      b.addEventListener("click", () => {
        state.frame = f;
        onChange();
        render();
      });
      bar.appendChild(b);
    }
    const snap = chip("📸 Snap", false);
    css(snap, { background: "#ff8ad8", color: "#1a1040" });
    snap.addEventListener("click", onSnap);
    const done = chip("✕", false);
    done.setAttribute("aria-label", "Done");
    done.addEventListener("click", () => {
      bar.remove();
      onDone();
    });
    bar.append(snap, done);
  };
  render();
  document.body.appendChild(bar);
}

export function closePhotoBar(): void {
  document.getElementById("photo-bar")?.remove();
}

/** A quick white camera flash over the screen. */
export function flash(): void {
  const f = document.createElement("div");
  css(f, {
    position: "fixed",
    inset: "0",
    background: "#ffffff",
    opacity: "0.9",
    transition: "opacity 0.45s ease-out",
    pointerEvents: "none",
    zIndex: "12",
  });
  document.body.appendChild(f);
  requestAnimationFrame(() => (f.style.opacity = "0"));
  setTimeout(() => f.remove(), 600);
}

/** The Claude app's file saver, when the game runs inside it (null everywhere else). */
interface Saver {
  save(r: { filename: string; data: Blob }): Promise<{ status: string }>;
}
type ClaudeHost = { use?: (name: string) => Promise<unknown> };
let saver: Saver | null = null;
let saverAsked = false;
/** Starts asking for the Claude app's file saver early, so it's ready by the time you save. */
function askForSaver(): Promise<Saver | null> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (!host?.use) return Promise.resolve(null);
  saverAsked = true;
  return host
    .use("downloads")
    .then((d) => (saver = (d as Saver | null) ?? null))
    .catch(() => null);
}
const saverReady: Promise<Saver | null> =
  typeof window !== "undefined" ? askForSaver() : Promise.resolve(null);

/**
 * Saves a photo to the device: through the Claude app's saver when the game runs inside it
 * (the viewer confirms), otherwise as an ordinary download.
 */
async function savePhoto(blob: Blob, fileName: string): Promise<"saved" | "declined"> {
  const s =
    saver ??
    (saverAsked
      ? await Promise.race([saverReady, new Promise<null>((r) => setTimeout(() => r(null), 1500))])
      : null);
  if (s) {
    try {
      await s.save({ filename: fileName, data: blob });
      return "saved";
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "declined" || code === "rate_limited") return "declined";
      // Any other trouble: fall back to an ordinary download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "saved";
}

/** Shows the photo just taken, with Save (to the device) and Share (where the device can). */
export function showPhoto(blob: Blob, fileName: string): void {
  document.getElementById("photo-preview")?.remove();
  const url = URL.createObjectURL(blob);
  const shade = document.createElement("div");
  shade.id = "photo-preview";
  css(shade, {
    position: "fixed",
    inset: "0",
    background: "rgba(8,6,30,0.8)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
    zIndex: "11",
  });
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Your photo";
  css(img, {
    maxWidth: "min(720px, 100%)",
    maxHeight: "70vh",
    borderRadius: "10px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    transform: "rotate(-1.5deg)",
  });
  const row = document.createElement("div");
  css(row, { display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" });
  const save = chip("💾 Save", true);
  save.addEventListener("click", () => {
    save.textContent = "Saving…";
    void savePhoto(blob, fileName).then((r) => {
      save.textContent = r === "saved" ? "✓ Saved" : "💾 Save";
    });
  });
  row.appendChild(save);
  const file = new File([blob], fileName, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    const share = chip("📤 Share", false);
    share.addEventListener("click", () => {
      navigator.share({ files: [file], title: "My Noodle Dragon" }).catch(() => {});
    });
    row.appendChild(share);
  }
  const again = chip("📸 Another", false);
  again.addEventListener("click", () => {
    shade.remove();
    URL.revokeObjectURL(url);
  });
  row.appendChild(again);
  shade.append(img, row);
  document.body.appendChild(shade);
}
