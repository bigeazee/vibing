# Work Package 1 — Engine core, first playable, and deployment

**Branch:** create `wp1-engine-core` from `claude/prompt-review-wlebc7`, which carries the
assets and the sprite contract. (If that branch has already been merged into `main`, branch
from `main` instead — check with `git log --oneline main` first.)

**Status when you start:** the repo contains `CLAUDE.md`, `CREDITS.md`, `assets/`,
`src/content/sprites.js` and `docs/work-packages/`. Nothing else. If `assets/` or
`src/content/sprites.js` is missing, you have branched from the wrong place — stop and fix
that before writing any code.

---

## 0. Read this first

**Read `CLAUDE.md` in full before writing any code.** It contains the hard constraints, the
rendering contract and the content safety rule. This work package does not repeat them and
does not override them.

The two that will bite you fastest:

- **No build step, no framework, no dependencies.** Native ES modules served directly. If you
  find yourself adding a `package.json` `dependencies` block, stop.
- **All asset and module paths must be relative.** The site deploys to GitHub Pages under a
  subpath (`/vibing/`). A leading `/` will work locally and 404 in production. This is the
  single most likely way for this package to fail.

---

## 1. What this package delivers

A player character walking around a real Kenney-sprite map, blocked by collision, with the
camera following them — served locally and deploying to GitHub Pages.

**In scope:** the game loop, asset loading, the map data format, the map parser, collision,
camera, input, the renderer, a small demo map, tests for the pure logic, and both CI
workflows.

**Explicitly NOT in scope — do not build these:**

- Station panels, the interaction prompt, or any HTML overlay UI
- Gates, the gate quiz, or zone unlocking
- Progress persistence or `localStorage`
- The real three-zone map (you build a small demo map instead — see section 5)
- Station content of any kind

Those are later packages. Building them now will be reverted.

---

## 2. Files you will create

```
/index.html
/src/engine/assets.js
/src/engine/tilemap.js
/src/engine/collision.js
/src/engine/camera.js
/src/engine/input.js
/src/engine/player.js
/src/engine/renderer.js
/src/engine/game.js
/src/content/map.js
/tests/sprites.test.js
/tests/tilemap.test.js
/tests/collision.test.js
/tests/camera.test.js
/.github/workflows/test.yml
/.github/workflows/pages.yml
/README.md
```

Do not modify `src/content/sprites.js`, `assets/`, `CREDITS.md` or `CLAUDE.md`. If you
believe one of them is wrong, say so in your summary rather than editing it.

---

## 3. Interfaces you must conform to

These signatures are fixed. Later work packages are written against them by a session that
cannot see your code, so changing them silently will break the project. If a signature is
genuinely unworkable, say so in your summary and explain why — do not quietly change it.

### 3.1 `src/engine/tilemap.js`

```js
/**
 * Turn the human-editable map definition into a grid the engine can use.
 * Pure. No DOM access. Must be importable in plain Node for tests.
 */
export function parseMap(mapDef, legend)
```

Returns:

```js
{
  width: number,            // tiles
  height: number,           // tiles
  spawn: { x: number, y: number },
  terrain: string[],        // length width*height, a sprite name, never null
  overlay: (string|null)[], // length width*height
  solid: Uint8Array,        // length width*height, 1 = blocked
  zones: [{ id: number, from: number, to: number }],  // inclusive tile-x ranges
  zoneAt(x, y): number      // zone id at a tile, or 0 if it is in no zone
}
```

`parseMap` must **throw an `Error` with a precise, actionable message** — naming the row,
column and offending character — on every one of these:

- rows are not all the same length
- a character in a row has no entry in the legend
- a legend entry's `terrain` is not a name in `SPRITES`
- a legend entry's `terrain` is an overlay sprite (use `isOverlay` from the sprite contract)
- a legend entry's `overlay` is not a name in `SPRITES`
- `spawn` is out of bounds, or on a solid tile

Also export:

```js
export function index(width, x, y)   // y * width + x
```

### 3.2 `src/engine/collision.js`

Pure. No imports other than from `tilemap.js`. Must run in plain Node.

```js
export function isInBounds(grid, x, y)  // grid is the parseMap result
export function isSolid(grid, x, y)     // out of bounds counts as SOLID
export function canEnter(grid, x, y)    // in bounds AND not solid
```

### 3.3 `src/engine/camera.js`

Pure. No DOM.

```js
/**
 * @returns {{x: number, y: number}} top-left of the camera window, in pixels.
 * Clamped so the camera never shows past the map edge.
 * If the map is smaller than the view on an axis, centre the map on that axis.
 */
export function cameraTopLeft({ playerPxX, playerPxY, mapPxW, mapPxH, viewPxW, viewPxH })
```

`playerPxX/Y` is the player's **top-left** pixel position, not their centre.

### 3.4 `src/engine/input.js`

```js
export function createInput(target = window)
```

Returns `{ direction(), isDown(action), consumePress(action), destroy() }`.

- Actions: `"up" | "down" | "left" | "right" | "interact" | "cancel"`
- Bindings: arrows **and** WASD for direction; `KeyE`, `Enter` and `Space` for `interact`;
  `Escape` for `cancel`
