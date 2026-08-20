# Work Package 3 — The real map, the remaining six stations, and content validation

**Branch:** create `wp3-real-map` from `main`.

**Status when you start:** the game works. Engine, interaction, station panels, the gate quiz,
the HUD and saved progress are all built and merged, running on a 40x20 throwaway demo map
with Zone 1's three stations on it. 84 tests pass. If `src/ui/panel.js` is missing you have
branched from the wrong place; stop and fix that first.

**This is the package that makes Vibing content-complete.** After it, the game is the game.

---

## 0. Read this first

**Read `CLAUDE.md` in full before writing any code.** Then read `src/content/stations.js` —
the three Zone 1 stations are the house style, and the six you write must sit beside them
without a seam.

The three constraints that will bite you fastest:

- **The content safety rule.** This package writes more published copy than the rest of the
  project combined. Section 5 restates it.
- **The receipt honesty policy.** Section 5.3 is the sharpest application of it in the whole
  project and the easiest place to do real damage. Read it twice.
- **No build step, no framework, no dependencies, all paths relative.**

---

## 1. What this package delivers

The real 92x20 three-zone map, the six remaining stations, three zone plaques,
`CONTRIBUTING.md`, and the content validation suite that stops a contributor's pull request
breaking the live site.

**In scope:** everything above, plus four corrections carried over from the WP2 review.

**Explicitly NOT in scope:**

- Embedded mini-games. The two flagship placeholders stay placeholders.
- Any engine change beyond the four corrections in section 2. If adding a station needs an
  engine change, the data model is wrong — say so rather than patching the engine.
- Deployment, README polish and the live-site check. Those are the next package.

---

## 2. Four corrections carried over from the WP2 review

1. **Fix the stale docblock in `src/engine/zones.js`.** The comment on `requireWalkableTile`
   (around line 78) says a gate sharing a station's tile "is reported as a map conflict —
   that is the right answer." The `mapVerdict` docblock below it says the opposite, and the
   `mapVerdict` one is correct: I confirmed by test that the case is **not** caught. Delete
   the wrong claim. Then catch that case properly in the content validation suite, where
   section 8 already asks for it.

2. **Add `onClose` to `createGateQuiz`.** `createPanel` has it and the quiz does not, so
   `main.js` polls `quiz.isOpen()` every frame to notice a close it could have been told
   about. Signature becomes `open(gate, { onPass, onClose })`, matching the panel. Remove the
   polling.

3. **Extract the duplicated overlay helpers into `src/ui/overlay.js`.** `el()` and
   `trapTab()` are byte-identical in `panel.js` and `gate.js` because WP2's file list was
   exact. Import them from one place now.

4. **Win back a scale step at 1280x800.** The stage measures 715px where 3x integer scaling
   needs 720. Five pixels of vertical chrome is the difference between the game rendering at
   800x480 and at 1200x720 on the commonest small-laptop resolution. Trim padding until
   1280x800 reaches 3x, and confirm 1440x900 and 1920x1080 have not lost a step. Do not
   change the logical resolution or the integer-scaling rule to achieve it.

---

## 3. Interfaces

### 3.1 `src/content/plaques.js` — new

```js
export const plaques = [
  {
    zone: 1,                       // 1, 2 or 3 — exactly one plaque per zone
    tile: { x: 3, y: 10 },
    sprite: "plaque",
    title: "Zone 1 — Beginner",
    level: "Claude web, no install, an evening's work",
    body: "..."                    // two or three sentences, plain text
  }
];
```

### 3.2 `src/ui/panel.js` — one addition

```js
openPlaque(plaque)   // renders title, level and body — no sections, no receipt
```

Reuse the panel's existing chrome, focus trap, scrolling and Escape handling. A plaque is not
a station: it has no four sections and **no receipt**. Do not fake one.

Plaques are solid, like stations, and do **not** count toward the visited-stations total. The
HUD counter stays "x / 9 stations" and means stations.

### 3.3 `src/content/validate.js` — new

The validation logic lives in a module so the test file stays thin and so a future package can
run it at boot if we ever want to.

```js
/**
 * @returns {string[]} every problem found, each a complete actionable sentence.
 *   Empty array means the content is valid.
 */
export function validateContent({ stations, gates, plaques, mapDef, legend })
```

**It collects every problem rather than throwing on the first.** A contributor who has made
three mistakes should see three messages, not play whack-a-mole. Messages follow
`CLAUDE.md` section 9's two scopes: a grid fault names row, column and character; a
definition fault names the `id`, the legend character, or the plaque's zone.

---

## 4. The real map

Replace `src/content/map.js` wholesale. The demo map is scaffolding and none of it is
precious.

| Property | Value |
|---|---|
| Size | **92 x 20 tiles** |
| Zones | three, roughly 30 tiles wide each, laid out left to right |
| Gates | one tile in a full-height barrier between each pair of zones |
| Spawn | in Zone 1, on the path, near the west end |

