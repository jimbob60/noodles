import type { FoodId } from "../care/food";
import { favoriteFood } from "../care/food";
import { tickleSpots } from "../care/petting";
import type { PointerState } from "../engine/input";
import { FOOD_COLOR } from "../ui/foodArt";
import { Follower } from "../follower";
import { bodyOutline, bodyProfile, traceSmoothLoop } from "./body";
import { bodyHalfWidth, drawBody } from "./drawBody";
import { drawLegs, drawTailTuft, drawWhiskers } from "./drawExtras";
import { drawHead, headColors, type HeadColors } from "./drawHead";
import { CHEW_TIME, Face, SHAKE_TIME } from "./face";
import { IdleBrain, type World } from "./idleBrain";
import { legSizes, makeLegs, updateLegs, type Leg, type LegSizes } from "./legs";
import { CLASSIC_LOOK, hsl, type DragonLook } from "./look";
import { Spine, type Point } from "./spine";
import { Swimmer } from "./swimmer";
import { headToWorld, Whiskers } from "./whiskers";

const SPINE_POINTS = 26;
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
  private bits: Bit[] = [];

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

  get headRadius(): number {
    return this.halfWidth * 1.3;
  }

  get asleep(): boolean {
    return this.brain.asleep && !this.held;
  }

  /** Where the mouth is right now (just under the snout). */
  get mouth(): Point {
    const r = this.headRadius;
    return headToWorld(this.spine.head, this.face, { x: r * 0.72, y: r * 0.56 });
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

  /** A polite head shake: "no thanks, I'm full". */
  refuse(): void {
    if (this.face.chewLeft <= 0) this.face.shakeLeft = SHAKE_TIME;
  }

  resize(segment: number): void {
    this.spine.resize(segment);
    this.sizes = legSizes(this.halfWidth);
    this.legs = makeLegs(this.spine.points, this.sizes);
    this.whiskers.resize(segment * 0.95);
  }

  update(dt: number, input: PointerState, world: World): void {
    this.time += dt;
    const wasPetted = this.petAnchor !== null;
    if (this.pet.active) {
      // Being petted: hold still and lean into it. A giggle makes it squirm.
      if (!this.petAnchor) this.petAnchor = { x: this.head.x, y: this.head.y };
      const squirm = this.pet.giggle > 0 ? Math.sin(this.time * 28) * this.halfWidth * 0.35 : 0;
      this.head.update(dt, this.petAnchor.x + squirm, this.petAnchor.y, 12);
    } else if (wasPetted) {
      // Petting over: carry on from here (a sleeping dragon just keeps sleeping).
      this.petAnchor = null;
      if (!this.brain.asleep) {
        const [h, n] = this.spine.points;
        this.swimmer.reset(h.x, h.y, Math.atan2(h.y - n.y, h.x - n.x), 0);
        this.brain.start("float", this.swimmer, world);
      } else {
        this.swimmer.reset(this.head.x, this.head.y, this.swimmer.heading, 0);
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

    this.spine.follow(this.head.x, this.head.y);
    const [head, neck] = this.spine.points;
    // Eyes follow the finger; otherwise they look where the dragon is heading.
    const target = this.lure
      ? this.lure
      : input.down
        ? { x: input.x, y: input.y }
        : { x: head.x + (head.x - neck.x) * 6, y: head.y + (head.y - neck.y) * 6 };
    this.face.asleep = this.asleep;
    this.face.happy = this.pet.active && (this.pet.purr > 0.3 || this.pet.giggle > 0);
    this.face.update(dt, head, neck, target, this.halfWidth * 6);
    updateLegs(this.legs, this.spine.points, this.sizes, dt);
    this.whiskers.update(dt, head, this.headRadius, this.face);
    this.updateZees(dt);
    this.updateBits(dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Slow breathing while asleep.
    const puff = this.asleep ? 1 + Math.sin(this.time * 1.8) * 0.04 : 1;
    const hw = this.halfWidth * puff;
    const purr = this.pet.purr;
    ctx.save();
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
    drawBody(ctx, this.spine, this.look, puff);
    drawTailTuft(ctx, this.spine.points, hw, this.asleep ? this.time * 0.3 : this.time, this.look);
    // Whiskers before the head, so they hang out from under the snout instead of over the eyes.
    drawWhiskers(ctx, this.whiskers, hw);
    drawHead(ctx, this.spine.head, this.headRadius * puff, this.face, this.headPalette);
    if (purr > 0.25) this.drawPurr(ctx, purr);
    ctx.restore();
    this.drawZees(ctx);
    this.drawBits(ctx);
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
