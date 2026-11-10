import type { FoodId } from "../care/food";
import { favoriteFood } from "../care/food";
import { tickleSpots } from "../care/petting";
import { needOf, PACE, type Mood } from "../care/mood";
import { drawNeedIcon } from "../ui/needsBar";
import type { PointerState } from "../engine/input";
import { FOOD_COLOR } from "../ui/foodArt";
import { Follower } from "../follower";
import { bodyOutline, bodyProfile, traceSmoothLoop } from "./body";
import { bodyHalfWidth, drawBody, drawRidge } from "./drawBody";
import { drawLegs, drawTailTuft, drawWhiskers } from "./drawExtras";
import { drawHead, headColors, MOUTH, type HeadColors } from "./drawHead";
import { CHEW_TIME, Face, SHAKE_TIME, YAWN_TIME } from "./face";
import { IdleBrain, type World } from "./idleBrain";
import { legSizes, makeLegs, updateLegs, type Leg, type LegSizes } from "./legs";
import { CLASSIC_LOOK, hsl, type DragonLook } from "./look";
import { Spine, type Point } from "./spine";
import { Swimmer } from "./swimmer";
import { headToWorld, Whiskers } from "./whiskers";

const SPINE_POINTS = 26;
/** A just-hatched baby's length, in spine points (it grows to SPINE_POINTS). */
const BABY_POINTS = 12;

/** How many spine points long a dragon is at a given growth (0 baby, 1 grown). */
export function lengthAt(growth: number): number {
  return Math.round(BABY_POINTS + (SPINE_POINTS - BABY_POINTS) * Math.max(0, Math.min(1, growth)));
}
/** Seconds after the finger lets go before the dragon goes back to doing its own thing. */
export const CALM_DOWN = 2.5;

interface Zee {
  x: number;
  y: number;
  age: number;
}

/** Little bits that fly off while eating: crumbs fall, hearts float up. */
interface Bit {
  kind: "crumb" | "heart" | "sparkle";
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  color: string;
}

/** A petting that got the purr at least this deep ends in an excited loop-de-loop. */
export const EXCITE_PURR = 0.6;
/** Seconds of the excited loop-de-loop. */
export const EXCITE_TIME = 1.4;

/** How quickly the head swims toward held-out food (slower than following a finger: it reaches). */
const LURE_RATE = 4;
/** Top swimming speed toward food, in spine units per second, so you can watch it swim over. */
export const LURE_TOP_SPEED = 16;

/** One noodle dragon: its body parts, and who is steering it (the finger or its idle brain). */
export class Dragon {
  readonly spine: Spine;
  readonly face = new Face();
  readonly brain: IdleBrain;
  private readonly head: Follower;
  private readonly swimmer: Swimmer;
  private readonly whiskers: Whiskers;
  private sizes: LegSizes;
  private legs: Leg[];
  /** True while the finger is steering, and for a moment after it lets go. */
  private held = false;
  private sinceTouch = 0;
  private time = 0;
  private zees: Zee[] = [];
  private zeeClock = 0;
  private headPalette: HeadColors;
  /** Food being held out to the dragon; it swims over to reach it. */
  lure: Point | null = null;
  /** True while (or right after) going after food, as opposed to being steered by a finger. */
  private wasLured = false;
  /**
   * Where the finger last pressed. After a drag the dragon settles there; a mouse that merely
   * hovers afterwards must not steer it.
   */
  private lastPress: Point = { x: 0, y: 0 };
  readonly favorite: FoodId;
  /** Secret tickle spots along the body (0 = nose, 1 = tail tip). */
  readonly tickles: number[];
  /** Being petted: hold still, purr (0–1) and maybe giggle (seconds left). */
  pet = { active: false, purr: 0, giggle: 0 };
  private petAnchor: Point | null = null;
  /** Deepest purr in the current petting, to decide if it ends in excitement. */
  private petPeak = 0;
  /** Seconds left of the excited loop-de-loop after a good petting. */
  exciteLeft = 0;
  private exciteCentre: Point = { x: 0, y: 0 };
  /** How it feels (set from its needs each frame). */
  private _mood: Mood = "content";
  /** 0–1: how grubby it looks (dust smudges). */
  grime = 0;
  /** Where the food tray is, for hungry glances. */
  foodTrayAt: Point | null = null;
  private moodClock = 0;
  private nextMoodBeat = 4;
  private rumbleLeft = 0;
  private scratchLeft = 0;
  private glanceLeft = 0;
  /** Thought bubble: seconds left showing. */
  private thinkLeft = 0;
  private thinkClock = 0;
  private bits: Bit[] = [];
  /** How grown up, 0 (just hatched) to 1 (grown). Change it with setGrowth. */
  growth = 1;
  /** The spine spacing for a grown dragon on this screen. */
  private baseSegment: number;

