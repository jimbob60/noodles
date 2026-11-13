import type { Point } from "../noodle/spine";

/** What Jinxy is up to. */
export type CatMood = "sit" | "walk" | "groom" | "nap" | "purr" | "rub";

/** Seconds a purr (after you pet her) and a rub (against a dragon) last. */
export const PURR_TIME = 2.6;
export const RUB_TIME = 2.2;
/** Seconds before she'll rub against a dragon again. */
export const RUB_AGAIN = 25;
/** Love a dragon gets from a rub. */
export const RUB_LOVE = 2;

interface Heart {
  x: number;
  y: number;
  age: number;
  vx: number;
}

/**
 * Jinxy: the dragons' pet, drawn from Jacob's real cat: a long-haired black cat with bright
 * yellow-green eyes, a huge plume of a tail, tufted ears and one extra fang on her right side.
 * She lives on the den floor: strolls about, sits and swishes her tail, grooms, naps (all night
 * at bedtime), purrs when you pet her, and rubs up against a dragon that comes close.
 */
export class Cat {
  readonly name = "Jinxy";
  x = 0;
  /** The ground under her feet. */
  y = 0;
  facing: 1 | -1 = 1;
  mood: CatMood = "sit";
  /** Seconds into the current mood, and how long it lasts. */
  clock = 0;
  private length = 3;
  private targetX = 0;
  private rubWait = 6;
  time = 0;
  hearts: Heart[] = [];
  private placed = false;

  constructor(private random: () => number = Math.random) {}

  /** How big she is on this screen (her head is about 0.6 of this). */
  static size(world: { width: number; height: number }): number {
    return Math.max(22, Math.min(44, Math.min(world.width, world.height) * 0.056));
  }

  /** The stretch of floor she walks: between the food tray and the toy tray. */
  private range(world: { width: number; height: number }): [number, number] {
    return [world.width * 0.27, world.width * 0.73];
  }

  private start(mood: CatMood, length: number): void {
    this.mood = mood;
    this.clock = 0;
    this.length = length;
  }

  /** Where her head is (for tapping her, and for hearts). */
  head(world: { width: number; height: number }): Point {
    const s = Cat.size(world);
    const up = this.mood === "nap" ? 0.55 : this.mood === "walk" ? 1.45 : 1.75;
    const along = this.mood === "nap" ? 0.75 : this.mood === "walk" ? 1.0 : 0.35;
    return { x: this.x + this.facing * along * s, y: this.y - up * s };
  }

  /** True if a tap landed on her. */
  hit(p: Point, world: { width: number; height: number }): boolean {
    const s = Cat.size(world);
    return Math.abs(p.x - this.x) < s * 1.7 && p.y > this.y - s * 2.6 && p.y < this.y + s * 0.4;
  }

  /** You petted her: purring and hearts (even a nap turns into a happy purr). */
  pet(world: { width: number; height: number }): void {
    this.start("purr", PURR_TIME);
    this.puff(world, 4);
  }

  private puff(world: { width: number; height: number }, n: number): void {
    const h = this.head(world);
    const s = Cat.size(world);
    for (let i = 0; i < n; i++)
      this.hearts.push({
        x: h.x + (this.random() - 0.5) * s,
        y: h.y - s * 0.6,
        age: -i * 0.15,
        vx: (this.random() - 0.5) * s * 0.6,
      });
  }

  /**
   * @param night bedtime: she naps until morning.
   * @param dragon the head of a dragon that's awake and free, if any (she may rub against it).
   * @returns whether she just rubbed up against the dragon.
   */
  update(
    dt: number,
    world: { width: number; height: number },
    night: boolean,
    dragon: Point | null,
  ): { rubbed: boolean } {
    const s = Cat.size(world);
    const [lo, hi] = this.range(world);
    this.time += dt;
    this.clock += dt;
    this.rubWait = Math.max(0, this.rubWait - dt);
    this.y = world.height * 0.83;
    if (!this.placed) {
      this.placed = true;
      this.x = lo + (hi - lo) * (0.2 + this.random() * 0.6);
    }
    this.x = Math.min(hi, Math.max(lo, this.x));
    for (const h of this.hearts) {
      h.age += dt;
      if (h.age > 0) {
        h.y -= s * 1.1 * dt;
        h.x += h.vx * dt;
      }
    }
    this.hearts = this.hearts.filter((h) => h.age < 1.4);

    let rubbed = false;
    if (night) {
      // Bedtime for everyone.
      if (this.mood !== "nap" && this.mood !== "purr") this.start("nap", Infinity);
    } else if (this.mood === "nap" && this.length === Infinity) {
      this.start("sit", 2 + this.random() * 2);
    }
    // A dragon swims close: a happy head-rub (not while she's busy or it's too soon).
    if (
      !night &&
      dragon &&
      this.rubWait === 0 &&
      (this.mood === "sit" || this.mood === "walk") &&
      Math.hypot(dragon.x - this.x, dragon.y - (this.y - s)) < s * 3.2
    ) {
      this.facing = dragon.x >= this.x ? 1 : -1;
      this.start("rub", RUB_TIME);
      this.rubWait = RUB_AGAIN;
      this.puff(world, 3);
      rubbed = true;
    }

    if (this.mood === "walk") {
      const step = s * 1.5 * dt;
      const left = this.targetX - this.x;
      if (Math.abs(left) <= step) {
        this.x = this.targetX;
        this.start("sit", 3 + this.random() * 4);
      } else {
        this.facing = left > 0 ? 1 : -1;
        this.x += Math.sign(left) * step;
      }
    } else if (this.clock >= this.length) {
      if (this.mood === "sit") {
        const r = this.random();
        if (r < 0.55) {
          // A stroll to somewhere else on the floor (far enough to be worth getting up for).
          let to = this.x;
          for (let k = 0; k < 6 && Math.abs(to - this.x) < s * 3; k++)
            to = lo + this.random() * (hi - lo);
          this.targetX = to;
          this.start("walk", Infinity);
        } else if (r < 0.8) this.start("groom", 3 + this.random() * 2);
        else this.start("nap", 8 + this.random() * 7);
      } else {
        // Done grooming, napping, purring or rubbing: sit a while.
        this.start("sit", 3 + this.random() * 4);
      }
    }
    return { rubbed };
  }
}