**Walking time is a hard requirement, not a preference.** `MOVE_MS` is 180, so the player
covers about 5.5 tiles a second. Adjacent stations must be **no more than 17 tiles apart by
walking distance**, and 10 to 14 is the target — two to three seconds. Section 8 requires a
test that measures this by breadth-first search across the real map, because dead air spent
crossing scenery is the main way this format fails in front of an audience.

**Each zone should look different.** The three zones are a difficulty curve made physical, so
let the terrain say so: open grass and flowers in Zone 1, something more built-up and
deliberate in Zone 2, something that reads as infrastructure in Zone 3. The sprite contract
has walls, floors, roofs, windows, doors, crates, barrels, a server, a terminal and an anvil —
98 names, and you have all of them. Do not add art.

**Keep warm-toned decoration clear of flagship stations.** The flagship marker is `beehive`,
chosen in WP2 because it is the one strongly saturated warm shape in the set. On the demo map
it competed with `tree_orange`, `tree_orange_alt` and the flower tiles and lost some of its
punch. Give each flagship a few tiles of visual quiet — no orange trees, no flower tiles
adjacent. This is an authoring rule, not a test: check it by looking at the rendered map.

---

## 5. The six remaining stations

### 5.1 The content safety rule, restated because this section publishes to the open internet

No employer-internal process detail, system names, environment names or team names. No real
ticket keys, project keys or internal URLs. No participant, patient or genomic data of any
kind, real or realistic-looking. Invent a neutral domain if an example needs one. **If you are
unsure whether something crosses the line, leave it out and flag it in your summary.**

### 5.2 What to write

Follow the four-section shape and the seven-field receipt in `CLAUDE.md` section 7 exactly,
and match the voice of the existing three.

**Zone 2 — Intermediate. One file, holds state, imports and exports CSV or JSON.**

1. **Backlog Swipe** — `flagship: true`, `demo: { type: "placeholder" }`. Swipe to prioritise,
   but two people swipe the same items and the output is a **disagreement map** rather than a
   sorted list. Same coming-soon treatment as Choose Your Own Adventure.
2. **Requirements Linter** — flags passive voice, undefined actors, unquantified adjectives
   ("fast", "intuitive") and missing acceptance criteria, then emits GIVEN-WHEN-THEN
   skeletons.
3. **Interactive PRD** — the spec ships as a clickable prototype with the requirements as
   openable annotations. **Note the recursion in the copy**: the game they are playing is
   itself an example of this. Do not be coy about it; it is the best moment in Zone 2.

**Zone 3 — Advanced. Repo, tests, CI, containers, release cadence.**

4. **Linky** — `flagship: true`, `demo: { type: "external" }`, with `links` to the public
   Docker Hub image `edwinjclark/linky` and its GitHub repo. Describes the build chain: an
   editor with an AI agent, a Git repo, CI running tests on every push and rebuilding weekly
   for CVEs, a multi-architecture container image, and 145 automated tests. **The point the
   copy must land**: the AI wrote most of the code, but the decisions that mattered — keeping
   access tokens out of the browser, blocking server-side request forgery — were human ones
   that nothing prompted. That is the whole argument of the talk arriving in one station.
5. **Monty** — a single-file Monte Carlo delivery forecasting tool. No backend, no APIs, no
   data, and its output still underpinned a leadership-facing release estimate. Keep the
   organisation out of it entirely.
6. **Beyond the Map** — a short horizon tease (agents on a schedule, tool connections, tools
   that open their own pull requests) ending in **the call to action**: fork the repo, add
   your own station, open a pull request. Give the exact steps, and link to `CONTRIBUTING.md`
   **by its full GitHub URL**, not a relative path — a relative link to a `.md` file from a
   Pages site serves raw text rather than a rendered page.

### 5.3 Receipt honesty — read this twice

Seven of the nine stations describe things **nobody has built**. Every figure on those is an
estimate and must be marked: `"~400 (est.)"`, `"One evening (est.)"`. That is already the
house style in the existing three; follow it.

**Linky and Monty are different, and this is the trap.** They have actually been built, so
their receipts should carry real figures — **but you do not know what those figures are.**
The only Linky facts you have are the ones in section 5.2: 145 automated tests, a
multi-architecture image, CI on push, weekly CVE rebuilds. Everything else — build time, cost,
lines of code — you would be inventing.

So: **use the stated facts as facts, mark everything else `(est.)`, and list every estimated
field on Linky and Monty in your summary so the real numbers can be dropped in.** Do not
quietly guess a number for a thing that exists and has a true answer. `CLAUDE.md` section 7
explains the stakes: an audience that spots one invented number stops trusting the whole
difficulty curve, and that curve is the entire argument of the talk.

---

