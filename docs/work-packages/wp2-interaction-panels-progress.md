# Work Package 2 — Interaction, panels, the gate quiz, and progress

**Branch:** create `wp2-interaction-ui` from `main`.

**Status when you start:** `main` carries a working engine — the loop, input, collision,
camera, renderer, a 40x20 demo map and 39 passing tests. Work Package 1 built it and it is
merged. If `src/engine/game.js` is missing you have branched from the wrong place; stop and
fix that before writing any code.

---

## 0. Read this first

**Read `CLAUDE.md` in full before writing any code.** Hard constraints, the rendering
contract, the content data model and the content safety rule all live there. This package
does not repeat them and does not override them.

The three that will bite you fastest:

- **No build step, no framework, no dependencies.** Native ES modules served directly.
- **All paths relative.** The site deploys to GitHub Pages under `/vibing/`. A leading `/`
  works locally and 404s in production.
- **The content safety rule.** This package writes real station copy that will be published
  on the open internet. Section 6 restates it because it applies directly to your work.

Then read the engine you are building on — `src/engine/game.js`, `input.js`, `player.js` and
`tilemap.js`. You are extending a working thing, not starting one.

---

## 1. What this package delivers

Walking up to an object and pressing E opens a panel about it. Answering a question at a
gate unlocks the next zone. What you have seen persists across a reload.

**In scope:** the boot module, interaction detection, the station panel, the gate quiz, the
HUD, progress persistence with reset and export, the three Zone 1 stations, both gate
questions, and tests for all of the new pure logic.

**Explicitly NOT in scope — do not build these:**

- The real three-zone map. You extend the demo map; Work Package 3 replaces it wholesale.
- Zone 2 and Zone 3 station content. Only Zone 1's three stations are yours.
- Zone plaques. They arrive in Work Package 3 with the real zone entrances.
- `CONTRIBUTING.md`, the content-validation test suite, or the community backlog.
- Embedded mini-games. `demo.type: "placeholder"` renders a coming-soon state and nothing more.

Building any of it will be reverted.

---

## 2. Four corrections carried over from Work Package 1

These came out of the WP1 review. Do them as part of this package.

1. **Fix the test invocation.** `.github/workflows/test.yml` runs `node --test tests/`, which
   breaks on Node 22+ — Node changed how the runner treats a bare directory positional and
   now tries to load `tests` as a module. Change the step to `node --test` and the
   `node-version` to `"22"`. Node 20 is end-of-life. Update the README's test section to
   match, dropping the now-unnecessary explanation of the discrepancy.

2. **Add `src/main.js` as a real boot module.** WP1 wired the game from an inline module
   script in `index.html`, correctly, because no boot module was in its file list. This
   package adds enough wiring that it no longer belongs in a script tag. Move it out.
   `index.html` should end up with a single `<script type="module" src="src/main.js">`.

3. **Add `tests/player.test.js`.** WP1 had no test for `updatePlayer`, which is the most
   timing-sensitive pure logic in the engine. Cover: one press moves exactly one tile over
   `MOVE_MS`; a blocked target does not move the player but *does* update `facing`; leftover
   time carries into the next tile when a direction is still held; a released direction
   stops the player exactly on a tile boundary; a large `dtMs` does not skip past a solid
   tile.

4. **Add `clearPresses()` to the input contract.** See section 3.1 — it fixes a real hazard
   this package would otherwise ship.

---

## 3. Interfaces you must conform to

These signatures are fixed. Later packages are written against them by sessions that cannot
see your code. If one is genuinely unworkable, say so in your summary and explain why — do
not quietly change it. WP1's session did exactly that and it improved the project.

### 3.1 `src/engine/input.js` — one addition

```js
clearPresses()   // discard every pending edge-triggered press flag
```

**Why this exists.** `consumePress` sets a boolean that stays set until something consumes
it. While the game is paused nothing calls `updatePlayer`, so flags accumulate. Without
this, pressing `E` while a panel is open leaves a stale `interact` flag that reopens the
panel the instant it closes. **Call `clearPresses()` on every panel open and every panel
close.** Do not change any existing signature in that file.

### 3.2 `src/state/progress.js`

Pure apart from the storage object handed to it. **No `localStorage` access from inside this
module** — it is injected, so the tests run in plain Node with a fake.

```js
export const STORAGE_KEY = "vibing.v1";

/**
 * @param {object} storage anything with getItem/setItem/removeItem
 */
export function createProgress(storage)
```

Returns:

