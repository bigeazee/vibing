# CLAUDE.md — Vibing

Read this file completely before writing any code in this repo.

Vibing is a top-down, Zelda-style browser game that serves as the delivery vehicle for a
45-minute talk about AI-assisted development, given to a non-technical audience of product
managers over Microsoft Teams. Players walk a three-zone map and interact with objects that
open "stations" — panels describing things a PM could build themselves.

The through-line: **the AI is roughly the same at all three levels. What changes is the
discipline you wrap around it.** The three zones make that progression physical.

---

## 1. Content safety rule — read this first, it is not negotiable

**The published site is public on the open internet, regardless of repository visibility.**

Every piece of content in this repo must be generic and non-attributable:

- No Genomics England internal process detail, system names, environment names or team names
- No real Jira project keys, ticket IDs or internal URLs
- No participant, patient or genomic data of any kind, real or realistic-looking
- Fictional or clearly anonymised examples throughout

If a station example needs a domain, invent a neutral one. **If you are unsure whether
something crosses the line, leave it out and flag it in your summary.** Do not guess.

---

## 2. Hard constraints

These are product requirements, not preferences. Do not violate them even if it would be
convenient or if you think you know better.

| Constraint | Detail |
|---|---|
| **No build step** | Vanilla JavaScript, native ES modules, served directly. A beginner must be able to fork the repo, edit one file, and see the change. There is no `npm run build` before deploy, ever. |
| **No framework** | No React, Vue, Svelte, jQuery. No bundler. No transpiler. No TypeScript. |
| **No runtime dependencies** | Zero packages shipped to the browser. `node:test` only for tests — never add a test framework that requires `npm install` to run. |
| **Client-side only** | No backend, no server, no database, no API calls, no fetch to third parties. |
| **No tracking** | No analytics, telemetry, cookies, or any form of usage measurement. |
| **No access control** | No client-side "password protection". It is fake security and it undermines the point of the talk. |
| **No proprietary IP** | No Pokemon, Zelda, Nintendo or other proprietary art, music, character names or trademarks. Style homage only. |
| **Desktop keyboard only (v1)** | No touch controls. Touch/small-screen visitors get a friendly "desktop only" message, never a broken canvas. |
| **Browser support** | Current Chrome, Edge and Firefox. **Edge matters most** — it is the corporate default for this audience. |

### No fail states

There are no timers, no lives, no score, and no way to lose. Wrong answers at a gate are
never punished — they show a gentle nudge and allow immediate, unlimited retries.

---

## 3. Rendering contract

| Property | Value |
|---|---|
| Tile size | **16 x 16 px** |
| Logical viewport | **400 x 240 px** = **25 x 15 tiles** |
| Player position | Locked to the exact centre tile, `(12, 7)` in viewport tile coordinates |
| Scaling | **Integer only**, largest integer that fits the viewport. Centre it, letterbox the remainder against a dark background. Never fractional-scale. |
| Smoothing | `image-rendering: pixelated` on the canvas, `ctx.imageSmoothingEnabled = false` |
| World size | Approximately **92 x 20 tiles**, one continuous map, laid out left-to-right |

Odd tile counts on both axes are deliberate: they let the player sit on an exact centre tile
with no half-tile camera fudge. Do not change the viewport dimensions to even numbers.

Integer scaling means bars appear on non-matching aspect ratios. That is correct and
intended — fractional scaling makes pixel art shimmer, which looks terrible over a
compressed video stream.

### Why legibility beats field of view

The primary use case is a live talk screen-shared over Teams to viewers on laptops watching a
compressed stream. Every visual decision resolves in favour of **large, high-contrast and
readable** over dense or detailed. Assume the worst-case viewer is watching a heavily
compressed feed in a small window.

---

## 4. Sprite sheet contract

`src/content/sprites.js` is the **single source of truth** for every sprite in this project.

**Every reference to a sprite anywhere in this repo must use a name from `SPRITES`. Never
hardcode an atlas index in engine or content code.** A test enforces this: any station or map
tile referencing an unknown sprite name fails. To use an unnamed tile, add it to `SPRITES`
first — that is a one-line change and always the correct move.

