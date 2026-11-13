import "@fontsource/pacifico/latin-400.css";
import { advance, change, freshNeeds, NEED_NAMES } from "./care/needs";
import { deviceStore, loadGame, storeGame } from "./save/storage";
import { freshGrowth, grow, growAway, growthShare, stageOf, type Growth } from "./care/growth";
import { drawGrowthBadge, drawStageBanner, onGrowthBadge, stageMessage } from "./ui/growthBadge";
import { newIdentity, type Identity } from "./care/identity";
import { openNamePanel, openProfile } from "./ui/profilePanel";
import { emptyWardrobe, type Wardrobe } from "./care/wardrobe";
import { drawClosetButton, onClosetButton, openCloset } from "./ui/closetPanel";
import {
  closePhotoBar,
  drawCameraButton,
  drawPhotoFrame,
  flash,
  newPhoto,
  onCameraButton,
  openPhotoBar,
  photoFileName,
  showPhoto,
  type PhotoState,
} from "./ui/photoMode";
import { pose } from "./noodle/pose";
import { adopt, catchUp, newEgg, type FamilyMember } from "./care/family";
import { drawFamilyButton, onFamilyButton, openFamily, type FamilyCard } from "./ui/familyPanel";
import { parseFavorites } from "./gallery";
import { Friendship } from "./noodle/friends";
import { Cat, RUB_LOVE } from "./pets/cat";
import { drawCat } from "./pets/drawCat";
import { JINX_SEED } from "./noodle/genes";
import { MAX_FAMILY } from "./care/family";
import { decodeBackup, encodeBackup, makeSave, type Save } from "./save/saveGame";
import { drawBackupButton, onBackupButton, openBackupPanel } from "./ui/backupPanel";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { Screen } from "./engine/screen";
import { Gallery } from "./gallery";
import { Dragon } from "./noodle/dragon";
import { genesFromSeed, type Genes } from "./noodle/genes";
import { NeedsBar } from "./ui/needsBar";
import { Feeding } from "./ui/feeding";
import { Toys } from "./ui/toys";
import { Bath } from "./ui/bath";
import { feedEffect } from "./care/food";
import { earn, emptyWallet, type CoinReason, type Wallet } from "./care/coins";
import { CoinCounter } from "./ui/coinCounter";
import { buy, CATALOG, emptyStash, store as moveStorage, useTreat, type Stash } from "./care/shop";
import { drawShopButton, onShopButton, openShop } from "./ui/shopPanel";
import { Egg } from "./egg/egg";
import { drawEgg, drawEggHint } from "./egg/drawEgg";
import { ownedBalls } from "./ui/balls";
import {
  coinsFor,
  FOOD_PER_CATCH,
  NoodleCatch,
  ROUND_ENERGY,
  ROUND_LOVE,
} from "./game/noodleCatch";
import { drawCatchHud, drawFallers, drawGameButton, gameButton } from "./game/drawCatch";
import { wantsToPlay } from "./ui/toys";
import { TREAT_IDS } from "./care/food";
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
  /** Your dragon's genes: everything that makes it itself (saved with it). */
  let genes: Genes = loaded.save?.genes ?? genesFromSeed(seed);
  /** Its name and birthday (a new player names theirs when it hatches). */
  let identity: Identity = loaded.save?.identity ?? newIdentity(Date.now());
  const showName = () => {
    if (document.body.dataset.name !== identity.name) document.body.dataset.name = identity.name;
  };
  showName();
  const rename = (name: string) => {
    identity = { ...identity, name };
    showName();
    persist();
  };
  /**
   * How grown up your dragon is (hours of good care). Time away counts too, capped, if it was
   * left well cared for. Fast mode grows its own dragon from a baby, 600× faster.
   */
  let growth: Growth = loaded.save
    ? growAway(loaded.save.growth, Date.now() - loaded.save.savedAt, loaded.save.needs.values)
    : freshGrowth();
  let fastGrowth: Growth = freshGrowth();
  const shownGrowth = () => (mode === "fast" ? fastGrowth : growth);
  /** The "a kid now!" banner: its text and how long it has been up. */
  let stageNote: { text: string; age: number } | null = null;
  const STAGE_NOTE_LIFE = 4;
  const makeDragon = () => {
    const d = new Dragon(screen.width / 2, screen.height * 0.8, segmentFor(screen), world(), genes);
    d.setGrowth(growthShare(growth));
    return d;
  };
  /** Accessories bought, and what it's wearing (saved with it). */
  let wardrobe: Wardrobe = loaded.save?.wardrobe ?? emptyWardrobe();
  let dragon = makeDragon();
  const dress = () => {
    dragon.outfit = wardrobe.worn;
    const worn = Object.values(wardrobe.worn)
      .map((w) => w.id)
      .join(",");
    if (document.body.dataset.outfit !== worn) document.body.dataset.outfit = worn;
  };
  dress();
  /** The den's decorations (saved with the dragon). */
  let decor: DecorItem[] = loaded.save?.decor ?? [];
  const decorator = new Decorator();
  /** Noodle coins (saved with the dragon). */
  let wallet: Wallet = loaded.save?.wallet ?? emptyWallet();
  const coinCounter = new CoinCounter();
  /** Treats in the pantry and decorations in storage (saved with the dragon). */
  let stash: Stash = loaded.save?.stash ?? emptyStash();
  /**
   * Test modes, switched by tapping the build tag in the bottom-right corner (links with #fast
   * or #gallery also work in a normal browser, but Claude's app viewer can drop the #):
   * - play: the real game.
   * - fast: needs time runs 600× faster (an hour every 6 s) from full; never saves.
   * - gallery: fifty random dragons, ten to a page; tap one to favorite it.
   */
  type Mode = "play" | "fast" | "gallery" | "hatch";
  const MODES: Mode[] = ["play", "fast", "gallery", "hatch"];
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
  /**
   * An egg waiting to hatch: a brand-new player starts with one (nothing is saved until it
   * hatches), and the "hatch" test mode replays your own dragon's hatching.
   */
  let newPlayerEgg = !loaded.save;
  let egg: Egg | null = null;
  /** The rest of the family: the dragons that aren't out in the den right now. */
  let family: FamilyMember[] = loaded.save?.family ?? [];
  /** The dragon in the den is a newly adopted egg that hasn't hatched yet. */
  let adoptedEgg = loaded.save?.egg ?? false;
  const showFamily = () => {
    document.body.dataset.family = String(family.length + 1);
  };
  showFamily();
  /**
   * A friend: one of the family out in the den too, doing its own thing and playing with the
   * dragon you're caring for (nuzzles, chases, the odd tangle).
   */
  /** Jinxy, the dragons' pet cat. */
  const cat = new Cat();
  let friend: Dragon | null = null;
  let friendship = new Friendship();
  /** The lure the friendship gave your dragon last frame (so it can be told from food). */
  let socialLure: { x: number; y: number } | null = null;
  const friendIndex = () => family.findIndex((m) => m.visiting && !m.egg);
  /** Where a friend sleeps: beside the cushion, toward the middle of the den. */
  const besideBed = () => {
    const bed = bedSpot(screen.width, screen.height);
    const toward = bed.x < screen.width / 2 ? 1 : -1;
    return { x: bed.x + toward * dragon.halfWidth * 9, y: bed.y };
  };
  /** Makes (or clears) the friend's dragon to match who is visiting. */
  function syncFriend(): void {
    const i = friendIndex();
    friendship = new Friendship();
    socialLure = null;
    if (i < 0) {
      friend = null;
      document.body.dataset.friend = "";
      return;
    }
    family[i] = catchUp(family[i], Date.now());
    const m = family[i];
    const side = dragon.spine.head.x < screen.width / 2 ? 0.72 : 0.28;
    friend = new Dragon(
      screen.width * side,
      screen.height * 0.45,
      segmentFor(screen),
      world(),
      m.genes,
    );
    friend.setGrowth(growthShare(m.growth));
    friend.outfit = m.worn;
    if (needs.inBed) friend.goToBed(besideBed(), world());
    document.body.dataset.friend = m.identity.name;
  }
  const eggAt = () => ({ x: screen.width / 2, y: screen.height * 0.62 });
  const eggSize = () => Math.max(46, Math.min(80, Math.min(screen.width, screen.height) * 0.09));
  let eggLast: { x: number; y: number } | null = null;
  const saveNow = () =>
    makeSave(
      seed,
      needs,
      Date.now(),
      decor,
      wallet,
      stash,
      growth,
      genes,
      identity,
      wardrobe,
      family,
      adoptedEgg,
    );
  const persist = () => {
    // Nothing is saved until a new player's egg has hatched.
    // (An adopted egg is saved, so it's still waiting if the game is closed.)
    if (mode === "play" && !newPlayerEgg && (!egg || adoptedEgg)) storeGame(store, saveNow());
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
      fastGrowth = freshGrowth();
    }
    if (mode === "play" || mode === "fast") dragon.setGrowth(growthShare(shownGrowth()));
    egg = mode === "hatch" || (mode === "play" && (newPlayerEgg || adoptedEgg)) ? new Egg() : null;
    if (mode === "play") {
      // Back from a test mode: pick up the real dragon's needs again.
      const again = loadGame(store, Date.now(), randomSeed).save;
      if (again && again.seed === seed) needs = fromSave(again);
    } else if (mode === "gallery" && !gallery) {
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
      // A visiting friend curls up beside the cushion too.
      friend?.goToBed(besideBed(), world());
    } else {
      dragon.wakeUp(world());
      friend?.wakeUp(world());
    }
  }
  syncFriend();
  if (needs.inBed) setBedtime(true);

  /** Coins for care: only in the real game (not fast mode), popping out at `from`. */
  function pay(reason: CoinReason, from: { x: number; y: number }, amount?: number): void {
    if (mode !== "play") return;
    const r = earn(wallet, reason, Date.now(), amount);
    wallet = r.wallet;
    if (r.earned > 0) coinCounter.earned(r.earned, from);
  }

  /** Restores a dragon from a backup code. Returns false if the code doesn't work. */
  function restore(code: string): boolean {
    const save = decodeBackup(code, Date.now());
    if (!save) return false;
    if (mode !== "play") enterMode("play");
    seed = save.seed;
    genes = save.genes;
    identity = save.identity;
    showName();
    wardrobe = save.wardrobe;
    dragon = makeDragon();
    dress();
    needs = fromSave(save);
    decor = save.decor;
    wallet = save.wallet;
    stash = save.stash;
    growth = save.growth;
    dragon.setGrowth(growthShare(growth));
    family = save.family;
    adoptedEgg = save.egg;
    egg = adoptedEgg ? new Egg() : null;
    showFamily();
    syncFriend();
    if (needs.inBed) setBedtime(true);
    document.body.dataset.favorite = dragon.favorite;
    document.body.dataset.seed = String(seed);
    persist();
    return true;
  }
  /** The dragon out in the den, as a family member (for when it steps aside). */
  const asMember = (): FamilyMember => ({
    seed,
    genes,
    identity,
    needs,
    growth,
    worn: wardrobe.worn,
    seenAt: Date.now(),
    egg: adoptedEgg,
    visiting: false,
  });
  /** Brings a family member out into the den, caught up on the time it was away. */
  function bring(member: FamilyMember): void {
    const m = catchUp(member, Date.now());
    seed = m.seed;
    genes = m.genes;
    identity = m.identity;
    needs = m.needs;
    growth = m.growth;
    wardrobe = { owned: wardrobe.owned, worn: m.worn };
    adoptedEgg = m.egg;
    egg = adoptedEgg ? new Egg() : null;
    stageNote = null;
    feeding.sendHome();
    toys.sendHome();
    dragon = makeDragon();
    dress();
    showName();
    showFamily();
    document.body.dataset.favorite = dragon.favorite;
    document.body.dataset.seed = String(seed);
    syncFriend();
    if (needs.inBed) setBedtime(true);
    else dragon.getExcited(); // happy to see you!
    persist();
  }
  /** Invites a family member over to play as a friend (one at a time), or sends it home. */
  function invite(index: number, over: boolean): void {
    family = family.map((m, k) => ({ ...m, visiting: over && k === index && !m.egg }));
    syncFriend();
    if (friend && over) friend.hearts(3);
    persist();
  }
  /** Swaps the dragon in the den with another of the family. */
  function visit(index: number): void {
    const arriving = family[index];
    if (!arriving) return;
    // The one stepping aside stays in the den as a friend, unless another friend is over.
    const otherFriend = family.some((m, k) => k !== index && m.visiting);
    const leaving = { ...asMember(), visiting: !otherFriend && !adoptedEgg };
    family = family.map((m, k) => (k === index ? leaving : m));
    bring({ ...arriving, visiting: false });
  }
  const hasJinx = () => seed === JINX_SEED || family.some((m) => m.seed === JINX_SEED);
  /** Adopts an egg (a favorite's number, or a surprise). The one in the den steps aside. */
  function adoptEgg(pick: number | null): boolean {
    if (pick === JINX_SEED) {
      // Jinx's egg is a gift (one only), as long as there's room.
      if (family.length + 1 >= MAX_FAMILY || hasJinx()) return false;
    } else {
      const r = adopt(wallet, family.length + 1);
      if (!r.ok) return false;
      wallet = r.wallet;
    }
    // The one stepping aside will be there to meet the baby (unless a friend is already over).
    const stays = !family.some((m) => m.visiting) && !adoptedEgg;
    family = [...family, { ...asMember(), visiting: stays }];
    bring(newEgg(pick ?? randomSeed(), Date.now()));
    return true;
  }
  const showFamilyPanel = () => {
    const now = Date.now();
    const cardOf = (m: FamilyMember, here: boolean): FamilyCard => ({
      name: m.identity.name,
      genes: m.genes,
      growth: m.growth,
      growthShare: growthShare(m.growth),
      needs: m.needs.values,
      asleep: m.needs.inBed === true,
      hat: m.worn.head,
      egg: m.egg,
      here,
      visiting: m.visiting,
    });
    let favorites: number[] = [];
    try {
      favorites = parseFavorites(localStorage.getItem("noodle-dragons.favorites"));
    } catch {
      // No storage here: no favorites to offer.
    }
    const taken = new Set([seed, ...family.map((m) => m.seed)]);
    openFamily({
      // What the others look like right now (they only really catch up when they come out).
      cards: [cardOf(asMember(), true), ...family.map((m) => cardOf(catchUp(m, now), false))],
      coins: wallet.coins,
      jinxEgg: !hasJinx(),
      favorites: favorites.filter((f) => !taken.has(f)),
      onVisit: (i) => visit(i - 1),
      onInvite: (i, over) => invite(i - 1, over),
      onAdopt: adoptEgg,
    });
  };
  const showBackup = () => {
    persist();
    openBackupPanel(encodeBackup(saveNow()), restore, store !== null);
  };

  screen.onResize(() => {
    dragon.resize(segmentFor(screen));
    friend?.resize(segmentFor(screen));
  });

  /** The build tag doubles as the mode button: a generous tap area in the top-right corner. */
  const TAG_W = 230;
  const TAG_H = 44;
  const onTag = (x: number, y: number) => x > screen.width - TAG_W && y < TAG_H;
  let seenPresses = 0;
  let ribbonTime = 0;
  /** A round of Noodle Catch, while one is on; and its coins once it's over. */
  let catchGame: NoodleCatch | null = null;
  let catchCoins = 0;
  let catchDoneFor = 0;
  let bestBefore = 0;
  let swallowing = false;
  const noFinger = { x: 0, y: 0, down: false };
  /** Photo mode: the buttons step aside so you can pose your dragon and snap it. */
  let photo: PhotoState | null = null;
  const snapPhoto = () => {
    flash();
    const when = new Date();
    screen.canvas.toBlob((blob) => {
      if (!blob) return;
      document.body.dataset.photos = String(Number(document.body.dataset.photos ?? 0) + 1);
      showPhoto(blob, photoFileName(identity.name, when));
    }, "image/png");
  };
  const leavePhoto = () => {
    photo = null;
    closePhotoBar();
    document.getElementById("photo-preview")?.remove();
    document.body.dataset.photo = "off";
  };

  const loop = startLoop({
    update(dt) {
      // A press that starts on the tag switches mode and doesn't steer anything.
      // A new press since last frame, even a tap too quick to still be down now.
      const pressed = input.presses !== seenPresses;
      seenPresses = input.presses;
      // In photo mode the buttons are put away, so a press only ever moves the dragon.
      const pressAt = pressed && !photo ? { x: input.pressX, y: input.pressY } : null;
      if (pressAt && onTag(pressAt.x, pressAt.y)) {
        swallowing = true;
        enterMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
      }
      if (!input.down) swallowing = false;
      // Really playing: the real game, with a hatched dragon out in the den.
      const playing = mode === "play" && !egg;
      // Jinxy the cat: a tap on her is a pet (purr!), and nothing else.
      if (
        pressAt &&
        !swallowing &&
        playing &&
        !catchGame &&
        !decorator.active &&
        cat.hit(pressAt, screen)
      ) {
        swallowing = true;
        cat.pet(screen);
        document.body.dataset.catPets = String(Number(document.body.dataset.catPets ?? 0) + 1);
      }
      // The backup button (top right, under the mode tag).
      if (
        pressAt &&
        !swallowing &&
        playing &&
        onBackupButton(pressAt, screen.width, screen.height)
      ) {
        swallowing = true;
        showBackup();
      }
      // The decorate button (top right, under the backup button): decorating mode on or off.
      if (
        pressAt &&
        !swallowing &&
        playing &&
        onDecorateButton(pressAt, screen.width, screen.height)
      ) {
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
      let blocked = swallowing || decorating || photo !== null;
      // The shop button: spend noodle coins.
      if (pressAt && !swallowing && playing && onShopButton(pressAt, screen.width, screen.height)) {
        swallowing = true;
        openShop(wallet, stash, (item) => {
          const r = buy(item, wallet, stash);
          if (!r.ok) return null;
          wallet = r.wallet;
          stash = r.stash;
          persist();
          return { wallet, stash };
        });
      }
      // The closet (🎀): buy accessories, dress up, change colors.
      if (
        pressAt &&
        !swallowing &&
        playing &&
        !catchGame &&
        !decorator.active &&
        onClosetButton(pressAt, screen.width, screen.height)
      ) {
        swallowing = true;
        openCloset({
          wardrobe,
          wallet,
          genes,
          growthShare: dragon.growth,
          onChange: (w, money) => {
            wardrobe = w;
            wallet = money;
            dress();
            persist();
          },
        });
      }
      // The camera (📷): photo mode.
      if (
        pressAt &&
        !swallowing &&
        playing &&
        !catchGame &&
        !decorator.active &&
        onCameraButton(pressAt, screen.width, screen.height)
      ) {
        swallowing = true;
        feeding.sendHome();
        toys.sendHome();
        photo = newPhoto();
        document.body.dataset.photo = "on";
        openPhotoBar(photo, snapPhoto, leavePhoto, () => {});
      }
      // The family (💕): see everyone, swap who's out in the den, adopt an egg.
      if (
        pressAt &&
        !swallowing &&
        mode === "play" &&
        !newPlayerEgg &&
        !catchGame &&
        !decorator.active &&
        onFamilyButton(pressAt, screen.width, screen.height)
      ) {
        swallowing = true;
        showFamilyPanel();
      }
      // The name badge under the coins opens the dragon's profile card.
      if (pressAt && !swallowing && playing && !catchGame && onGrowthBadge(pressAt)) {
        swallowing = true;
        openProfile({
          identity,
          genes,
          growth,
          growthShare: dragon.growth,
          hat: wardrobe.worn.head,
          now: Date.now(),
          onRename: rename,
        });
      }
      // Noodle Catch: the 🎮 button starts a round; while it's on, everything else steps aside
      // and the finger steers the dragon.
      const gb = gameButton(screen.width, screen.height);
      if (catchGame) {
        blocked = true;
        if (catchGame.phase === "done" && pressAt && catchDoneFor > 0.6) {
          catchGame = null;
          swallowing = true;
          persist();
        }
      } else if (
        pressAt &&
        !blocked &&
        playing &&
        !needs.inBed &&
        Math.hypot(pressAt.x - gb.x, pressAt.y - gb.y) <= gb.r * 1.3
      ) {
        swallowing = true;
        blocked = true;
        if (!wantsToPlay(needs.values)) {
          dragon.refuse(); // too sleepy for games
        } else {
          feeding.sendHome();
          toys.sendHome();
          catchGame = new NoodleCatch(screen.width, screen.height);
          catchDoneFor = 0;
        }
      }
      // The toy tray knows which balls are owned.
      toys.owned = ownedBalls(stash.balls);
      // The tray shows the pantry's treats, and the drawer only what's owned.
      feeding.pantry = stash.pantry;
      decorator.storage = stash.storage;
      decorator.onStore = (kind, change) => {
        stash = moveStorage(stash, kind, change);
        decorator.storage = stash.storage;
      };

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
        // A press counts even if the tap was too quick to still be down this frame.
        gallery.update(dt, swallowing ? null : pressAt);
        return;
      }
      if (egg) {
        // Hatching time: rub the egg to warm it, then tap to crack it. Nothing else to do yet.
        const at = eggAt();
        const sz = eggSize();
        const onEgg = (q: { x: number; y: number }) =>
          Math.abs(q.x - at.x) < sz * 1.1 && Math.abs(q.y - at.y) < sz * 1.3;
        let rubbed = 0;
        if (input.down && !swallowing && onEgg(input)) {
          if (eggLast) rubbed = Math.hypot(input.x - eggLast.x, input.y - eggLast.y);
          eggLast = { x: input.x, y: input.y };
        } else {
          eggLast = null;
        }
        const tapped = !!pressAt && !swallowing && onEgg(pressAt);
        const r = egg.update(dt, rubbed, tapped);
        if (r.hatched) {
          // Out pops the dragon, right where the egg was, thrilled to meet you.
          dragon = new Dragon(at.x, at.y, segmentFor(screen), world(), genes);
          dress();
          // A new player's dragon hatches as a baby (the hatch test mode replays yours as one).
          if (mode === "play") growth = freshGrowth();
          dragon.setGrowth(0);
          dragon.getExcited();
          egg = null;
          if (mode === "play") {
            newPlayerEgg = false;
            adoptedEgg = false;
            needs = freshNeeds(Date.now());
            // Hatch day! Then a name: a cute one is suggested, and any name will do.
            identity = newIdentity(Date.now());
            if (seed === JINX_SEED) identity = { ...identity, name: "Jinx" };
            showName();
            persist();
            openNamePanel({
              title: "Name your baby dragon!",
              initial: identity.name,
              canCancel: false,
              onDone: rename,
            });
          }
        }
        document.body.dataset.egg = egg
          ? `${egg.phase}:${egg.warmth.toFixed(2)}:${egg.cracks}`
          : "hatched";
        modeSeconds += dt;
        coinCounter.update(dt, wallet.coins);
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
        if (TREAT_IDS.includes(tray.event.ate)) stash = useTreat(stash, tray.event.ate);
        // For automated checks: how many snacks have been eaten this visit.
        document.body.dataset.fed = String(Number(document.body.dataset.fed ?? 0) + 1);
      }
      // Then the toys. Food wins over toys if both want the dragon's attention.
      const foodLure = dragon.lure === socialLure ? null : dragon.lure;
      if (dragon.lure === socialLure) dragon.lure = null;
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
      const finger = photo
        ? photo.frozen || swallowing
          ? noFinger
          : input
        : catchGame
          ? swallowing
            ? noFinger
            : input
          : !free || pet.active || inBed
            ? noFinger
            : input;
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
      // A friend in the den: it lives its own little life, and the two get together to play
      // whenever both are free (your finger, food and bedtime always come first).
      const fi = mode === "play" ? friendIndex() : -1;
      if (friend && fi >= 0 && !photo?.frozen) {
        const now = Date.now();
        const m = family[fi];
        let theirs = advance(m.needs, now, friend.asleep);
        const grown = grow(m.growth, dt / 3600, theirs.values);
        if (Math.abs(growthShare(grown) - friend.growth) > 0.002)
          friend.setGrowth(growthShare(grown));
        friend.mood = moodFrom(theirs.values);
        friend.grime = Math.min(1, Math.max(0, (40 - theirs.values.cleanliness) / 25));
        friend.lure = null;
        const mine =
          free &&
          !catchGame &&
          !inBed &&
          !finger.down &&
          dragon.lure === null &&
          dragon.canPlay &&
          !decorating;
        const happened = friendship.update(dt, dragon, friend, [mine, friend.canPlay], world());
        socialLure = mine ? dragon.lure : null;
        if (happened) {
          // A lovely time together: Love for both, and a couple of coins.
          needs = change(needs, { happiness: happened.love });
          theirs = change(theirs, { happiness: happened.love });
          pay("friends", dragon.spine.head);
          document.body.dataset.playdates = String(
            Number(document.body.dataset.playdates ?? 0) + 1,
          );
        }
        family[fi] = { ...m, needs: theirs, growth: grown, seenAt: now };
        friend.update(dt, noFinger, world());
        if (document.body.dataset.together !== friendship.mode)
          document.body.dataset.together = friendship.mode;
      }
      if (photo && friend) pose(friend.face, photo.expression);
      // Jinxy lives her own life on the den floor, and loves a dragon that swims close.
      if (mode === "play" && !catchGame && !photo?.frozen) {
        const close = dragon.canPlay && !inBed && !finger.down ? dragon.spine.head : null;
        if (cat.update(dt, screen, inBed, close).rubbed) {
          needs = change(needs, { happiness: RUB_LOVE });
          dragon.hearts(2);
        }
        if (document.body.dataset.cat !== cat.mood) document.body.dataset.cat = cat.mood;
      }
      // Holding still for a photo: the pose stays exactly put.
      if (!photo?.frozen) dragon.update(dt, finger, world());
      if (photo) pose(dragon.face, photo.expression);
      if (!wasExcited && dragon.exciteLeft > 0) pay("petting", dragon.spine.head);
      if (catchGame) {
        const wasDone = catchGame.phase === "done";
        for (const kind of catchGame.update(dt, dragon.mouth, dragon.headRadius)) {
          dragon.eat("dumpling");
          needs = change(needs, { fullness: FOOD_PER_CATCH * (kind === "golden" ? 2 : 1) });
        }
        // For automated checks: the lowest dumpling still falling.
        const next = catchGame.fallers.filter((f) => f.landed === 0).sort((a, b) => b.y - a.y)[0];
        document.body.dataset.target = next ? `${Math.round(next.x)},${Math.round(next.y)}` : "";
        if (catchGame.phase === "done") {
          catchDoneFor += dt;
          if (!wasDone) {
            // Round over: coins by score, a bit of Love, a bit tired, and maybe a new best.
            catchCoins = coinsFor(catchGame.score);
            pay("catch", { x: screen.width / 2, y: screen.height / 2 }, catchCoins);
            needs = change(needs, { happiness: ROUND_LOVE, energy: ROUND_ENERGY });
            bestBefore = stash.bestCatch;
            stash = { ...stash, bestCatch: Math.max(stash.bestCatch, catchGame.score) };
            document.body.dataset.catchScore = String(catchGame.score);
          }
        }
      }
      coinCounter.update(dt, wallet.coins);
      modeSeconds += dt;
      needs = advance(needs, needsNow(), dragon.asleep);
      // Growing up: a little longer with every hour of good care.
      if (mode === "play" || mode === "fast") {
        const before = shownGrowth();
        const hours = (dt / 3600) * (mode === "fast" ? 600 : 1);
        const after = grow(before, hours, needs.values);
        if (mode === "fast") fastGrowth = after;
        else growth = after;
        if (Math.abs(growthShare(after) - dragon.growth) > 0.002)
          dragon.setGrowth(growthShare(after));
        if (stageOf(after).id !== stageOf(before).id) {
          stageNote = { text: stageMessage(after), age: 0 };
          dragon.getExcited();
          pay("grewUp", dragon.spine.head);
        }
        document.body.dataset.stage = stageOf(after).id;
        document.body.dataset.length = String(dragon.spine.points.length);
      }
      if (stageNote) {
        stageNote.age += dt;
        if (stageNote.age > STAGE_NOTE_LIFE) stageNote = null;
      }
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
      const thinking = dragon.thinkingOf ?? "";
      if (document.body.dataset.thinking !== thinking) document.body.dataset.thinking = thinking;
      // For automated checks: where the dragon's head and body are.
      const h = dragon.spine.head;
      const c = dragon.centre;
      document.body.dataset.head = `${Math.round(h.x)},${Math.round(h.y)}`;
      document.body.dataset.body = `${Math.round(c.x)},${Math.round(c.y)}`;
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
        if (egg) {
          drawEgg(ctx, egg, eggAt(), eggSize(), dragon.look);
          drawEggHint(ctx, egg, eggAt(), eggSize());
          // An adopted egg can wait: the family button takes you back to the others.
          if (mode === "play" && adoptedEgg)
            drawFamilyButton(ctx, screen.width, screen.height, family.length + 1);
        } else {
          drawNight(ctx, screen.width, screen.height, night, bedAt);
          drawBed(ctx, bedAt, dragon.halfWidth * 4.2, night);
          if (friend && mode === "play") friend.draw(ctx);
          dragon.draw(ctx);
          if (mode === "play" && !catchGame) drawCat(ctx, cat, screen);
          if (catchGame) drawFallers(ctx, catchGame, dragon.halfWidth * 1.1);
        }
        if (photo && !egg) {
          // Photo mode: no buttons, just the dragon in its den, in a frame.
          drawPhotoFrame(
            ctx,
            screen.width,
            screen.height,
            photo.frame,
            identity.name,
            new Date(),
            modeSeconds,
          );
        } else if (!egg) {
          needsBar.draw(ctx, screen.width, screen.height);
          if (mode === "play") coinCounter.draw(ctx);
          if (mode === "play" || mode === "fast")
            drawGrowthBadge(ctx, shownGrowth(), mode === "play" ? identity.name : "");
          if (stageNote)
            drawStageBanner(ctx, screen.width, stageNote.text, stageNote.age, STAGE_NOTE_LIFE);
          if (catchGame) {
            // The trays and buttons are put away during a round.
          } else if (decorator.active) {
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
            drawBackupButton(ctx, screen.width, screen.height);
            drawDecorateButton(
              ctx,
              screen.width,
              screen.height,
              decorator.active,
              dark,
              modeSeconds,
            );
            if (!decorator.active) drawShopButton(ctx, screen.width, screen.height);
            if (!decorator.active && !catchGame) drawGameButton(ctx, screen.width, screen.height);
            if (!decorator.active && !catchGame) drawClosetButton(ctx, screen.width, screen.height);
            if (!decorator.active && !catchGame) drawCameraButton(ctx, screen.width, screen.height);
            if (!decorator.active && !catchGame)
              drawFamilyButton(ctx, screen.width, screen.height, family.length + 1);
          }
          if (catchGame) {
            drawCatchHud(
              ctx,
              catchGame,
              screen.width,
              screen.height,
              catchGame.phase === "done" ? bestBefore : stash.bestCatch,
              catchCoins,
            );
          }
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
      const modeName = { play: "play", fast: "⏩ fast", gallery: "🖼 gallery", hatch: "🥚 hatch" }[
        mode
      ];
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
      // No build tag in photos.
      if (!photo) ctx.fill();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = mode === "play" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)";
      if (!photo) ctx.fillText(label, screen.width - 16, 21);
    },
  });
  // A daily hello: a few coins the first time you visit each day.
  pay("hello", dragon.spine.head);
  document.body.dataset.favorite = dragon.favorite;
  document.body.dataset.seed = String(seed);
  document.body.dataset.ready = "true";
}

void main();