```js
{
  hasVisited(stationId): boolean,
  visit(stationId): void,          // idempotent, persists immediately
  visitedIds(): string[],          // insertion order, stable
  isZoneUnlocked(zoneId): boolean, // zone 1 is always unlocked
  unlockZone(zoneId): void,        // idempotent, persists immediately
  highestZone(): number,           // highest unlocked zone id
  reset(): void,                   // clears storage and in-memory state
  summary(stations): string        // see below
}
```

**Corrupt or missing storage must never throw.** Absent key, unparseable JSON, valid JSON of
the wrong shape, a `null` storage object, and a `storage` whose `setItem` throws (Safari
private mode does this) all resolve to a working in-memory progress object starting from
scratch. A player with a broken browser profile gets a fresh game, not an error screen.

`summary(stations)` takes the stations array and returns a short plain-text block the player
can paste into a chat — how many of how many stations visited, which zones are unlocked, and
the visited station titles. Keep it under about six lines. No URLs, no timestamps, nothing
that could identify anyone.

### 3.3 `src/engine/interaction.js`

Pure. No DOM. Generic over anything carrying a `tile: {x, y}` — it must not know what a
station or a gate is.

```js
export function facingTile(player)                 // -> {x, y} the tile the player faces
export function itemOnTile(items, x, y)            // -> item | null
export function interactableFor(items, player)     // -> item | null
```

`interactableFor` resolution order, which must be deterministic:

1. The item on the tile the player is facing, if there is one.
2. Otherwise the first item on an orthogonally adjacent tile, checked **up, down, left,
   right** in that order.
3. Otherwise `null`.

Facing first, adjacency as a fallback. This is deliberately forgiving: the game is driven
live in front of an audience and nobody should have to fiddle with which way they are
pointing to open a panel.

### 3.4 `src/engine/zones.js`

Pure. Mutates the `solid` layer of the grid it is handed and nothing else.

```js
export function markStationsSolid(grid, stations)
export function lockGates(grid, gates, isZoneUnlocked)
```

`markStationsSolid` blocks every station tile, so you stand next to a station rather than on
it. Called once at boot.

`lockGates` sets each gate tile solid when `isZoneUnlocked(gate.toZone)` is false and clears
it when true. `isZoneUnlocked` is a predicate, not the progress object — keep this testable
without storage. **It must be idempotent and safe to call repeatedly**: call it at boot and
again every time a zone unlocks.

Both functions assume station and gate tiles are *not* solid in the map itself, so clearing
is safe. Enforce that assumption with a thrown error naming the offending station or gate
`id` — see the two error scopes in `CLAUDE.md` section 9.

### 3.5 `src/ui/panel.js`

```js
export function createPanel(root)   // root is a container element in index.html
```

Returns `{ open(station), close(), isOpen(), onClose(handler) }`.

### 3.6 `src/ui/gate.js`

```js
export function createGateQuiz(root)
```

Returns `{ open(gate, { onPass }), close(), isOpen() }`. `onPass` fires once, on a correct
answer, before the quiz closes.

### 3.7 `src/ui/hud.js`

```js
export function createHud(root)
```

Returns `{ showPrompt(text), hidePrompt(), setZone(zoneId), setProgress(visited, total) }`.

---

## 4. Design decisions already made

Do not relitigate these; they exist to keep `CLAUDE.md`'s promises true.

**Stations are drawn from `stations.js`, never from the map.** `CLAUDE.md` says adding a
station must mean adding one object and changing nothing else. If a station's sprite lived in
the map's ASCII grid you would have to edit two files, so the boot module builds station
entities and passes them to the renderer, which already accepts an `entities` array. Same for
gates.

**Draw order is map, then gates, then stations, then the player.**

**Flagship stations get a marker sprite drawn on the tile directly above them.** A content
author setting `flagship: true` must not also have to remember to pick a different sprite —
`CLAUDE.md` requires flagships be visually distinct, so make it mechanical. Pick a marker
from `SPRITES` that reads clearly on grass at 16px over a compressed video stream;
`torch_wall` is a reasonable starting guess but use your eyes and tell me what you chose.

**Panels and the quiz handle their own arrow keys.** `input.js` calls `preventDefault()` on
the arrows so the page can never scroll, which also means arrows will not scroll an open
panel. While a panel is open it maps Up/Down and PageUp/PageDown to scrolling its own body.
While the quiz is open, Up/Down move the selected option. Do not weaken the global
`preventDefault` to work around this.

**Opening any overlay calls `game.pause()`; closing calls `game.resume()`.** Both also call
`input.clearPresses()`. Movement freezes while an overlay is open; rendering continues.

---

## 5. Files

