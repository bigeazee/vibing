# Contributing to Vibing

The whole point of this repository is that you can fork it, add a station
describing something you would build, and open a pull request — without knowing
JavaScript, without installing anything, and without a build step.

A station is **one object in one file**. That is the entire contribution.

---

## Run it locally first

Vibing uses native ES modules, and browsers refuse to load those over the
`file://` protocol.

**Double-clicking `index.html` will not work.** You get a blank page and a CORS
error in the console, and nothing about the error tells you that the fix is
"serve it over HTTP". This is the single thing that wastes people's first hour,
so it is the first thing in this guide.

Serve the folder instead, from the repository root:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static file server does the same job —
`npx serve`, `php -S localhost:8000`, whatever you already have. There is
nothing to install and nothing to build.

To run the tests you need Node 18 or newer:

```
node --test
```

No `npm install`. There are no dependencies, and the tests use `node:test`,
which is built into Node. If you ever find yourself adding a package to run the
tests, something has gone wrong.

---

## Add a station

### 1. Open `src/content/stations.js`

Every station you walked past in the game is one object in the `stations` array
in that file. Nothing else in the repository needs to change — not the engine,
not the map, not the UI. If you find yourself editing `src/engine/`, stop:
either there is a simpler way to say what you want, or the data model needs
extending, and that is worth raising as an issue first.

### 2. Copy the station closest to what you want to say

Then change it. Here is the shape, with every field that matters:

```js
{
  id: "your-station",          // unique, lower case, hyphens
  zone: 2,                     // 1, 2 or 3
  flagship: false,             // exactly one flagship per zone, and they are taken
  title: "Your Station",
  tile: { x: 44, y: 12 },      // see "Where to put it" below
  sprite: "book",              // a name from src/content/sprites.js

  problem: "...",              // the PM pain, in plain language, no jargon
  build: "...",                // a short description of the thing
  steps: ["...", "...", "..."],// three to five concrete steps
  prompt: "Copy-paste starter prompt goes here",

  receipt: {                   // all seven, always, in this order
    buildTime: "An evening (est.)",
    tool: "Claude web, nothing installed",
    cost: "Free tier (est.)",
    lines: "~300 (est.)",
    dataTouched: "None. The example is invented.",
    skill: "...",
    hardestPart: "...",
  },

  demo: { type: "placeholder" },
  links: [],
}
```

`demo.type` has three honest states, and picking the wrong one overstates what
exists:

| Use | When |
|---|---|
| `{ type: "placeholder" }` | Nothing is built yet. The panel says "Playable demo coming soon." |
| `{ type: "external" }` with `links` | It is built and somebody can go and look at it. |
| `{ type: "external" }` with `links: []` | It is built, but there is nowhere public to point at. The panel says "No demo linked for this one yet." |

`{ type: "embedded" }` is not implemented and the validation suite rejects it.

### 3. Fill in all four sections and all seven receipt fields

Every station panel has the same four sections in the same order — **the
problem**, **what you'd build**, **get started**, **the receipt** — because the
consistency is what lets somebody compare a zone 1 station with a zone 3 one and
see the difficulty curve. Do not add a fifth section, and do not leave one thin.

**The receipt is the most important element in the game.** Seven fields, always,
in the same order, never an eighth. The validation suite enforces that.

### 4. Mark every figure you did not measure

Anything you have not actually built and timed is an estimate, and it says so:

```js
buildTime: "An evening (est.)",
lines: "~300 (est.)",
```

This convention is the reason anybody believes the figures that are *not*
marked. If you know a fact, state it as a fact; if you do not, mark it. If a
thing exists but you never counted the lines, **write `"Not counted (est.)"` —
do not put a plausible number there.** An audience that spots one invented
figure stops trusting the whole curve, and the curve is the argument.

### 5. Re-read the content safety rule against your copy

**This site is public on the open internet.** Before you open the pull request,
read your own words back with this list in hand:

- No employer-internal process detail, system names, environment names or team
  names
- No real ticket keys, project keys or internal URLs
- No participant, customer or personal data of any kind, real or
  realistic-looking
- Invent a neutral domain if your example needs one

If you are unsure whether something crosses the line, leave it out and say so in
the pull request. Nobody will mind.

### 6. Run the tests

```
node --test
```

Fix anything the content validation suite reports, and open your pull request.

---

## Where to put it

The `tile` is where your station stands on the map in `src/content/map.js`, and
four rules apply. All four are checked by the tests, so you will not break the
site by getting one wrong — but knowing them saves a round trip.

1. **It has to be walkable ground.** Stations are made solid at boot, so you
   stand *next* to one rather than on it. The tile itself must be plain ground
   in the map's ASCII grid — grass (`.`), the gravel plaza (`%`), the zone 3
   decking (`_`) — not a tree, a wall or a fence.
