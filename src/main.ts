import "@fontsource/pacifico/latin-400.css";
import { advance, change, freshNeeds, NEED_NAMES } from "./care/needs";
import { deviceStore, loadGame, storeGame } from "./save/storage";
import { decodeBackup, encodeBackup, makeSave, type Save } from "./save/saveGame";
import { drawBackupButton, onBackupButton, openBackupPanel } from "./ui/backupPanel";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { Screen } from "./engine/screen";
import { Gallery } from "./gallery";
import { Dragon } from "./noodle/dragon";
import { makeLook } from "./noodle/look";
import { NeedsBar } from "./ui/needsBar";
import { Feeding } from "./ui/feeding";
import { Toys } from "./ui/toys";
import { Bath } from "./ui/bath";
import { feedEffect } from "./care/food";
import { earn, emptyWallet, type CoinReason, type Wallet } from "./care/coins";
import { CoinCounter } from "./ui/coinCounter";
import { Petting } from "./care/petting";
import { moodFrom } from "./care/mood";
import { bedRefill, rested, sleepy } from "./care/bedtime";
import { bedSpot, drawBed, drawBedButton, drawNight, onBedButton } from "./ui/bedtime";
import { TITLE_FONT } from "./title";
import { Den } from "./den/den";
import { hourOf, skyAt } from "./den/timeOfDay";
import { drawOrder, type DecorItem } from "./den/decor";
import { drawDecor } from "./den/decorArt";
import { Decorator, drawDecorateButton, onDecorateButton } from "./ui/decorate";

/** Spine spacing scales with the screen so the noodle is the same size on any tablet. */
function segmentFor(screen: Screen): number {
  return Math.min(22, Math.max(9, Math.min(screen.width, screen.height) / 48));
}