```
NEW  /src/main.js
NEW  /src/engine/interaction.js
NEW  /src/engine/zones.js
NEW  /src/state/progress.js
NEW  /src/ui/panel.js
NEW  /src/ui/gate.js
NEW  /src/ui/hud.js
NEW  /src/ui/ui.css
NEW  /src/content/stations.js
NEW  /src/content/gates.js
NEW  /tests/progress.test.js
NEW  /tests/interaction.test.js
NEW  /tests/zones.test.js
NEW  /tests/player.test.js
EDIT /index.html                       overlay containers, stylesheet link, main.js entry
EDIT /src/engine/input.js              add clearPresses() only
EDIT /src/content/map.js               three zones and two gate barriers — see section 7
EDIT /README.md                        controls, progress, corrected test command
EDIT /.github/workflows/test.yml       node --test, Node 22
```

Do not modify `src/content/sprites.js`, `assets/`, `CREDITS.md` or `CLAUDE.md`. If you
believe one of them is wrong, say so in your summary rather than editing it.

---

## 6. Station content — the three Zone 1 stations

**Restating the content safety rule, because this section publishes text to the open
internet.** No employer-internal process detail, system names, environment names or team
names. No real ticket keys, project keys or internal URLs. No participant, patient or
genomic data of any kind, real or realistic-looking. Invent a neutral domain if an example
needs one. **If you are unsure whether something crosses the line, leave it out and flag it
in your summary.**

Write real, useful copy — this is text a product manager will read and act on, not filler.
Follow the four-section shape and the seven-field receipt in `CLAUDE.md` section 7 exactly.

1. **Choose Your Own Adventure** — `flagship: true`, `demo: { type: "placeholder" }`.
   A branching scenario you send to stakeholders instead of a survey. The point it makes:
   people who all claim to agree on a process take visibly different routes through it.
   The panel shows a clean "playable demo coming soon" state with a documented mount point.
2. **Ambiguity Roulette** — paste in a real requirement, get four defensible readings of it,
   vote on which one you actually meant.
3. **Meeting Cost Meter** — a live ticker showing what the current meeting is costing.
   Deliberately trivial. It exists to show the floor of the difficulty curve and to get the
   laugh, and the copy should be comfortable saying so.

**Receipt honesty — this is not negotiable.** None of these three has been built. Every
figure is therefore an estimate and must be marked as one: `"~400 (est.)"`, `"One evening
(est.)"`. `CLAUDE.md` section 7 explains why: an audience that spots one invented number
stops trusting the whole difficulty curve, and that curve is the entire argument of the talk.
Never present a guess as a measurement.

Give one of the three noticeably longer copy than the others so the panel's scrolling is
exercised by real content rather than by a contrived test.

---

## 7. Gates and the demo map

`src/content/gates.js` exports both gate questions, in the shape:

```js
export const gates = [
  {
    id: "gate-1-2",
    fromZone: 1,
    toZone: 2,
    tile: { x: 14, y: 9 },
    sprite: "door_wood",
    spriteUnlocked: "door_wood_open",
    question: "What actually changes as you move up the levels of AI-assisted building?",
    options: [
      { text: "The AI model gets more powerful", correct: false },
      { text: "The discipline you wrap around it", correct: true },
      { text: "The programming language you use", correct: false },
      { text: "How much you have to type", correct: false }
    ],
    nudge: "Not quite — the answer is somewhere in this zone."
  },
  // gate-2-3: "In a mature AI-assisted project, where does most of the human effort go?"
  //   Writing the code / Reviewing, testing and deciding (correct) /
  //   Writing longer prompts / Choosing the right model
];
```

Refine the wording if you can improve it; keep the substance. The sprite swapping to
`spriteUnlocked` once passed is the map's own record of your progress — make sure it does.

**Extend the demo map to three zones** so both gates are real and reachable: three zone
ranges across the 40 columns, with a barrier between each pair that the player cannot get
around, pierced by exactly one gate tile. The exact tiles are yours to choose. The demo map
is throwaway scaffolding and WP3 replaces it, so spend no time making it pretty — spend it
making the barrier airtight.

**Prove the barrier with a test, not by eye.** Flood-fill the walkable tiles from the spawn
with the gates locked and assert that no Zone 2 or Zone 3 tile is reachable; unlock gate 1
and assert Zone 2 becomes reachable and Zone 3 still does not. That test is the one that
stops a contributor accidentally opening a hole in the real map later, so write it to be
lifted straight into WP3.

---

## 8. The panel, the quiz and the HUD

**All three are HTML overlays above the canvas. Nothing here is drawn into the canvas.**
Style them in `src/ui/ui.css`, linked relatively from `index.html`.

**Legibility is the requirement that outranks the others.** The audience is watching a
compressed Teams stream, some of them on half a laptop screen. Large type, high contrast,
generous line height, and a measure short enough to read comfortably. When in doubt make it
bigger. Re-read `CLAUDE.md` section 3 on why legibility beats density here.