### Verified atlas geometry

| Property | Value |
|---|---|
| Atlases | `assets/kenney-tiny-town/tilemap_packed.png`, `assets/kenney-tiny-dungeon/tilemap_packed.png` |
| Image size | 192 x 176 px each |
| Grid | 12 columns x 11 rows = 132 tiles each |
| Tile size | 16 x 16 px |
| Padding | **None.** No spacing between tiles. |
| Indexing | **Row-major**: `index = row * 12 + col` |

These are measured facts, not assumptions. Row-major indexing was confirmed by cropping all
132 tiles from each atlas and comparing them byte-for-byte against the packs' individual
`Tiles/tile_NNNN.png` files. Kenney also ships a 1px-spaced `tilemap.png`; it is **not** in
this repo and must not be reintroduced.

### What the contract gives you

- `TILE_SIZE` — 16
- `ATLASES` — atlas paths and grid geometry
- `SPRITES` — 98 named sprites, `name -> [atlasKey, index]`
- `spriteRect(name)` — resolves to `{atlas, src, sx, sy, w, h}` ready for `drawImage`.
  **Throws** on an unknown name. Let it throw; never draw a silent wrong tile.
- `spriteExists(name)`, `spriteNames()`
- `OVERLAY_SPRITES` / `isOverlay(name)` — see below

### Terrain tiles versus overlay sprites

43 of the 98 sprites are fully opaque and safe to use as a **base terrain tile**. The other 55
contain transparent pixels and **must be drawn over a terrain tile** — used as a base tile
they show the void behind them. This split was derived by scanning the alpha channel of every
named sprite. The map format therefore needs at least two draw layers: an opaque terrain
layer and an overlay layer for props, fences, trees and characters.

### Things the art does not have

- **Tiny Town contains no character sprites.** The player and every NPC come from Tiny
  Dungeon. The two packs share a palette and outline style and sit together on one map
  without clashing.
- **Characters are a single front-facing frame each.** There are no directional variants and
  no walk-cycle frames. Engine code must not assume either exists. Movement can be given life
  with a small vertical bob while walking; that is polish, not a requirement.

Art is Kenney, CC0. See `CREDITS.md`. Do not add art from another source without checking its
licence and updating `CREDITS.md`.

## 5. Repository layout

```
/index.html
/src/
  engine/        loop, input, camera, collision, renderer
  ui/            panel, gate quiz, HUD
  content/       stations.js, gates.js, map.js, sprites.js
  state/         progress, localStorage
/assets/         Kenney sprites
/tests/
/.github/workflows/
/README.md       what it is, how to play, how to run locally, desktop-only note, how to contribute
/CONTRIBUTING.md how to add a station, plus the community backlog of station ideas
/CREDITS.md      Kenney attribution
/CLAUDE.md       this file
```

**Engine code must not know about content.** The engine reads map data, sprite names and
station definitions as data. Adding a station must mean adding one object to
`src/content/stations.js` — no engine changes, ever. If a content change requires an engine
change, the engine is wrong.

### Purity for testability

Game logic that can be pure must be pure. Collision resolution, zone unlock logic, progress
serialisation and content validation are all tested with `node:test` in a plain Node process
with no DOM. That means `localStorage` and `document` access must be injected or isolated
behind a thin adapter, never reached for directly from logic code.

---

## 6. Map and progression

Three zones, unlocked in sequence, three stations each. The player starts in Zone 1.

| Zone | Theme | Level |
|---|---|---|
| 1 | Beginner — prompt and go | Claude web, no install, an evening's work |
| 2 | Intermediate — state and data | One file, holds state, imports and exports CSV or JSON |
| 3 | Advanced — real engineering | Repo, tests, CI, containers, release cadence |

One station per zone is a **flagship** — visually distinct on the map, because it is talked
through live.

### Zone plaques

Each zone has a readable **plaque** object at its entrance stating that zone's theme and
level. This is not decoration: it is what makes the gate answers legitimately discoverable
in-zone, so that someone working through the game alone — with no live narration — can
answer the gate honestly rather than guessing.

### Gate mechanic