  constructor(
    x: number,
    y: number,
    segment: number,
    world: World,
    public look: DragonLook = CLASSIC_LOOK,
    random = Math.random,
  ) {
    this.headPalette = headColors(look);
    this.favorite = favoriteFood(look.seed);
    this.tickles = tickleSpots(look.seed);
    this.baseSegment = segment;
    this.spine = new Spine(x, y, SPINE_POINTS, segment);
    this.head = new Follower(x, y);
    this.swimmer = new Swimmer(x, y, -Math.PI / 2);
    this.brain = new IdleBrain(random);
    this.brain.start("wander", this.swimmer, world);
    this.whiskers = new Whiskers(this.spine.head, segment * 0.95);
    this.sizes = legSizes(this.halfWidth);
    this.legs = makeLegs(this.spine.points, this.sizes);
  }

  get halfWidth(): number {
    return bodyHalfWidth(this.spine);
  }

  /** Babies have big heads for their size; it evens out as they grow. */
  get headRadius(): number {
    return this.halfWidth * 1.3 * (1 + 0.35 * (1 - this.growth));
  }

  /**
   * How grown up it is, 0 (just hatched) to 1 (grown): a baby is short and a little slimmer,
   * and the noodle gets longer as it grows. New spine points join at the tail.
   */
  setGrowth(growth: number): void {
    const g = Math.max(0, Math.min(1, growth));
    const count = lengthAt(g);
    const p = this.spine.points;
    const changed = count !== p.length;
    this.growth = g;
    while (p.length > count) p.pop();
    while (p.length < count) {
      const a = p[p.length - 2] ?? { x: p[0].x, y: p[0].y - 1 };
      const b = p[p.length - 1];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const seg = this.spine.segment;
      p.push({ x: b.x + ((b.x - a.x) / d) * seg, y: b.y + ((b.y - a.y) / d) * seg });
    }
    this.spine.resize(this.baseSegment * (0.78 + 0.22 * g));
    this.sizes = legSizes(this.halfWidth);
    if (changed || !this.legs) this.legs = makeLegs(this.spine.points, this.sizes);
    this.whiskers?.resize(this.spine.segment * 0.95);
  }

  get asleep(): boolean {
    return this.brain.asleep && !this.held;
  }

  /** Where the mouth is right now (just under the snout). */
  get mouth(): Point {
    const r = this.headRadius;
    return headToWorld(this.spine.head, this.face, { x: r * MOUTH.x, y: r * MOUTH.y });
  }

  /** Munch! Chomps, crumbs, and hearts if it's the favorite. */
  eat(food: FoodId): void {
    this.face.chewLeft = CHEW_TIME;
    this.face.shakeLeft = 0;
    const m = this.mouth;
    const u = this.halfWidth;
    for (let i = 0; i < 10; i++) {
      this.bits.push({
        kind: "crumb",
        x: m.x,
        y: m.y,
        vx: (Math.random() - 0.5) * u * 6,
        vy: Math.random() * u * 1.5, // crumbs fall from the mouth, away from the eyes
        age: 0,
        life: 0.9,
        color: FOOD_COLOR[food],
      });
    }
    if (food === this.favorite) {
      for (let i = 0; i < 7; i++) {
        this.bits.push({
          kind: "heart",
          x: m.x + (Math.random() - 0.5) * u * 2,
          y: m.y - u,
          vx: (Math.random() - 0.5) * u * 2,
          vy: -u * (2.5 + Math.random() * 2),
          age: -i * 0.08,
          life: 1.6,
          color: "#ff8ad8",
        });
      }
    }
  }