**Station panel.** The four sections in order — the problem, what you'd build, get started,
the receipt. The opening prompt renders in a `<pre>` the reader can select, with a copy
button that uses `navigator.clipboard` when available and degrades to "select and copy" when
it is not. The receipt is a card with all seven fields, always, in `CLAUDE.md`'s order. A
`demo.type` of `placeholder` renders a clean coming-soon block with a comment marking where
a future module mounts; `external` renders its `links`; `embedded` is not implemented — throw
on it rather than rendering something misleading.

**Gate quiz.** Question, then the options as buttons, numbered so `1`–`4` select them
directly and Up/Down plus Enter also work. A wrong answer shows the gate's `nudge`, keeps the
quiz open and allows immediate unlimited retries. **There is no penalty, no counter of wrong
attempts, and nothing that reads as failure** — `CLAUDE.md` is explicit that this game has no
fail states. A correct answer confirms, calls `onPass`, and closes.

**Escape closes any overlay.** The quiz can be abandoned without answering; the player simply
does not pass yet.

**Focus management.** Opening an overlay moves focus into it; closing returns focus to the
canvas. Tab must not escape an open overlay into the page behind it.

**HUD.** The interaction prompt ("Press E") appears whenever `interactableFor` returns
something and hides when it does not. Also show the current zone and a visited count. Below
the canvas, two small controls: **reset progress**, which asks for confirmation inline —
not with `window.confirm`, which looks broken on a screen share — and **export progress**,
which shows `summary(stations)` in a selectable box with a copy button.

---

## 9. Tests

`node --test` must pass. `node:test` and `node:assert` only. No framework, nothing to install.

- **`tests/progress.test.js`** — visit and unlock round-trip through a fake storage; absent
  key; unparseable JSON; valid JSON of the wrong shape; a `setItem` that throws; `reset()`
  clearing both storage and memory; zone 1 always unlocked; `summary()` shape.
- **`tests/interaction.test.js`** — facing wins over adjacency; the up/down/left/right
  fallback order; nothing adjacent returns null; an item diagonally adjacent is not
  interactable.
- **`tests/zones.test.js`** — stations become solid; a locked gate is solid and an unlocked
  one is not; `lockGates` is idempotent; a station or gate placed on a solid map tile throws
  naming its `id`; **the flood-fill barrier test from section 7**.
- **`tests/player.test.js`** — as specified in section 2.

Gate answer correctness is content, and its test belongs with the content-validation suite in
WP3. Do not build that suite here.

---

## 10. Acceptance criteria

I verify every one of these by running the code, not by reading it. Anything you cannot get
working, say so plainly rather than leaving me to find it.

- [ ] `node --test` passes; the CI workflow runs `node --test` on Node 22 and is green
- [ ] Walking next to a station shows the prompt; it disappears when you walk away
- [ ] `E`, `Enter` and `Space` all open the panel; `Escape` closes it
- [ ] Movement is frozen while any overlay is open, and the game is still rendering behind it
- [ ] Pressing `E` repeatedly while a panel is open does not reopen it on close
- [ ] All three Zone 1 stations open, with four sections and a complete seven-field receipt
- [ ] The flagship is visually distinguishable on the map without reading anything
- [ ] The long station scrolls with the mouse wheel and with Up/Down, and the page never scrolls
- [ ] The gate blocks passage; a wrong answer nudges and allows immediate retry with no
      penalty; the correct answer unlocks the zone, opens the door sprite and lets you through
- [ ] Progress survives a reload — visited stations and unlocked zones both
- [ ] Reset clears progress and re-locks the gates without a page reload
- [ ] Export produces a pasteable summary with nothing identifying in it
- [ ] Corrupt `localStorage` — set `vibing.v1` to `"{{{"` by hand — starts a fresh game
      rather than showing an error. **Test this yourself before reporting done.**
- [ ] Panel and quiz text are readable with the window at half a laptop screen
- [ ] `grep -rnE '(src|href)="/|from "/' index.html src/` finds nothing
- [ ] No `package.json` dependencies, no framework, no bundler, no build step
- [ ] No employer-identifiable content anywhere in your copy

---

## 11. When you are done

Push the branch. **Do not open a pull request and do not merge to `main`.** Write a summary
covering:

1. What you built and anything you could not get working
2. Any interface in section 3 you think is wrong, and why — you have seen the code and I have
   not, so this is genuinely useful. WP1's session raised six and four of them were my errors
3. Anything about the sprite contract or the assets that looks incorrect
4. Which marker sprite you chose for flagships, and why
5. Any copy you left out or softened because of the content safety rule
6. Whether you verified the corrupt-storage path yourself, and what it did