async function main(): Promise<void> {
  // Wait for the fancy font so the title isn't drawn in a plain one.
  await document.fonts.load(`80px "${TITLE_FONT}"`).catch(() => undefined);

  const screen = new Screen(document.getElementById("game") as HTMLCanvasElement);
  const input = new Input(screen.canvas);
  const den = new Den();
  const world = () => ({ width: screen.width, height: screen.height, unit: segmentFor(screen) });
  // Your dragon: its look comes from the saved seed (a brand-new dragon if there's no save).
  const store = deviceStore();
  const randomSeed = () => Math.floor(Math.random() * 2 ** 32);
  const loaded = loadGame(store, Date.now(), randomSeed);
  let seed = loaded.save?.seed ?? randomSeed();
  const makeDragon = () =>
    new Dragon(screen.width / 2, screen.height * 0.8, segmentFor(screen), world(), makeLook(seed));
  let dragon = makeDragon();
  /** The den's decorations (saved with the dragon). */
  let decor: DecorItem[] = loaded.save?.decor ?? [];
  const decorator = new Decorator();
  /** Noodle coins (saved with the dragon). */
  let wallet: Wallet = loaded.save?.wallet ?? emptyWallet();
  const coinCounter = new CoinCounter();
  /**
   * Test modes, switched by tapping the build tag in the bottom-right corner (links with #fast
   * or #gallery also work in a normal browser, but Claude's app viewer can drop the #):
   * - play: the real game.
   * - fast: needs time runs 600× faster (an hour every 6 s) from full; never saves.
   * - gallery: twenty random dragons.
   */
  type Mode = "play" | "fast" | "gallery";
  const MODES: Mode[] = ["play", "fast", "gallery"];
  const fromHash = location.hash.slice(1);
  let mode: Mode = MODES.includes(fromHash as Mode) ? (fromHash as Mode) : "play";
  const showNumbers = () => mode === "fast" || location.hash === "#debug";
  let gallery: Gallery | null = null;
  let modeStartedAt = Date.now();
  let modeSeconds = 0;
  const needsNow = () => (mode === "fast" ? modeStartedAt + modeSeconds * 600_000 : Date.now());

  // Needs follow the real clock, so they keep changing while the app is closed. Time away
  // counts as sleep if it was tucked in for the night.
  const fromSave = (save: Save) => advance(save.needs, Date.now(), save.needs.inBed === true);
  let needs = loaded.save ? fromSave(loaded.save) : freshNeeds(Date.now());
  let sinceSave = 0;
  const needsBar = new NeedsBar();
  const feeding = new Feeding();
  const petting = new Petting();
  const toys = new Toys();
  const bath = new Bath();
  /** Saves on this device (only the real game: fast mode and the gallery never save). */
  const persist = () => {
    if (mode === "play") storeGame(store, makeSave(seed, needs, Date.now(), decor, wallet));
  };
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persist();
  });

  function enterMode(next: Mode): void {
    persist();
    mode = next;
    modeStartedAt = Date.now();
    modeSeconds = 0;
    if (mode === "fast") {
      const full = { fullness: 100, happiness: 100, energy: 100, cleanliness: 100 };
      needs = change(freshNeeds(modeStartedAt), full);
      dragon.wakeUp(world());
    } else if (mode === "play") {
      // Back from a test mode: pick up the real dragon's needs again.
      const again = loadGame(store, Date.now(), randomSeed).save;
      if (again && again.seed === seed) needs = fromSave(again);
    } else if (!gallery) {
      gallery = new Gallery(screen);
    }
  }
  enterMode(mode);

  /** Bedtime on or off, how dim the lights are (0–1, eased), and where the cushion is. */
  let night = 0;
  let bedAt = bedSpot(screen.width, screen.height);
  function setBedtime(on: boolean): void {
    needs = { ...needs, inBed: on };
    if (on) {
      bedAt = bedSpot(screen.width, screen.height);
      feeding.sendHome();
      toys.sendHome();
      dragon.goToBed(bedSpot(screen.width, screen.height), world());
    } else {
      dragon.wakeUp(world());
    }
  }
  if (needs.inBed) setBedtime(true);

  /** Coins for care: only in the real game (not fast mode), popping out at `from`. */
  function pay(reason: CoinReason, from: { x: number; y: number }): void {
    if (mode !== "play") return;
    const r = earn(wallet, reason, Date.now());
    wallet = r.wallet;
    if (r.earned > 0) coinCounter.earned(r.earned, from);
  }

  /** Restores a dragon from a backup code. Returns false if the code doesn't work. */
  function restore(code: string): boolean {
    const save = decodeBackup(code, Date.now());
    if (!save) return false;
    if (mode !== "play") enterMode("play");
    seed = save.seed;
    dragon = makeDragon();
    needs = fromSave(save);
    decor = save.decor;
    wallet = save.wallet;
    if (needs.inBed) setBedtime(true);
    document.body.dataset.favorite = dragon.favorite;
    document.body.dataset.seed = String(seed);
    persist();
    return true;
  }
  const showBackup = () => {
    persist();
    openBackupPanel(
      encodeBackup(makeSave(seed, needs, Date.now(), decor, wallet)),
      restore,
      store !== null,
    );
  };

  screen.onResize(() => {
    dragon.resize(segmentFor(screen));
  });

  /** The build tag doubles as the mode button: a generous tap area in the top-right corner. */
  const TAG_W = 230;
  const TAG_H = 44;
  const onTag = (x: number, y: number) => x > screen.width - TAG_W && y < TAG_H;
  let seenPresses = 0;
  let ribbonTime = 0;
  let swallowing = false;
  const noFinger = { x: 0, y: 0, down: false };

  const loop = startLoop({
    update(dt) {
      // A press that starts on the tag switches mode and doesn't steer anything.
      // A new press since last frame, even a tap too quick to still be down now.
      const pressed = input.presses !== seenPresses;
      seenPresses = input.presses;
      const pressAt = pressed ? { x: input.pressX, y: input.pressY } : null;
      if (pressAt && onTag(pressAt.x, pressAt.y)) {
        swallowing = true;
        enterMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
      }
      if (!input.down) swallowing = false;
      // The backup button (top right, under the mode tag).
      if (pressAt && !swallowing && mode === "play" && onBackupButton(pressAt, screen.width)) {
        swallowing = true;
        showBackup();
      }
      // The decorate button (top right, under the backup button): decorating mode on or off.
      if (pressAt && !swallowing && mode === "play" && onDecorateButton(pressAt, screen.width)) {
        swallowing = true;
        decorator.active = !decorator.active;
        if (decorator.active) {
          feeding.sendHome();
          toys.sendHome();
        } else {
          persist();
        }
      }
      // While decorating, the finger moves decorations and nothing else.
      const decorating = decorator.active && mode === "play";
      decor = decorator.update(
        dt,
        swallowing ? noFinger : input,
        swallowing ? null : pressAt,
        decor,
        screen.width,
        screen.height,
      );
      // Decorating blocks everything else, for this frame only (so the decorator keeps the finger).
      let blocked = swallowing || decorating;
      // The bedtime button: lights down, or good morning.
      if (
        pressAt &&
        !blocked &&
        mode !== "gallery" &&
        onBedButton(pressAt, screen.width, screen.height)
      ) {
        swallowing = true;
        blocked = true;
        if (needs.inBed) setBedtime(false);
        else if (sleepy(needs.values)) setBedtime(true);
        else dragon.refuse(); // "not sleepy!"
      }
      const inBed = needs.inBed === true;

      if (mode === "gallery" && gallery) {
        gallery.update(dt, blocked ? noFinger : input);
        return;
      }
      // The food tray gets first say over a press; while it holds food, the finger is busy.
      const tray =
        blocked || inBed
          ? { busy: false, event: null }
          : feeding.update(dt, input, pressAt, dragon, needs.values, screen.width, screen.height);
      if (tray.event) {
        const favorite = tray.event.ate === dragon.favorite;
        needs = change(needs, feedEffect(tray.event.ate, favorite));
        pay(favorite ? "favorite" : "snack", dragon.mouth);
        // For automated checks: how many snacks have been eaten this visit.
        document.body.dataset.fed = String(Number(document.body.dataset.fed ?? 0) + 1);
      }
      // Then the toys. Food wins over toys if both want the dragon's attention.
      const foodLure = dragon.lure;
      const play = toys.update(
        dt,
        blocked || tray.busy || inBed ? noFinger : input,
        blocked || tray.busy || inBed ? null : pressAt,
        dragon,
        needs.values,
        screen.width,
        screen.height,
      );
      if (foodLure) dragon.lure = foodLure;
      if (inBed) dragon.lure = null; // nothing tempts it out of bed
      // For automated checks: boops in the current ball game.
      const boops = String(toys.ball?.boops ?? "-");
      if (document.body.dataset.boops !== boops) document.body.dataset.boops = boops;
      if (play.booped && toys.ball) pay("boop", toys.ball);
      // Every 5 seconds of keeping up with the ribbon earns a little.
      if (play.love > 0 && !play.booped) {
        ribbonTime += dt;
        if (ribbonTime >= 5) {
          ribbonTime = 0;
          pay("ribbon", dragon.mouth);
        }
      }
      if (play.love !== 0 || play.energy !== 0 || play.grime !== 0) {
        needs = change(needs, {
          happiness: play.love,
          energy: play.energy,
          cleanliness: play.grime,
        });
      }
      // Bath time: the sponge.
      const taken = blocked || tray.busy || play.busy || inBed;
      const wash = bath.update(
        dt,
        taken ? noFinger : input,
        taken ? null : pressAt,
        dragon,
        needs.values,
        screen.width,
        screen.height,
      );
      if (wash.clean > 0) needs = change(needs, { cleanliness: wash.clean });
      if (wash.squeaky) {
        pay("bath", dragon.centre);
        needs = change(needs, { happiness: 3 });
        dragon.shakeDry();
      }
      // Next, a press that lands on the dragon itself pets it instead of steering it.
      const free = !blocked && !tray.busy && !play.busy && !wash.busy;
      const pet = petting.update(
        dt,
        free ? input : noFinger,
        free ? pressAt : null,
        (x, y) => dragon.spotAt(x, y),
        dragon.tickles,
      );
      if (pet.love > 0) needs = change(needs, { happiness: pet.love });
      for (const sp of pet.sparkles) dragon.sparkle(sp.x, sp.y);
      if (pet.tickled) dragon.giggle();
      dragon.pet = { active: pet.active, purr: petting.purr, giggle: petting.giggle };
      // With the sponge in hand it holds still for its bath, eyes happily shut while scrubbed.
      if (wash.busy) dragon.pet = { active: true, purr: wash.scrubbing ? 0.45 : 0, giggle: 0 };
      // For automated checks: is it being petted, and how deep is the purr.
      const petState = pet.active ? petting.purr.toFixed(1) : "no";
      if (document.body.dataset.pet !== petState) document.body.dataset.pet = petState;
      const finger = !free || pet.active || inBed ? noFinger : input;
      // For automated checks: how many foods are floating about right now.
      if (document.body.dataset.coins !== String(wallet.coins))
        document.body.dataset.coins = String(wallet.coins);
      const floating = String(feeding.floating.length);
      if (document.body.dataset.floating !== floating) document.body.dataset.floating = floating;
      // How it feels comes from its needs; it shows on its face and in how it moves.
      dragon.mood = moodFrom(needs.values);
      dragon.grime = Math.min(1, Math.max(0, (40 - needs.values.cleanliness) / 25));
      const tray0 = feeding.slots()[0];
      dragon.foodTrayAt = tray0 ? { x: tray0.x, y: tray0.y } : null;
      const wasExcited = dragon.exciteLeft > 0;
      dragon.update(dt, finger, world());
      if (!wasExcited && dragon.exciteLeft > 0) pay("petting", dragon.spine.head);
      coinCounter.update(dt, wallet.coins);
      modeSeconds += dt;
      needs = advance(needs, needsNow(), dragon.asleep);
      // Sleeping in bed refills Energy fast enough to watch; rested, it wakes by itself.
      const refill = bedRefill(dt, inBed && dragon.asleep);
      if (refill > 0) needs = change(needs, { energy: refill });
      if (inBed && dragon.asleep && rested(needs.values)) {
        setBedtime(false);
        pay("rested", dragon.spine.head);
      }
      night += ((inBed ? 1 : 0) - night) * (1 - Math.exp(-2 * dt));
      // Once it starts curling up, the cushion slides gently under it.
      if (
        inBed &&
        Math.hypot(dragon.spine.head.x - bedAt.x, dragon.spine.head.y - bedAt.y) <
          dragon.halfWidth * 8
      ) {
        const c = dragon.centre;
        const k = 1 - Math.exp(-1.5 * dt);
        bedAt = {
          x: bedAt.x + (c.x - bedAt.x) * k,
          y: bedAt.y + (c.y + dragon.halfWidth * 0.6 - bedAt.y) * k,
        };
      }
      needsBar.update(dt, needs.values);
      sinceSave += dt;
      if (sinceSave > 5) {
        sinceSave = 0;
        persist();
      }
      // The current mood on the page, so automated checks can find naps and walks.
      const mood = dragon.asleep ? "asleep" : dragon.brain.mode;
      if (document.body.dataset.feeling !== dragon.mood)
        document.body.dataset.feeling = dragon.mood;
      if (document.body.dataset.mood !== mood) document.body.dataset.mood = mood;
    },
    render() {
      const ctx = screen.begin();
      if (mode === "gallery" && gallery) {
        gallery.draw(ctx);
      } else {
        // The den, with the sky outside following the real clock (sped up in fast mode).
        const hour = hourOf(needsNow());
        den.draw(ctx, screen.width, screen.height, screen.dpr, hour, dragon.centre, modeSeconds);
        const dark = skyAt(hour).dark;
        for (const i of drawOrder(decor))
          drawDecor(ctx, decor[i], screen.width, screen.height, dark, modeSeconds);
        drawNight(ctx, screen.width, screen.height, night, bedAt);
        drawBed(ctx, bedAt, dragon.halfWidth * 4.2, night);
        dragon.draw(ctx);
        needsBar.draw(ctx, screen.width, screen.height);
        if (mode === "play") coinCounter.draw(ctx);
        if (decorator.active) {
          decorator.draw(ctx, decor, screen.width, screen.height, dark);
        } else {
          if (!needs.inBed) {
            feeding.draw(ctx);
            toys.draw(ctx);
            bath.draw(ctx, screen.width, screen.height);
          }
          drawBedButton(ctx, screen.width, screen.height, needs.inBed === true, modeSeconds);
        }
        if (mode === "play") {
          drawBackupButton(ctx, screen.width);
          drawDecorateButton(ctx, screen.width, decorator.active, dark, modeSeconds);
        }
      }

      if (showNumbers() && mode !== "gallery") {
        // Exact numbers for checking (fast mode and #debug).
        ctx.font = "13px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        NEED_NAMES.forEach((n, i) => {
          ctx.fillText(`${n} ${needs.values[n].toFixed(2)}`, 10, 100 + i * 18);
        });
      }

      // Build tag, frame rate and test mode in the corner. Tap it to switch mode.
      const modeName = mode === "play" ? "play" : mode === "fast" ? "⏩ fast" : "🖼 gallery";
      const fps = `${Math.round(loop.fps())} fps`;
      // Narrow phones get a short tag (just the commit), so it doesn't run into the need orbs.
      const label =
        screen.width < 600
          ? `${modeName} · ${__BUILD__.split(" ")[0]} · ${fps}`
          : `${modeName} · build ${__BUILD__} · ${fps}`;
      ctx.font = "13px system-ui, sans-serif";
      const w = ctx.measureText(label).width + 20;
      ctx.fillStyle = mode === "play" ? "rgba(255,255,255,0.08)" : "rgba(183,160,255,0.3)";
      ctx.beginPath();
      ctx.roundRect(screen.width - w - 6, 8, w, 26, 13);
      ctx.fill();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = mode === "play" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)";
      ctx.fillText(label, screen.width - 16, 21);
    },
  });
  // A daily hello: a few coins the first time you visit each day.
  pay("hello", dragon.spine.head);
  document.body.dataset.favorite = dragon.favorite;
  document.body.dataset.seed = String(seed);
  document.body.dataset.ready = "true";
}

void main();