## 6. Zone plaques

One plaque per zone, at the zone's entrance, stating that zone's theme and level as given in
`CLAUDE.md` section 6.

**These are not decoration.** The gate question for a zone must be answerable from the
stations and plaque of that zone, so that someone working through the game alone — with no
live narration — can answer honestly rather than guessing. Read each gate question in
`src/content/gates.js` and make sure the answer is genuinely discoverable in the zone the
player is standing in. **If it is not, say so in your summary rather than quietly reshaping a
gate question to fit.**

---

## 7. `CONTRIBUTING.md`

You will have just added six stations, so you know exactly where the sharp edges are. Write
the guide you would have wanted.

- How to add a station: the one object, the fields, the tile rules, running `node --test`,
  and re-reading the content safety rule against your copy
- How to run it locally, and the `file://` trap
- What the validation test will reject and how to read its messages
- **The community backlog** — a seed list of station ideas people can pick up: Stakeholder
  Simulator, Onboarding Text Adventure, UAT Bug Bounty, Roadmap What-If, Pre-mortem
  Generator. One line each on what the idea is. That list is the point of the file: it turns
  "contributions welcome" into "here is something to do this evening."

---

## 8. The content validation suite

**`CLAUDE.md` calls this the highest-value test in the repo. It is what stops a contributor's
pull request breaking the live site.** Build it as `tests/content.test.js` over
`src/content/validate.js`.

Every rule below needs its own test asserting the message, and a matching test proving the
rule **fires on deliberately malformed content**. A validator nobody has seen fail is not a
validator.

**Definitions**

- Every station has all required fields, non-empty
- Every receipt has all seven fields, in `CLAUDE.md`'s order, none blank
- Station and gate and plaque `id`s are unique; every `zone` is 1, 2 or 3
- Exactly three stations per zone, and exactly one flagship per zone
- Exactly one plaque per zone
- `demo.type` is one of `placeholder`, `external`, `embedded`; an `external` station has at
  least one link; an `embedded` station fails, because it is not implemented
- Every gate has exactly one correct option, and at least three options
- Every referenced sprite name exists in the sprite contract

**Placement**

- Every station, gate and plaque tile is in bounds and not on a solid map tile
- **No two of them share a tile** — this is the case the `zones.js` WeakMap deliberately does
  not catch, and it belongs here
- Every station has at least one walkable adjacent tile, or it can never be opened

**The map, walked**

- **The barrier test, lifted from `tests/zones.test.js` onto the real map.** With gates
  locked, no tile of a later zone is reachable from spawn; unlocking each gate in turn opens
  exactly one more zone. WP2 wrote it to read zones out of the map rather than hardcoding
  three, so it should lift unchanged.
- **Reachability**: with its zone unlocked, every station, gate and plaque is reachable from
  spawn.
- **Walking distance**: within each zone, the shortest walking path between stations that are
  adjacent in the route is **at most 17 tiles**, measured by breadth-first search, not by
  straight-line distance. Report the actual distances in the failure message so whoever
  broke it can see which pair is too far apart.

---

## 9. Acceptance criteria

I verify every one of these by running the code, not by reading it.

- [ ] `node --test` passes; CI green on the branch
- [ ] The map is 92x20, three zones, and every zone looks visibly different from the others
- [ ] All nine stations open, each with four sections and a complete seven-field receipt
- [ ] The three flagships are distinguishable at a glance, with visual quiet around each
- [ ] All three plaques open and state their zone's theme and level, with no receipt
- [ ] Both gates block, nudge gently on a wrong answer, and unlock on the right one
- [ ] Every gate answer is discoverable in the zone the player is standing in
- [ ] Walking between adjacent stations takes under three seconds, and the test proves it
- [ ] Linky links out; both mini-game stations show a clean coming-soon state
- [ ] Every estimated figure is marked `(est.)`, and Linky's and Monty's estimates are listed
      in your summary for real numbers to replace
- [ ] The validation suite catches a deliberately malformed station, and every rule in
      section 8 has a test proving it fires
- [ ] 1280x800 renders the canvas at 3x, and no larger size lost a step
- [ ] `CONTRIBUTING.md` exists with the backlog
- [ ] No employer-identifiable content anywhere in the repo

---

## 10. When you are done

Push the branch. **Do not open a pull request and do not merge to `main`.** Write a summary
covering:

1. What you built and anything you could not get working
2. Any interface in section 3 you think is wrong, and why. WP1's session raised six and four
   were my errors; WP2's raised six and found a fail state I had not anticipated. This is the
   most useful thing you will write
3. **Every estimated figure on Linky and Monty**, listed so the real numbers can replace them
4. Whether each gate answer is genuinely discoverable in its zone, honestly assessed
5. Any copy you left out or softened because of the content safety rule
6. The walking distance between each adjacent pair of stations, as measured