- `direction()` returns `{ dx, dy }` for the most recently pressed held direction, or `null`.
  Never return a diagonal — this is a four-direction grid game.
- `consumePress(action)` returns `true` **once** per physical key press (edge-triggered), so a
  held key does not repeat. Later packages use this to open panels.
- **Must `preventDefault()` on the arrow keys and Space** so the page never scrolls. This is a
  stated requirement, not a nicety.
- `destroy()` removes every listener it added.

### 3.5 `src/engine/player.js`

```js
export const MOVE_MS = 180;   // milliseconds to traverse one tile
export function createPlayer(spawn)          // -> player state object
export function updatePlayer(player, input, grid, dtMs)
```

Movement is **grid-aligned with smooth interpolation**: the player always starts and ends on a
tile centre, and slides between them over `MOVE_MS`. While a move is in progress, further
direction input is ignored until the player lands. On landing, if a direction is still held
and the target tile is enterable, begin the next move immediately so held movement is
continuous and does not stutter.

Player state must expose at least `{ tileX, tileY, pxX, pxY, moving, facing }`. `pxX/pxY` are
the interpolated pixel position used for drawing.

`MOVE_MS = 180` gives roughly 5.5 tiles per second. It is exported as a constant because it
will be tuned against the live talk; do not hardcode the number anywhere else.

### 3.6 `src/engine/assets.js`

```js
export async function loadAtlases(atlases)   // takes ATLASES from the sprite contract
```

Resolves to `{ town: HTMLImageElement, dungeon: HTMLImageElement }`. On failure it must reject
with an `Error` **naming the exact file path that failed to load**. A blank canvas with a
console error is a failure of this package.

### 3.7 `src/engine/renderer.js`

```js
export function createRenderer(canvas, images)   // images from loadAtlases
```

Returns `{ draw(grid, camera, entities) }` where `entities` is an array of
`{ sprite, pxX, pxY }` drawn in order after the map.

- Draw order: terrain layer, then overlay layer, then entities.
- **Cull to the camera window.** Draw only the tiles visible, plus one tile of bleed on each
  side. Do not draw all 800+ tiles every frame.
- Resolve every sprite through `spriteRect(name)` from the sprite contract. Never compute an
  atlas offset yourself.
- Set `ctx.imageSmoothingEnabled = false`.

### 3.8 `src/engine/game.js`

```js
export async function startGame(canvas, { mapDef, legend })
```

Wires everything together and starts the loop. Returns a handle:

```js
{ pause(), resume(), destroy() }
```

**`pause()` and `resume()` are the seam the next work package needs** — Work Package 2 adds
panels that must freeze movement while open. `pause()` stops movement and input handling but
keeps rendering the current frame. Implement them now even though nothing calls them yet.

The loop is `requestAnimationFrame` driven and passes real elapsed milliseconds to
`updatePlayer`. Clamp `dtMs` to a sane maximum (say 100ms) so that a backgrounded tab does not
teleport the player on return.

---

## 4. The map data format

This is a contract that Work Package 3 will author the real three-zone map against, so get it
right. It is deliberately an **ASCII grid with a legend**, not a flat array of tile indices,
because a non-developer has to be able to read it and edit it in a text editor.

`src/content/map.js` exports:

```js
export const legend = {
  ".": { terrain: "grass" },
  ",": { terrain: "grass_clover" },
  "=": { terrain: "path" },
  "T": { terrain: "grass", overlay: "tree_green", solid: true },
  "#": { terrain: "grass", overlay: "fence_h", solid: true },
  "C": { terrain: "grass", overlay: "chest", solid: true },
};

export const mapDef = {
  name: "Demo",
  spawn: { x: 5, y: 9 },
  zones: [{ id: 1, from: 0, to: 39 }],
  rows: [
    "........................................",
    // ... every row exactly `width` characters
  ],
};
```

Legend entry shape — `terrain` is required, the rest optional:

| Key | Type | Meaning |
|---|---|---|
| `terrain` | string | **Required.** A sprite name. Must be opaque (`isOverlay(name) === false`). |
| `overlay` | string | Optional sprite name drawn on top of the terrain. |
| `solid` | boolean | Optional, defaults `false`. `true` blocks movement. |

Map width is `rows[0].length`; height is `rows.length`. Every row must be the same length —
`parseMap` throws if not.

---

## 5. The demo map

Build a **40 x 20** demo map. It is throwaway scaffolding to prove the engine works; Work
Package 3 replaces it entirely. It must contain, at minimum:

- A grass field using at least two grass variants so tile variety is visibly working
- A dirt path built from the `path_*` nine-slice, so the compass suffixes are proven correct
- Several trees and bushes as solid overlay obstacles
- A run of fencing using `fence_h`, `fence_v` and at least two corners, proving the
  connectivity documented in the sprite contract
- At least one `chest` and one `plaque`
- A solid border so the player cannot walk off the map

40 x 20 is wider and taller than the 25 x 15 viewport, which is deliberate: it proves the
camera scrolls and clamps on **both** axes.

