# Work Package 4 — Release

**Branch:** create `wp4-release` from `main`.

**Status when you start:** the game is content-complete and merged. Nine stations, three
plaques, two gates, a 92x20 three-zone map, 130 passing tests including a content validation
suite. It has never been deployed. **This is the last build package.**

---

## 0. Read this first

**Read `CLAUDE.md` in full.** Then play the game — serve it with `python3 -m http.server 8000`
and walk all three zones, open all nine stations, answer both gates. You are about to make
the changes that decide what an audience sees, so see it first.

The constraint that governs this package specifically:

> **No build step.** Vanilla JavaScript, native ES modules, served directly. A beginner must
> be able to fork the repo, edit one file, and see the change.

Section 4 asks you to change the deploy workflow. Read the reasoning there carefully — it is a
deliberate reading of that rule, not an exception to it.

---

## 1. What this package delivers

A deployed, public, presentable game. Four code corrections carried from the WP3 review, one
visual fix, the deployment tidy-up, a favicon, and the final README.

**In scope:** sections 2 to 6.

**Explicitly NOT in scope:**

- Embedded mini-games. Both flagship placeholders stay placeholders.
- New stations, new map content, or rewriting existing copy. The content is signed off.
- Anything you think would be nice. This is a release package; the game is finished. If you
  spot something worth doing, put it in your summary rather than in the diff.

---

## 2. Four corrections carried from the WP3 review

Each of these was raised by the session that built WP3 and each is a real fault in an
interface I specified.

**2.1 `demo.type` has no honest state for a built thing with nothing to show.**

Monty exists but has no public URL. `placeholder` renders "Playable demo coming soon", which
promises something that is not coming. `external` currently requires at least one link.

Fix: let `external` with zero links render the panel's existing "No demo linked for this one
yet" state, and relax the validation rule in `src/content/validate.js` accordingly — an
`external` station with no links becomes legal. Then set Monty to `demo: { type: "external",
links: [] }`. Update the rule's test to match, and add one proving the new state renders.

**2.2 `markStationsSolid` is doing a job it is not named for.**

Plaques are solid, but the only way to make anything solid is a function named for stations
that requires an `id` plaques do not have, so `main.js` builds a `plaqueBlockers` array to
bridge it. That is content-shaped logic in the boot module, which `CLAUDE.md` says should be
wiring only.

Fix: rename to `markSolid(grid, items, kind)` in `src/engine/zones.js`, where `kind` is the
noun used in error messages ("station", "plaque"). Accept items identified by `id` **or** by
zone, so plaques pass through unmodified. Delete `plaqueBlockers` from `main.js`. Update
`tests/zones.test.js`.

**2.3 The panel's `onClose` and the quiz's `onClose` are different mechanisms.**

`panel.onClose(handler)` is a registration that fires on every close for the life of the
panel. `quiz.open(gate, { onPass, onClose })` is per-open. I specified "matches the panel"
without noticing they do not match, so `main.js` wires the same idea two different ways.

Fix: make the quiz match the panel — `quiz.onClose(handler)`, registered once at boot, with
`open(gate, { onPass })` keeping only `onPass`. Update `main.js`.

**2.4 Zone 2's central band is a dense uniform grid of one tile.**

It differentiates the zone, but a large field of high-frequency repeating texture is exactly
what a video codec handles worst. It will shimmer over a compressed Teams stream, which is
the failure `CLAUDE.md` section 3 exists to prevent.

Fix: break it up. Vary the terrain, cut it with paved routes, or swap to a calmer base and
use the busy tile as an accent. **Render the map and look at it before and after** — this is a
judgement call about how it reads, not a rule you can satisfy mechanically. Keep the zone
visually distinct from Zones 1 and 3, and keep the flagship clearance rule: no warm-toned
decoration within two tiles of a flagship marker.

---

## 3. A favicon

The site's only 404 is `/favicon.ico`. This is a game people open from a link in a chat
window, so it gets a browser tab, and an empty tab icon looks unfinished.

Add one that needs no network request: either an inline `data:` URI, or a small PNG cropped
from the Kenney atlas — the player sprite is the obvious choice and it is already CC0 and
already credited. No external hosts, no new dependencies.

---

## 4. The deploy uploads the whole repository

`.github/workflows/pages.yml` uploads `path: "."`, so `CLAUDE.md`, `docs/work-packages/`,
`tests/` and `package.json` are all served from the game's domain. The repository is public,
so nothing here is newly exposed — this is tidiness, not a leak.

Fix by **removing non-site files from the checkout before the upload**, not by staging a
copy of the site:

```yaml
- name: Trim non-site files from the artifact
  run: rm -rf docs tests .github CLAUDE.md package.json
```

**Why that way round.** Listing what to *include* means a contributor who adds a new
directory of site assets gets a silently broken site — the missing thing is invisible until
someone reports it. Listing what to *exclude* means the same contributor gets a slightly
untidy site — the extra thing is visible and harmless. Choose the failure mode you can see.

**Why this is not a build step.** Nothing is transformed. Every file served is byte-identical
to the file in the repository, and fork-edit-push-deploy still works with no tooling. The
no-build-step rule exists so a beginner can change one file and see the change; deleting
files that were never part of the site does not touch that.

The checkout is disposable, so nothing is deleted from the repository.

---

## 5. README

The final pass. It is the first thing anyone forking this reads.

- What Vibing is, in three sentences
- **The live URL**, once you know it: `https://bigeazee.github.io/vibing/`
- How to play: arrow keys or WASD, `E` to open, `Esc` to close
- How to run it locally, and the `file://` trap
- The desktop-keyboard-only limitation, stated plainly
- A link to `CONTRIBUTING.md` for adding a station
- Credit to Kenney, linking `CREDITS.md`

Drop anything that describes the project as a work in progress. It is finished.

---

## 6. What you cannot verify, and must not claim

**The live deploy only runs on push to `main`, which happens after this branch is merged.**
You cannot see the deployed site, so do not report the deployment as working. Say plainly
that it is untested from where you are sitting.

Same for Edge and Firefox: unless they are installed in your environment, you have not tested
them. Chromium covers Chrome and Edge's engine, which is worth stating, but it is not the
same as having run it.

---

## 7. Acceptance criteria

- [ ] `node --test` passes; CI green on the branch
- [ ] Monty's panel shows an honest state — not "coming soon", not a broken link
- [ ] `markSolid` is named for what it does, and `plaqueBlockers` is gone from `main.js`
- [ ] The quiz and the panel expose `onClose` the same way
- [ ] Zone 2 no longer reads as one repeating texture, and is still visibly its own place
- [ ] All three flagship markers still have two tiles of visual quiet
- [ ] The favicon loads with no network request and the site has no 404s
- [ ] The Pages artifact contains the game and not the repository's working files
- [ ] The README describes a finished thing and carries the live URL
- [ ] All nine stations, three plaques and both gates still work end to end after your changes
- [ ] Walking distances are unchanged — re-run the distance test, do not assume

---

## 8. When you are done

Push the branch. **Do not open a pull request and do not merge to `main`.** Write a summary
covering:

1. What you changed, and what you verified by running it
2. Anything in section 2 you think is still wrong after seeing the code
3. What Zone 2 looks like now, and what you tried that did not work
4. Anything you noticed while playing the whole game that you were not asked to fix —
   this is your last chance to raise it, and it is the most valuable part of this summary
5. A plain statement of what you did not test
