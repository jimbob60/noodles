import type { Input } from "../engine/input";
import { Follower } from "../follower";
import { bodyHalfWidth, drawBody } from "./drawBody";
import { drawLegs, drawTailTuft, drawWhiskers } from "./drawExtras";
import { drawHead } from "./drawHead";
import { Face } from "./face";
import { IdleBrain, type World } from "./idleBrain";
import { legSizes, makeLegs, updateLegs, type Leg, type LegSizes } from "./legs";
import { Spine } from "./spine";
import { Swimmer } from "./swimmer";
import { Whiskers } from "./whiskers";

const SPINE_POINTS = 26;
/** Seconds after the finger lets go before the dragon goes back to doing its own thing. */
export const CALM_DOWN = 2.5;

interface Zee {
  x: number;
  y: number;
  age: number;
}

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

  constructor(x: number, y: number, segment: number, world: World, random = Math.random) {
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

  resize(segment: number): void {
    this.spine.resize(segment);
    this.sizes = legSizes(this.halfWidth);
    this.legs = makeLegs(this.spine.points, this.sizes);
    this.whiskers.resize(segment * 0.95);
  }

  update(dt: number, input: Input, world: World): void {
    this.time += dt;
    if (input.down) {
      // The finger is in charge: wake up and follow it.
      this.held = true;
      this.sinceTouch = 0;
      this.head.update(dt, input.x, input.y);
    } else if (this.held) {
      this.sinceTouch += dt;
      this.head.update(dt, input.x, input.y);
      if (this.sinceTouch > CALM_DOWN) {
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
    const target = input.down
      ? { x: input.x, y: input.y }
      : { x: head.x + (head.x - neck.x) * 6, y: head.y + (head.y - neck.y) * 6 };
    this.face.asleep = this.asleep;
    this.face.update(dt, head, neck, target, this.halfWidth * 6);
    updateLegs(this.legs, this.spine.points, this.sizes, dt);
    this.whiskers.update(dt, head, this.headRadius, this.face);
    this.updateZees(dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Slow breathing while asleep.
    const puff = this.asleep ? 1 + Math.sin(this.time * 1.8) * 0.04 : 1;
    const hw = this.halfWidth * puff;
    drawLegs(ctx, this.legs, this.spine.points, this.sizes);
    drawBody(ctx, this.spine, undefined, puff);
    drawTailTuft(ctx, this.spine.points, hw, this.asleep ? this.time * 0.3 : this.time);
    // Whiskers before the head, so they hang out from under the snout instead of over the eyes.
    drawWhiskers(ctx, this.whiskers, hw);
    drawHead(ctx, this.spine.head, this.headRadius * puff, this.face);
    this.drawZees(ctx);
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