2. **Nothing else can be on it.** No other station, no gate, no plaque.
3. **It needs a walkable neighbour**, or nobody can stand next to it to press E.
4. **It has to be close to its neighbours.** Within a zone, stations are walked
   between in order from west to east, and no two stations that follow one
   another may be more than **17 tiles apart on foot** — measured by walking the
   map, not in a straight line. Ten to fourteen is the target. The talk is
   narrated live while moving, and dead air spent crossing scenery is the main
   way this format fails in front of an audience.

If your station is a flagship, the tile **directly above it** also needs to be
clear: that is where the beehive marker is drawn.

Sprites come from `src/content/sprites.js` and nowhere else. Use a name from
`SPRITES`; if the tile you want has no name, add one — that is a one-line change
and always the right move. The scenery on the map deliberately avoids every
sprite a station uses, so that a crate on the ground is never mistaken for
something you can open. Please keep it that way.

---

## What the validation suite will reject, and how to read it

`node --test` runs `tests/content.test.js`, which is the test that stops a pull
request breaking the live site. It collects **every** problem it finds and
prints them all, so you never have to fix one thing at a time.

Each message tells you which thing is wrong and where to look. There are two
kinds, and they read differently on purpose:

**A fault in something you defined** names the thing by its id:

```
Station "backlog-swipe" has receipt fields [buildTime, tool, cost, lines] but
every receipt has exactly these seven, in this order: buildTime, tool, cost,
lines, dataTouched, skill, hardestPart. Never omit one, never reorder them,
never add an eighth.
```

**A fault in the map grid** names the row, the column and the character:

```
parseMap: map row 6, column 12 (tile x=12, y=6): character "Z" has no entry in
the legend.
```

The rules it enforces:

| It rejects | Because |
|---|---|
| A missing or empty station field | Every panel has all four sections |
| A receipt that is missing a field, has an eighth, or is in a different order | The receipt is the argument, and it only works if it is identical everywhere |
| A blank receipt value | Say "Not counted (est.)" rather than nothing |
| Fewer than three or more than five steps | Fewer and nobody can follow it, more and nobody reads it |
| A duplicate `id` | Progress is saved against ids |
| A zone that is not 1, 2 or 3 | There are three zones |
| A zone with more or fewer than three stations | The zones have to be the same size for the curve to read |
| A zone with more or fewer than one flagship | One per zone gets talked through live |
| A zone with more or fewer than one plaque | The plaque is what makes that zone's gate answer findable |
| `demo.type` that is not `placeholder` or `external` | `embedded` is not implemented yet |
| A sprite name that is not in `sprites.js` | A typo would be a hole in the live site |
| A tile off the map, or on a solid tile | You could never reach it |
| Two things on the same tile | Only the first one could ever be opened |
| A station walled in on all four sides | Nobody could stand next to it |
| A gate without exactly one correct answer | Nobody could pass it, or everybody could |
| A hole in a zone barrier | Somebody could skip a whole zone's content |
| Adjacent stations more than 17 tiles apart | Dead air in the middle of a talk |

---

## The community backlog

Ideas nobody has picked up yet. Take one, change it beyond recognition, or
ignore all of them and write your own — they are here so that "contributions
welcome" turns into "here is something to do this evening".

- **Stakeholder Simulator** — a page that answers your draft update in the voice
  of four different stakeholders, so you find the question you were going to get
  asked before the meeting rather than during it.
- **Onboarding Text Adventure** — the first week as a playable scenario. New
  joiners find the gaps in your documentation by walking into them, and every
  dead end they hit is a page somebody needs to write.
- **UAT Bug Bounty** — a lightweight board where testers log what they found,
  vote on severity, and see the count climb. All the reporting, none of the
  workflow.
- **Roadmap What-If** — drag a delivery date and watch everything downstream
  move, so a conversation about one slip stops being a conversation about one
  slip.
- **Pre-mortem Generator** — describe what you are about to ship and get twenty
  ways it could go wrong, ranked by how boring they are. The boring ones are the
  ones that actually happen.

---

## House rules for pull requests

These are constraints, not preferences, and a pull request that breaks one will
be asked to change:

- **No build step.** Vanilla JavaScript, native ES modules, served as-is.
- **No framework and no dependencies.** No React, no bundler, no TypeScript, and
  nothing that ships to the browser from `npm`.
- **Client-side only.** No backend, no API calls, no fetch to anybody.
- **No tracking.** No analytics, no telemetry, no cookies, no measurement.
- **No proprietary art, music or character names.** The art is Kenney, CC0 — see
  `CREDITS.md`. If you add art from anywhere else, check its licence and update
  that file.
- **No fail states.** No timers, no lives, no score, and no way to lose. A wrong
  answer at a gate gets a gentle nudge and an immediate retry, for ever.

Keep the tone of your copy plain. The reader is a product manager, not an
engineer, and the fastest way to lose them is a sentence that assumes they
already know what you are talking about.
