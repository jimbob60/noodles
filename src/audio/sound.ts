import {
  freq,
  melodyRandom,
  parseSoundSetting,
  STEP_SECONDS,
  stepAt,
  type SoundSetting,
} from "./music";

/**
 * All the game's sound (phase 43), made by code with Web Audio: no sound files. A lo-fi loop
 * (soft keys, bass, quiet drums, a bell melody and vinyl crackle through a warm filter) and
 * gentle effects: chirps, purrs, munches, coins, bubbles, pops and sparkles. Nothing loud or
 * sharp.
 *
 * Browsers only allow sound after the first tap, so nothing starts until then. The 🔊 button
 * turns everything off or on (remembered on this device), and sound pauses while the game is
 * hidden.
 */

const KEY = "noodle-dragons.sound";
/** How loud the music and the effects are (0–1, before the master). */
const MUSIC_LEVEL = 0.32;
const SFX_LEVEL = 0.55;

class Sound {
  setting: SoundSetting = "on";
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  /** The warm lo-fi filter the music goes through. */
  private warm!: BiquadFilterNode;
  private noise!: AudioBuffer;
  private purrOsc: OscillatorNode | null = null;
  private purrGain: GainNode | null = null;
  private timer = 0;
  private nextStep = 0;
  private nextTime = 0;
  private random = melodyRandom(7);
  private sleepy = false;
  private lastCoin = 0;

  constructor() {
    try {
      this.setting = parseSoundSetting(localStorage.getItem(KEY));
    } catch {
      // No storage here: sound on.
    }
    if (typeof document !== "undefined") document.body.dataset.sound = this.setting;
  }

