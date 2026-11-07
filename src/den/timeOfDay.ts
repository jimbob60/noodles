import { type Hsl } from "../noodle/look";

/** How the sky looks at one moment of the day. */
export interface Sky {
  top: Hsl;
  bottom: Hsl;
  /** 0–1: how bright the stars are. */
  stars: number;
  /** 0–1: how dark it is (crystals, mushrooms and fireflies glow brighter in the dark). */
  dark: number;
}

/**
 * Keyframes through a day, by hour. Day is a soft twilight, never harsh bright (VISION.md):
 * nothing goes above 62% lightness.
 */
const KEYS: { hour: number; sky: Sky }[] = [
  {
    hour: 0,
    sky: { top: { h: 245, s: 60, l: 7 }, bottom: { h: 258, s: 55, l: 17 }, stars: 1, dark: 1 },
  },
  {
    hour: 4.5,
    sky: { top: { h: 245, s: 60, l: 8 }, bottom: { h: 262, s: 55, l: 19 }, stars: 1, dark: 1 },
  },
  {
    hour: 6,
    sky: {
      top: { h: 262, s: 45, l: 26 },
      bottom: { h: 330, s: 55, l: 54 },
      stars: 0.35,
      dark: 0.6,
    },
  },
  {
    hour: 8,
    sky: {
      top: { h: 212, s: 50, l: 36 },
      bottom: { h: 282, s: 40, l: 58 },
      stars: 0.05,
      dark: 0.2,
    },
  },
  {
    hour: 16.5,
    sky: {
      top: { h: 215, s: 50, l: 36 },
      bottom: { h: 285, s: 42, l: 58 },
      stars: 0.05,
      dark: 0.2,
    },
  },
  {
    hour: 18.5,
    sky: { top: { h: 268, s: 50, l: 23 }, bottom: { h: 18, s: 70, l: 58 }, stars: 0.4, dark: 0.6 },
  },
  {
    hour: 20.5,
    sky: { top: { h: 248, s: 58, l: 9 }, bottom: { h: 260, s: 55, l: 19 }, stars: 1, dark: 1 },
  },
  {
    hour: 24,
    sky: { top: { h: 245, s: 60, l: 7 }, bottom: { h: 258, s: 55, l: 17 }, stars: 1, dark: 1 },
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mixHsl(a: Hsl, b: Hsl, t: number): Hsl {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { h: (a.h + dh * t + 360) % 360, s: lerp(a.s, b.s, t), l: lerp(a.l, b.l, t) };
}

/** The local hour of a time, as a number 0–24 (e.g. 18.5 is half past six in the evening). */
export function hourOf(time: number): number {
  const d = new Date(time);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** The sky at an hour (0–24), blended smoothly between keyframes. */
export function skyAt(hour: number): Sky {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].hour <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  // Ease in and out between keyframes, so changes are gentle.
  const raw = (h - a.hour) / (b.hour - a.hour);
  const t = raw * raw * (3 - 2 * raw);
  return {
    top: mixHsl(a.sky.top, b.sky.top, t),
    bottom: mixHsl(a.sky.bottom, b.sky.bottom, t),
    stars: lerp(a.sky.stars, b.sky.stars, t),
    dark: lerp(a.sky.dark, b.sky.dark, t),
  };
}

/** Where the moon (night) or a soft sun (day) sits, as 0–1 across the sky arch, or null. */
export function lightInSky(hour: number): { kind: "moon" | "sun"; x: number; y: number } | null {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 7 && h <= 18) {
    const t = (h - 7) / 11;
    return { kind: "sun", x: 0.15 + 0.7 * t, y: 0.75 - Math.sin(t * Math.PI) * 0.5 };
  }
  if (h >= 19.5 || h <= 5.5) {
    const t = ((h - 19.5 + 24) % 24) / 10;
    return { kind: "moon", x: 0.15 + 0.7 * t, y: 0.7 - Math.sin(t * Math.PI) * 0.5 };
  }
  return null;
}
