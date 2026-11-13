/**
 * A small diary of what happened this visit, attached to bug reports: the last taps, panels and
 * any errors, plus the device. Nothing personal (no names, no saved data).
 */
const MAX = 60;
const lines: string[] = [];
const started = Date.now();

const stamp = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;

/** Notes something that happened (kept to the last 60). */
export function logEvent(text: string): void {
  lines.push(`${stamp()} ${text}`);
  if (lines.length > MAX) lines.splice(0, lines.length - MAX);
}

/** Starts catching errors, so they end up in the log. */
export function watchErrors(): void {
  window.addEventListener("error", (e) => {
    logEvent(`ERROR ${e.message} @ ${e.filename?.split("/").pop() ?? "?"}:${e.lineno}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    logEvent(`ERROR (promise) ${String(e.reason).slice(0, 160)}`);
  });
}

/** The whole log as text: the device and game state first, then the diary. */
export function logText(extra: Record<string, string | number | undefined>): string {
  const head = [
    `build ${__BUILD__}`,
    `screen ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio || 1}x`,
    `device ${navigator.userAgent}`,
    ...Object.entries(extra)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k} ${v}`),
  ];
  return [...head, "---", ...lines].join("\n");
}