---

## 6. `index.html` and scaling

- A single `<canvas>` with `width="400" height="240"` — the logical resolution. Never change
  the canvas backing-store size on resize.
- Scale the canvas up with CSS to the **largest integer multiple** that fits the viewport.
  Recompute on `resize`. Centre it and letterbox the remainder against a dark background.
- `image-rendering: pixelated` (plus `-moz-crisp-edges` for older Firefox).
- An error region, hidden by default. If `startGame` rejects, show it with the error message
  in **large, high-contrast text** — this is what a viewer sees when an asset 404s, and it must
  be readable, not a console message.
- A touch/no-keyboard notice: if the device has no fine pointer
  (`window.matchMedia("(pointer: coarse)")`), show a short, friendly message saying Vibing is
  desktop-keyboard-only for now. Do not attempt touch controls.
- `<script type="module" src="src/engine/game.js">` style entry, with relative paths
  throughout.

Keep the page chrome minimal — no title bars, no menus, no instructions panel. Just the canvas.
A one-line control hint under the canvas is fine.

---

## 7. Tests

`node --test tests/` must pass. `node:test` and `node:assert` only — **no test framework, no
`npm install`.** A `package.json` is acceptable only for `{"type":"module"}` and a `test`
script; it must have no dependencies.

Required coverage:

**`tests/sprites.test.js`**
- Every name in `SPRITES` resolves through `spriteRect()` without throwing
- Every index is within `0..count-1` for its atlas
- `spriteRect()` throws on an unknown name
- Every member of `OVERLAY_SPRITES` is a key of `SPRITES`

**`tests/tilemap.test.js`**
- A valid map parses to the right width, height, layer lengths and solid grid
- `zoneAt()` returns the right zone inside a range and `0` outside every range
- **One test per throw case listed in 3.1** — ragged rows, unknown legend character, unknown
  sprite name, overlay sprite used as terrain, spawn out of bounds, spawn on a solid tile.
  Assert on the error message, not just that it threw.

**`tests/collision.test.js`**
- Walkable and solid tiles resolve correctly
- **Out of bounds counts as solid** on all four edges

**`tests/camera.test.js`**
- Camera centres on the player away from the edges
- Camera clamps at all four map edges
- A map smaller than the view on an axis is centred on that axis

---

## 8. CI and deployment

**`.github/workflows/test.yml`** — on `push` and `pull_request`: check out, set up Node 20,
run `node --test tests/`. No install step, because there is nothing to install.

**`.github/workflows/pages.yml`** — on push to `main` and on `workflow_dispatch`. Use
`actions/configure-pages`, `actions/upload-pages-artifact` (upload the repo root) and
`actions/deploy-pages`, with the standard `pages: write` / `id-token: write` permissions and a
`github-pages` environment. Do not add a build step.

---

## 9. README.md

Short and practical:

- What Vibing is, in three sentences
- How to run it locally: `python3 -m http.server 8000` then open `http://localhost:8000`.
  **Explain that opening `index.html` directly with `file://` will not work**, because ES
  modules are blocked by CORS on the file protocol. People will hit this.
- Controls: arrow keys or WASD
- The desktop-keyboard-only limitation, stated plainly
- That it is a work in progress at this stage

Do not write contribution instructions yet — `CONTRIBUTING.md` is a later package.

---

## 10. Acceptance criteria

I will verify every one of these by running the code, not by reading it. Anything you cannot
get working, say so plainly in your summary rather than leaving me to find it.

- [ ] `node --test tests/` passes, with every throw case in 3.1 covered by its own test
- [ ] Served over `http://localhost:8000`, the page renders the demo map with real Kenney
      sprites — terrain, overlay props and the player
- [ ] Arrow keys **and** WASD move the player, one tile per press, smoothly interpolated
- [ ] Arrow keys and Space do not scroll the page
- [ ] The player cannot walk through trees, fences, chests, or off the map edge
- [ ] The camera follows the player and clamps at all four edges — no void visible, ever
- [ ] The canvas scales to an integer multiple, stays crisp with no blurring, and re-scales
      correctly when the window is resized
- [ ] Renaming `assets/kenney-tiny-town/tilemap_packed.png` produces a large readable
      on-screen error naming that file, not a blank canvas. **Test this yourself before you
      report done, then rename it back.**
- [ ] `grep -rn '"/\|'"'"'/\|(/' index.html src/` finds no absolute paths in `src` or `href`
      attributes — every path is relative
- [ ] `startGame()` returns a handle with working `pause()`, `resume()` and `destroy()`
- [ ] No `package.json` dependencies, no framework, no bundler, no build step
- [ ] Both workflow files are valid YAML and the test workflow passes on the branch

---

## 11. When you are done

Push the branch and write a summary covering:

1. What you built and anything you could not get working
2. Any interface in section 3 you think is wrong, and why — you have seen the code and I have
   not, so this is genuinely useful
3. Anything you noticed about the sprite contract or the assets that looks incorrect
4. Whether you verified the asset-failure error state yourself, and what it looked like

Do not open a pull request. Do not merge to `main`.