  /**
   * Where on the body a point is: 0 at the nose to 1 at the tail tip, or null if the point
   * isn't on the dragon. Used to tell petting (touching the dragon) from steering.
   */
  spotAt(x: number, y: number): number | null {
    const head = this.spine.head;
    if (Math.hypot(x - head.x, y - head.y) < this.headRadius * 1.15) return 0;
    const p = this.spine.points;
    let best: number | null = null;
    let bestD = Infinity;
    for (let i = 1; i < p.length; i++) {
      const t = i / (p.length - 1);
      const reach = this.halfWidth * bodyProfile(t) * 1.3 + 6;
      const d = Math.hypot(x - p[i].x, y - p[i].y);
      if (d < reach && d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  /** A little sparkle or heart where the dragon is being rubbed. */
  sparkle(x: number, y: number): void {
    const u = this.halfWidth;
    this.bits.push({
      kind: Math.random() < 0.35 ? "heart" : "sparkle",
      x,
      y,
      vx: (Math.random() - 0.5) * u * 2,
      vy: -u * (1.5 + Math.random() * 1.5),
      age: 0,
      life: 1,
      color: Math.random() < 0.5 ? hsl(this.look.accent) : "#fff6c9",
    });
  }

  /** Giggle! Laughing mouth and a squirm. */
  giggle(): void {
    this.face.chewLeft = CHEW_TIME;
    const m = this.mouth;
    for (let i = 0; i < 6; i++) this.sparkle(m.x + (Math.random() - 0.5) * 40, m.y - 10);
  }

  /** Booped the ball with its nose: a little burst of hearts and a happy blink. */
  boop(): void {
    const m = this.mouth;
    for (let i = 0; i < 4; i++) {
      this.bits.push({
        kind: i === 0 ? "heart" : "sparkle",
        x: m.x + (Math.random() - 0.5) * 20,
        y: m.y - 10,
        vx: (Math.random() - 0.5) * this.halfWidth * 3,
        vy: -this.halfWidth * (2 + Math.random() * 2),
        age: 0,
        life: 0.9,
        color: i === 0 ? "#ff8ad8" : "#fff6c9",
      });
    }
  }

  get inBed(): boolean {
    return this.brain.inBed;
  }

  get mood(): Mood {
    return this._mood;
  }

  set mood(m: Mood) {
    this._mood = m;
    this.brain.pace = PACE[m];
  }

  /** Free to show its mood: not asleep, held, petted, eating or chasing. */
  private get free(): boolean {
    return (
      !this.asleep &&
      !this.held &&
      !this.pet.active &&
      !this.lure &&
      this.face.chewLeft === 0 &&
      this.exciteLeft === 0
    );
  }

  /** Every few seconds, a little something that shows how it feels. */
  private updateMood(dt: number): void {
    this.rumbleLeft = Math.max(0, this.rumbleLeft - dt);
    this.scratchLeft = Math.max(0, this.scratchLeft - dt);
    this.glanceLeft = Math.max(0, this.glanceLeft - dt);
    this.thinkLeft = Math.max(0, this.thinkLeft - dt);
    const m = this._mood;
    const f = this.face;
    // Faces follow the mood smoothly.
    const droopTo = m === "tired" && !this.asleep ? 0.5 : 0;
    f.droop += (droopTo - f.droop) * (1 - Math.exp(-3 * dt));
    f.mouthShape =
      m === "happy" || this.exciteLeft > 0
        ? "smile"
        : m === "hungry" || m === "lonely"
          ? "pout"
          : "w";
    f.pleading = m === "lonely" && !this.asleep;
    if (!this.free) return;

    this.moodClock += dt;
    if (this.moodClock >= this.nextMoodBeat) {
      this.moodClock = 0;
      this.nextMoodBeat = 4 + Math.random() * 4;
      if (m === "tired") f.yawnLeft = YAWN_TIME;
      else if (m === "hungry") {
        this.rumbleLeft = 0.6;
        this.glanceLeft = 1.5;
      } else if (m === "grubby") this.scratchLeft = 0.8;
      else if (m === "happy") {
        const h = this.spine.head;
        for (let i = 0; i < 3; i++) this.sparkle(h.x + (Math.random() - 0.5) * 60, h.y - 20);
      }
    }
    // A thought bubble now and then shows what it wants.
    if (needOf(m)) {
      this.thinkClock += dt;
      if (this.thinkClock > 9) {
        this.thinkClock = 0;
        this.thinkLeft = 2.4;
      }
    } else {
      this.thinkClock = 0;
    }
  }

  /** The need shown in its thought bubble right now, or null. */
  get thinkingOf(): string | null {
    return this.thinkLeft > 0 ? needOf(this._mood) : null;
  }

  /** Where the eyes look while showing a mood, or null for the usual. */
  private moodLook(): Point | null {
    if (this.glanceLeft > 0 && this.foodTrayAt) return this.foodTrayAt;
    // Lonely: big eyes looking straight out at you.
    if (this.face.pleading) return this.spine.head;
    return null;
  }

  /** The middle of the body (so the bed can sit under the curled-up dragon). */
  get centre(): Point {
    const p = this.spine.points;
    let x = 0;
    let y = 0;
    for (const q of p) {
      x += q.x;
      y += q.y;
    }
    return { x: x / p.length, y: y / p.length };
  }

  /** Bedtime: swim to the bed and curl up for the night. */
  goToBed(bed: Point, world: World): void {
    this.held = false;
    this.lure = null;
    this.wasLured = false;
    this.swimmer.reset(this.head.x, this.head.y, this.swimmer.heading, this.swimmer.speed);
    this.brain.bedtime(bed, this.swimmer, world);
  }

  /** Good morning! A big yawn, then off to wander. */
  wakeUp(world: World): void {
    if (!this.brain.inBed) return;
    this.face.yawnLeft = YAWN_TIME;
    this.swimmer.reset(this.head.x, this.head.y, this.swimmer.heading, 0);
    this.brain.wake(this.swimmer, world);
  }

  /** After a lovely petting: a burst of hearts and an excited loop-de-loop. */
  getExcited(): void {
    this.exciteLeft = EXCITE_TIME;
    const R = this.halfWidth * 2.6;
    // The loop starts where the head is and goes up and over a circle just behind it.
    this.exciteCentre = { x: this.head.x - R, y: this.head.y };
    const h = this.spine.head;
    const u = this.halfWidth;
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.3;
      this.bits.push({
        kind: i % 3 === 1 ? "sparkle" : "heart",
        x: h.x,
        y: h.y - this.headRadius,
        vx: Math.cos(a) * u * 5,
        vy: Math.sin(a) * u * 5,
        age: -i * 0.03,
        life: 1.3,
        color: i % 3 === 1 ? "#fff6c9" : hsl(this.look.accent),
      });
    }
  }

  /** Squeaky clean! A happy shimmy that shakes droplets everywhere, with sparkles. */
  shakeDry(): void {
    this.scratchLeft = 0.9;
    const h = this.centre;
    const u = this.halfWidth;
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      this.bits.push({
        kind: i % 3 === 0 ? "sparkle" : "crumb",
        x: h.x + Math.cos(a) * u * 2,
        y: h.y + Math.sin(a) * u,
        vx: Math.cos(a) * u * 8,
        vy: Math.sin(a) * u * 6 - u * 4,
        age: 0,
        life: 0.9,
        color: i % 3 === 0 ? "#fff6c9" : "#9fe9ff",
      });
    }
  }

  /** A polite head shake: "no thanks, I'm full". */
  refuse(): void {
    if (this.face.chewLeft <= 0) this.face.shakeLeft = SHAKE_TIME;
  }

  resize(segment: number): void {
    this.baseSegment = segment;
    this.spine.resize(segment * (0.78 + 0.22 * this.growth));
    this.sizes = legSizes(this.halfWidth);
    this.legs = makeLegs(this.spine.points, this.sizes);
    this.whiskers.resize(this.spine.segment * 0.95);
  }

  update(dt: number, input: PointerState, world: World): void {
    this.time += dt;
    const wasPetted = this.petAnchor !== null;
    if (this.pet.active) {
      // Being petted: hold still and lean into it. A giggle makes it squirm.
      if (!this.petAnchor) this.petAnchor = { x: this.head.x, y: this.head.y };
      this.petPeak = Math.max(this.petPeak, this.pet.purr);
      const squirm = this.pet.giggle > 0 ? Math.sin(this.time * 28) * this.halfWidth * 0.35 : 0;
      this.head.update(dt, this.petAnchor.x + squirm, this.petAnchor.y, 12);
    } else if (wasPetted) {
      // Petting over: carry on from here (a sleeping dragon just keeps sleeping).
      this.petAnchor = null;
      const loved = this.petPeak >= EXCITE_PURR;
      this.petPeak = 0;
      if (!this.brain.asleep && !this.brain.inBed) {
        const [h, n] = this.spine.points;
        this.swimmer.reset(h.x, h.y, Math.atan2(h.y - n.y, h.x - n.x), 0);
        this.brain.start("float", this.swimmer, world);
        if (loved) this.getExcited();
      } else {
        this.swimmer.reset(this.head.x, this.head.y, this.swimmer.heading, 0);
      }
    } else if (this.exciteLeft > 0) {
      // Thank you! A happy loop-de-loop on the spot, up and over and back round.
      this.exciteLeft = Math.max(0, this.exciteLeft - dt);
      const a = (1 - this.exciteLeft / EXCITE_TIME) * Math.PI * 2;
      const R = this.halfWidth * 2.6;
      const c = this.exciteCentre;
      this.head.update(dt, c.x + Math.cos(a) * R, c.y - Math.sin(a) * R, 14);
      if (Math.random() < dt * 5) this.sparkle(this.head.x, this.head.y - this.headRadius);
      if (this.exciteLeft === 0) {
        const [h, n] = this.spine.points;
        this.swimmer.reset(h.x, h.y, Math.atan2(h.y - n.y, h.x - n.x), 0);
        this.brain.start("float", this.swimmer, world);
      }
    } else if (this.lure) {
      // Food is being held out: wake up and swim over so the mouth meets it.
      this.held = true;
      this.wasLured = true;
      this.sinceTouch = 0;
      const r = this.headRadius;
      const tx = this.lure.x - this.face.facing * r * 0.72;
      const ty = this.lure.y - r * 0.56;
      const fromX = this.head.x;
      const fromY = this.head.y;
      this.head.update(dt, tx, ty, LURE_RATE);
      // Never faster than a quick swim, however far away the food is.
      const step = Math.hypot(this.head.x - fromX, this.head.y - fromY);
      const max = LURE_TOP_SPEED * this.spine.segment * dt;
      if (step > max) {
        this.head.x = fromX + ((this.head.x - fromX) * max) / step;
        this.head.y = fromY + ((this.head.y - fromY) * max) / step;
      }
    } else if (input.down) {
      // The finger is in charge: wake up and follow it.
      this.held = true;
      this.wasLured = false;
      this.sinceTouch = 0;
      this.lastPress = { x: input.x, y: input.y };
      this.head.update(dt, input.x, input.y);
    } else if (this.held) {
      this.sinceTouch += dt;
      // Settle where the finger last was (not wherever a hovering mouse goes). After food,
      // there is nothing to settle on: go straight back to its own moods.
      if (!this.wasLured) this.head.update(dt, this.lastPress.x, this.lastPress.y);
      if (this.sinceTouch > CALM_DOWN || this.wasLured) {
        this.wasLured = false;
        // Let go: carry on from here, with a dreamy float first.
        this.held = false;
        const [h, n] = this.spine.points;
        this.swimmer.reset(h.x, h.y, Math.atan2(h.y - n.y, h.x - n.x), 0);
        this.brain.start("float", this.swimmer, world);
      }
    } else {
      this.brain.update(dt, this.swimmer, world);
      this.head.x = this.swimmer.x;
      this.head.y = this.swimmer.y;
    }

    if (this.scratchLeft > 0) {
      // A quick scratch: a little side-to-side shimmy.
      this.head.x += Math.sin(this.time * 32) * this.halfWidth * 0.12;
    }
    this.spine.follow(this.head.x, this.head.y);
    const [head, neck] = this.spine.points;
    // Eyes follow the finger; otherwise they look where the dragon is heading.
    const target = this.lure
      ? this.lure
      : this.free && this.moodLook()
        ? this.moodLook()!
        : input.down
          ? { x: input.x, y: input.y }
          : { x: head.x + (head.x - neck.x) * 6, y: head.y + (head.y - neck.y) * 6 };
    this.face.asleep = this.asleep;
    this.face.happy =
      (this.pet.active && (this.pet.purr > 0.3 || this.pet.giggle > 0)) || this.exciteLeft > 0;
    this.face.update(dt, head, neck, target, this.halfWidth * 6);
    updateLegs(this.legs, this.spine.points, this.sizes, dt);
    this.whiskers.update(dt, head, this.headRadius, this.face);
    this.updateZees(dt);
    this.updateBits(dt);
    this.updateMood(dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Slow breathing while asleep.
    const puff = this.asleep ? 1 + Math.sin(this.time * 1.8) * 0.04 : 1;
    const hw = this.halfWidth * puff;
    const purr = this.pet.purr;
    ctx.save();
    if (this.rumbleLeft > 0) {
      // Tummy rumble: a quick little shake.
      ctx.translate(Math.sin(this.time * 70) * 1.6, 0);
    }
    if (purr > 0) {
      // Purring: a tiny happy vibration, and a warm glow that pulses around the body.
      ctx.translate(Math.sin(this.time * 55) * purr * 0.9, Math.cos(this.time * 47) * purr * 0.7);
      traceSmoothLoop(ctx, bodyOutline(this.spine.points, hw));
      ctx.lineJoin = "round";
      ctx.strokeStyle = hsl(this.look.accent, 0.12 + 0.1 * Math.sin(this.time * 4));
      for (const w of [3.2, 2.2]) {
        ctx.lineWidth = hw * w * purr;
        ctx.stroke();
      }
    }
    drawLegs(ctx, this.legs, this.spine.points, this.sizes, this.look);
    drawRidge(ctx, this.spine, this.look, puff, 0.5 + 0.5 * this.growth);
    drawBody(ctx, this.spine, this.look, puff);
    if (this.grime > 0) this.drawGrime(ctx, hw);
    drawTailTuft(ctx, this.spine.points, hw, this.asleep ? this.time * 0.3 : this.time, this.look);
    // Whiskers before the head, so they hang out from under the snout instead of over the eyes.
    drawWhiskers(ctx, this.whiskers, hw);
    drawHead(
      ctx,
      this.spine.head,
      this.headRadius * puff,
      this.face,
      this.headPalette,
      this.growth,
    );
    if (purr > 0.25) this.drawPurr(ctx, purr);
    if (this.asleep) this.drawSnoreBubble(ctx);
    ctx.restore();
    if (this.thinkLeft > 0) this.drawThought(ctx);
    this.drawZees(ctx);
    this.drawBits(ctx);
  }

  /** Grubby: soft grey-brown smudges and specks along the body. */
  private drawGrime(ctx: CanvasRenderingContext2D, hw: number): void {
    const p = this.spine.points;
    ctx.fillStyle = `rgba(90,70,60,${(0.4 * this.grime).toFixed(3)})`;
    for (let i = 3; i < p.length - 2; i += 3) {
      const t = i / (p.length - 1);
      const w = hw * bodyProfile(t);
      const side = ((i * 7) % 5) / 5 - 0.4;
      ctx.beginPath();
      ctx.ellipse(p[i].x + side * w, p[i].y - side * w * 0.6, w * 0.32, w * 0.2, i, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p[i].x - side * w * 0.8, p[i].y + w * 0.3, w * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** A little thought bubble above the head with the icon of what it wants. */
  private drawThought(ctx: CanvasRenderingContext2D): void {
    const need = needOf(this._mood);
    if (!need) return;
    const r = this.headRadius;
    const h = this.spine.head;
    const appear = Math.min(1, (2.4 - this.thinkLeft) * 4, this.thinkLeft * 4);
    const bx = h.x + r * 1.1;
    const by = h.y - r * 2.4 + Math.sin(this.time * 2) * 3;
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    for (const [dx, dy, rr] of [
      [0.35, 1.55, 0.12],
      [0.6, 1.1, 0.2],
    ]) {
      ctx.beginPath();
      ctx.arc(h.x + r * dx, h.y - r * dy, r * rr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(bx, by, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(bx, by);
    ctx.fillStyle = "#4b3a8a";
    ctx.strokeStyle = "#4b3a8a";
    drawNeedIcon(ctx, need, r * 0.42);
    ctx.restore();
  }

  /** A little bubble at the nose that grows and shrinks with each snore. */
  private drawSnoreBubble(ctx: CanvasRenderingContext2D): void {
    const r = this.headRadius;
    const breath = (Math.sin(this.time * 1.8) + 1) / 2;
    if (breath < 0.15) return; // it pops at the end of each breath out
    const nose = headToWorld(this.spine.head, this.face, { x: r * 1.15, y: r * 0.05 });
    const br = r * (0.08 + 0.32 * breath);
    ctx.fillStyle = "rgba(190,240,255,0.35)";
    ctx.strokeStyle = "rgba(220,250,255,0.85)";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.arc(nose.x + this.face.facing * br * 0.8, nose.y - br * 0.2, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(nose.x + this.face.facing * br * 0.5, nose.y - br * 0.55, br * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Little ")))" purr waves rolling out from behind the head. */
  private drawPurr(ctx: CanvasRenderingContext2D, purr: number): void {
    const r = this.headRadius;
    const back = headToWorld(this.spine.head, this.face, { x: -r * 1.2, y: -r * 0.2 });
    const dir = -this.face.facing;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    for (let k = 0; k < 3; k++) {
      const phase = (this.time * 1.6 + k / 3) % 1;
      ctx.strokeStyle = `rgba(255,240,250,${(purr * (1 - phase) * 0.8).toFixed(3)})`;
      ctx.beginPath();
      const rr = r * (0.3 + phase * 0.6);
      const mid = dir > 0 ? 0 : Math.PI;
      ctx.arc(back.x + dir * phase * r * 0.6, back.y, rr, mid - 0.6, mid + 0.6);
      ctx.stroke();
    }
  }

  private updateBits(dt: number): void {
    const u = this.halfWidth;
    for (const b of this.bits) {
      b.age += dt;
      if (b.age < 0) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.kind === "crumb") b.vy += u * 14 * dt;
      else {
        b.vx *= 1 - dt;
        b.vy *= 1 - dt * 0.8;
      }
    }
    this.bits = this.bits.filter((b) => b.age < b.life);
  }

  private drawBits(ctx: CanvasRenderingContext2D): void {
    const u = this.halfWidth;
    for (const b of this.bits) {
      if (b.age < 0) continue;
      ctx.globalAlpha = Math.min(1, Math.max(0, 1.3 * (1 - b.age / b.life)));
      ctx.fillStyle = b.color;
      if (b.kind === "crumb") {
        ctx.beginPath();
        ctx.arc(b.x, b.y, u * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.kind === "sparkle") {
        // A four-pointed twinkle.
        const s = u * 0.35 * (1 - (b.age / b.life) * 0.5);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - s);
        ctx.quadraticCurveTo(b.x, b.y, b.x + s, b.y);
        ctx.quadraticCurveTo(b.x, b.y, b.x, b.y + s);
        ctx.quadraticCurveTo(b.x, b.y, b.x - s, b.y);
        ctx.quadraticCurveTo(b.x, b.y, b.x, b.y - s);
        ctx.fill();
      } else {
        const s = u * (0.55 + b.age * 0.25);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + s * 0.8);
        ctx.bezierCurveTo(
          b.x - s * 1.3,
          b.y - s * 0.1,
          b.x - s * 0.6,
          b.y - s * 1.05,
          b.x,
          b.y - s * 0.35,
        );
        ctx.bezierCurveTo(
          b.x + s * 0.6,
          b.y - s * 1.05,
          b.x + s * 1.3,
          b.y - s * 0.1,
          b.x,
          b.y + s * 0.8,
        );
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private updateZees(dt: number): void {
    for (const z of this.zees) {
      z.age += dt;
      z.y -= this.halfWidth * 1.4 * dt;
      z.x += Math.sin(z.age * 2.5) * this.halfWidth * 0.6 * dt;
    }
    this.zees = this.zees.filter((z) => z.age < 2.6);
    if (!this.asleep) {
      this.zeeClock = 0;
      return;
    }
    this.zeeClock += dt;
    if (this.zeeClock > 1.1) {
      this.zeeClock = 0;
      const h = this.spine.head;
      this.zees.push({ x: h.x + this.headRadius * 0.6, y: h.y - this.headRadius * 1.3, age: 0 });
    }
  }

  private drawZees(ctx: CanvasRenderingContext2D): void {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const z of this.zees) {
      const fade = Math.min(z.age * 3, 1) * (1 - z.age / 2.6);
      ctx.font = `${Math.round(this.halfWidth * (1.3 + z.age * 0.6))}px "Pacifico", cursive`;
      ctx.fillStyle = `rgba(122,243,255,${fade.toFixed(3)})`;
      ctx.fillText("z", z.x, z.y);
    }
  }
}
