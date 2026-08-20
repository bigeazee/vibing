/**
 * THE ZONE PLAQUES
 * ================
 *
 * One readable board at the entrance to each zone, saying what the zone is and
 * what level of effort it represents.
 *
 * THESE ARE NOT DECORATION. The gate at the end of a zone asks a question whose
 * answer has to be findable in that zone, so that somebody playing this alone -
 * with nobody narrating over the top of it - can answer honestly instead of
 * guessing. The stations carry most of that, but a station is about one idea.
 * The plaque is the only place a zone gets to state its own point, and both
 * gate answers currently live in a plaque body. If you rewrite one of these,
 * re-read src/content/gates.js and check the answer is still there.
 *
 * A plaque is not a station. It has no four sections, no steps, no prompt and
 * NO RECEIPT - there is nothing to put on one, and a receipt with invented
 * figures on it is the fastest way to lose an audience. panel.openPlaque()
 * renders exactly the three fields below.
 *
 * Plaques are solid, like stations: you stand next to one, never on it. They do
 * not count towards the visited-stations total, which is stations only.
 *
 * This file is published on the open internet. See CLAUDE.md section 1.
 */

export const plaques = [
  {
    zone: 1,
    tile: { x: 5, y: 8 },
    sprite: "plaque",
    title: "Zone 1 — Beginner",
    level: "Claude web, no install, an evening's work",
    body:
      "Everything in this zone is one conversation and one HTML file: you describe what you " +
      "want, you get a page back, and you send somebody the link. Nothing is installed, " +
      "nothing is stored, and there is no repository to look after.\n\n" +
      "The AI answering you here is the same one behind the last zone of this map. What " +
      "changes as you walk east is the discipline you wrap around it.",
  },

  {
    zone: 2,
    tile: { x: 34, y: 8 },
    sprite: "plaque",
    title: "Zone 2 — Intermediate",
    level: "One file, holds state, imports and exports CSV or JSON",
    body:
      "The tools here remember things. They hold on to what you did between clicks, take a " +
      "CSV or a JSON file in, and give you one back — which is what makes them useful to " +
      "somebody who is not you.\n\n" +
      "Writing them still takes minutes. Your evening goes somewhere else entirely: deciding " +
      "what the thing should do, and checking that what came back actually does it. That " +
      "shift is the whole of this level, and it only gets sharper further east.",
  },

  {
    zone: 3,
    tile: { x: 65, y: 8 },
    sprite: "plaque",
    title: "Zone 3 — Advanced",
    level: "Repo, tests, CI, containers, release cadence",
    body:
      "Everything here lives in a repository, with tests that run on every push, an image " +
      "anybody can pull, and a release you could put a date against. This is ordinary " +
      "software engineering, and none of it is optional once other people depend on the " +
      "thing.\n\n" +
      "The AI still writes most of the code. The judgement about what is safe to ship is " +
      "still yours, and nothing prompts you for it.",
  },
];

/**
 * A stable identifier for a plaque.
 *
 * Plaques are identified by zone rather than by an `id` field: there is exactly
 * one per zone, so the zone already is the identity, and an id would be a
 * second thing to keep unique for no gain. Error messages and the collision
 * layer still need something to call them, and this is it.
 *
 * @param {{zone: number}} plaque
 * @returns {string}
 */
export function plaqueId(plaque) {
  return `plaque-zone-${plaque && plaque.zone}`;
}