  /** Call on the first tap: browsers only allow sound to start from a tap. */
  unlock(): void {
    if (this.ctx || this.setting === "off") {
      if (this.ctx && this.setting === "on") void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
    this.warm = ctx.createBiquadFilter();
    this.warm.type = "lowpass";
    this.warm.frequency.value = 2400;
    this.warm.Q.value = 0.4;
    this.music = ctx.createGain();
    this.music.gain.value = 0;
    this.music.gain.linearRampToValueAtTime(MUSIC_LEVEL, ctx.currentTime + 3);
    this.music.connect(this.warm).connect(this.master);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = SFX_LEVEL;
    this.sfx.connect(this.master);
    // Two seconds of soft noise, for drums, crackle, munches and splashes.
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.startCrackle();
    this.nextTime = ctx.currentTime + 0.2;
    this.timer = window.setInterval(() => this.schedule(), 100);
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.setting === "on") void this.ctx.resume();
    });
    document.body.dataset.audio = "started";
  }

  /** Turns all sound on or off (remembered on this device). */
  toggle(): SoundSetting {
    this.setting = this.setting === "on" ? "off" : "on";
    try {
      localStorage.setItem(KEY, this.setting);
    } catch {
      // No storage: it just won't be remembered.
    }
    document.body.dataset.sound = this.setting;
    if (this.setting === "off") void this.ctx?.suspend();
    else if (this.ctx) void this.ctx.resume();
    else this.unlock();
    return this.setting;
  }

  /** Bedtime: the music turns into a soft lullaby (no drums, a darker, sleepier sound). */
  setSleepy(on: boolean): void {
    this.sleepy = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.warm.frequency.cancelScheduledValues(t);
    this.warm.frequency.setTargetAtTime(on ? 1100 : 2400, t, 1.2);
    this.music.gain.setTargetAtTime(on ? MUSIC_LEVEL * 0.7 : MUSIC_LEVEL, t, 1.2);
  }

  private get live(): boolean {
    return !!this.ctx && this.setting === "on" && this.ctx.state === "running";
  }

  // ---- The music ----

  private schedule(): void {
    if (!this.ctx || !this.live) return;
    const ahead = this.ctx.currentTime + 0.35;
    // After a pause (a hidden tab), pick up from now rather than racing to catch up.
    if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < ahead) {
      const step = stepAt(this.nextStep, this.random, this.sleepy);
      // A little swing on the off-beats, for that laid-back feel.
      const t = this.nextTime + (this.nextStep % 2 === 1 ? STEP_SECONDS * 0.12 : 0);
      if (step.keys) for (const n of step.keys) this.keys(n, t, STEP_SECONDS * 7);
      if (step.bass !== null) this.bass(step.bass, t, STEP_SECONDS * 3.5);
      if (step.kick) this.kick(t);
      if (step.snare) this.snare(t);
      if (step.hat) this.hat(t);
      if (step.melody !== null) this.bell(step.melody, t, this.music, 0.09);
      this.nextStep++;
      this.nextTime += STEP_SECONDS;
    }
  }

  /** A note with a soft attack and a long fade, through `out`. */
  private tone(
    out: AudioNode,
    type: OscillatorType,
    hz: number,
    t: number,
    len: number,
    level: number,
    attack = 0.02,
  ): OscillatorNode {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = hz;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
    return o;
  }

  /** Soft electric-piano keys: a sine with a quiet, slightly detuned triangle on top. */
  private keys(note: number, t: number, len: number): void {
    this.tone(this.music, "sine", freq(note), t, len, 0.06, 0.04);
    const o = this.tone(this.music, "triangle", freq(note), t, len * 0.6, 0.02, 0.03);
    o.detune.value = 6;
  }

  private bass(note: number, t: number, len: number): void {
    this.tone(this.music, "sine", freq(note), t, len, 0.16, 0.03);
  }

  private bell(note: number, t: number, out: AudioNode, level: number): void {
    this.tone(out, "sine", freq(note), t, 1.4, level, 0.005);
    this.tone(out, "sine", freq(note) * 2.01, t, 0.5, level * 0.25, 0.005);
  }

  private kick(t: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + 0.32);
  }

  /** A burst of filtered noise. */
  private hiss(
    out: AudioNode,
    t: number,
    len: number,
    level: number,
    type: BiquadFilterType,
    hz: number,
  ): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random());
    src.stop(t + len + 0.02);
  }

  private snare(t: number): void {
    this.hiss(this.music, t, 0.16, 0.07, "bandpass", 1800);
  }

  private hat(t: number): void {
    this.hiss(this.music, t, 0.05, 0.025, "highpass", 7000);
  }

  /** Vinyl crackle: the noise, thinned to little clicks, looping quietly forever. */
  private startCrackle(): void {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = Math.random() < 0.0009 ? (Math.random() - 0.5) * 0.9 : 0;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 3000;
    const g = ctx.createGain();
    g.gain.value = 0.18;
    src.connect(f).connect(g).connect(this.music);
    src.start();
  }

  // ---- The effects ----

  /** A happy two-note chirp (excited, a boop, hello). */
  chirp(): void {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    for (const [at, from, to] of [
      [0, 900, 1400],
      [0.09, 1100, 1700],
    ]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(from, t + at);
      o.frequency.exponentialRampToValueAtTime(to, t + at + 0.07);
      g.gain.setValueAtTime(0, t + at);
      g.gain.linearRampToValueAtTime(0.12, t + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.09);
      o.connect(g).connect(this.sfx);
      o.start(t + at);
      o.stop(t + at + 0.1);
    }
  }

  /** A soft little coin ding (no more than a few a second). */
  coin(): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    if (t - this.lastCoin < 0.09) return;
    this.lastCoin = t;
    this.bell(88, t, this.sfx, 0.07);
    this.bell(95, t + 0.06, this.sfx, 0.06);
  }

  /** Nom nom: two soft crunchy bumps. */
  munch(): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    this.hiss(this.sfx, t, 0.08, 0.16, "lowpass", 900);
    this.hiss(this.sfx, t + 0.13, 0.08, 0.13, "lowpass", 800);
  }

  /** A bubble (bath time): a quick rising bloop. */
  bubble(): void {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const from = 260 + Math.random() * 200;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(from * 3, t + 0.09);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.12);
  }

  /** A soft pop (catching a dumpling, a ball boop). */
  pop(): void {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(700, t);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.08);
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.11);
  }

  /** An eggshell crack. */
  crack(): void {
    if (!this.live) return;
    this.hiss(this.sfx, this.ctx!.currentTime, 0.07, 0.22, "bandpass", 2600);
  }

  /** A sparkly rising arpeggio (hatching, a new Dragondex page, a goal done, a sticker). */
  sparkle(): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    [79, 83, 86, 91].forEach((n, i) => this.bell(n, t + i * 0.08, this.sfx, 0.07));
  }

  /** Goodnight: three soft falling notes. */
  lullaby(): void {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    [76, 72, 67].forEach((n, i) => this.bell(n, t + i * 0.28, this.sfx, 0.06));
  }

  /**
   * The purr while petting (0 = quiet, 1 = full purr): a low rumble that throbs, fading in and
   * out smoothly. Call every frame.
   */
  purr(level: number): void {
    if (!this.ctx || this.setting === "off") return;
    const ctx = this.ctx;
    if (!this.purrOsc) {
      if (level <= 0.02) return;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 52;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 240;
      const throb = ctx.createGain();
      throb.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 23;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain).connect(throb.gain);
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(f).connect(throb).connect(g).connect(this.sfx);
      o.start();
      lfo.start();
      this.purrOsc = o;
      this.purrGain = g;
    }
    this.purrGain!.gain.setTargetAtTime(Math.min(1, level) * 0.22, ctx.currentTime, 0.12);
  }
}

/** The one sound system for the game. */
export const sound = new Sound();