To pass from Zone 1 to Zone 2, and again from Zone 2 to Zone 3, the player answers one
multiple-choice question **whose answer is discoverable in the stations and plaque of the
zone they are currently in.** That is the point: you cannot skip the content.

Wrong answers show a gentle "Not quite — the answer is somewhere in this zone" and allow
immediate, unlimited retries. Gate questions live in `src/content/gates.js` so they can be
edited without touching the engine.

### Keep the map compact

Target **under about ten seconds of walking between adjacent stations**, ideally two to
three. The talk is narrated live while moving, and dead air spent crossing empty scenery is
the main way this format fails in front of an audience. No long corridors.

---

## 7. Content data model

Stations and gates live in `/src/content/` as ES modules exporting plain objects, separated
from engine code. Keep the shape flat and human-editable — a non-developer forking this repo
has to be able to read it and copy it.

```js
export const stations = [
  {
    id: "cyoa",
    zone: 1,
    flagship: true,
    title: "Choose Your Own Adventure",
    tile: { x: 12, y: 8 },
    sprite: "chest",
    problem: "...",
    build: "...",
    steps: ["...", "..."],
    prompt: "Copy-paste starter prompt goes here",
    receipt: {
      buildTime: "One evening",
      tool: "Claude web",
      cost: "Free tier",
      lines: "~400 (est.)",
      dataTouched: "None",
      skill: "Writing clear branches",
      hardestPart: "Deciding what the branches should be"
    },
    demo: { type: "placeholder" },
    links: []
  }
];
```

`demo.type` supports:

- `placeholder` — a clean "coming soon" state with a documented mount point for a future module
- `external` — links out, no embedded demo
- `embedded` — a future mini-game module. **Not implemented in v1.**

### The receipt is the most important element in the game

Every station panel ends with a receipt card carrying the **same seven fields, always, in
the same order**: build time, tool used, cost, approximate lines of code, data touched,
skill required, hardest part. The consistency is what makes the difficulty curve legible as
the player moves across zones. Never omit a field, never reorder them, never add an eighth.

**Receipt honesty policy:** figures for things that have actually been built are real.
Anything not yet built is marked as an estimate — `"~400 (est.)"`, `"One evening (est.)"`.
An audience that spots one invented number stops trusting the whole curve, and that curve is
the entire argument of the talk. Never present a guess as a measurement.

### Every station panel has the same four sections, in this order

1. **The problem** — the PM pain it addresses, in plain language, no jargon
2. **What you'd build** — a short description of the thing
3. **Get started** — three to five concrete steps, including a copy-pasteable opening prompt
4. **The receipt** — the seven-field card above

---

## 8. How to add a station

1. Add one object to the `stations` array in `src/content/stations.js`.
2. Give it a unique `id`, a `zone`, a `tile` that is in bounds and not on a collision tile,
   and a `sprite` name that exists in `src/content/sprites.js`.
3. Fill all four content sections and all seven receipt fields.
4. Run `node --test` — the content validation test checks every one of those rules.
5. Re-read the content safety rule in section 1 against your copy.

No engine changes. If you find yourself editing `src/engine/` to add a station, stop and
reconsider — that is a sign the data model needs extending rather than the station being
special-cased.

---

## 9. Tests

`node --test` with `node:test`. No test framework, no `npm install`. Proportionate but real,
covering the pure logic:

- Zone unlock progression — correct answer unlocks, wrong answer does not
- Progress save/load round-trip, plus graceful handling of corrupt or missing storage
- Collision resolution against the map's collision layer
- **Content validation** — every station has all required fields, every receipt has all
  seven, every station tile is in bounds and not on a collision tile, every gate question
  has exactly one correct answer, every referenced sprite name exists in the sprite contract

**That last one matters most: it is what stops a contributor's pull request breaking the
live site.** Treat it as the highest-value test in the repo.

---

## 10. Working practice

- Work on a branch, push it, and let the reviewing session validate before merge.
- Do not silently expand scope. Build what the work package asks for, and raise anything you
  think is wrong rather than fixing it unilaterally.
- If you cannot verify something works, say so plainly. Do not report a criterion as met
  because the code looks correct.
