/**
 * THE GATES
 * =========
 *
 * One question between each pair of zones. Answer it and the door opens.
 *
 * The rule that gives the mechanic its point: the answer must be discoverable in
 * the stations and the plaque of the zone the player is standing in. Nobody
 * should have to guess, and nobody should be able to skip a zone's content by
 * guessing. If you rewrite a question, check that the zone behind it still
 * answers it.
 *
 * There is no failure here. A wrong answer shows `nudge` and lets the player try
 * again immediately, as many times as they like. There is no counter, no
 * penalty, and nothing that reads as losing - see CLAUDE.md, "No fail states".
 *
 * `sprite` is the locked door on the map and `spriteUnlocked` replaces it the
 * moment the question is answered, so the map itself carries the record of how
 * far the player has got.
 */

export const gates = [
  {
    id: "gate-1-2",
    fromZone: 1,
    toZone: 2,
    tile: { x: 30, y: 10 },
    sprite: "door_wood",
    spriteUnlocked: "door_wood_open",
    question: "What actually changes as you move up the levels of AI-assisted building?",
    options: [
      { text: "The AI model gets more powerful", correct: false },
      { text: "The discipline you wrap around it", correct: true },
      { text: "The programming language you use", correct: false },
      { text: "How much you have to type", correct: false },
    ],
    nudge: "Not quite — the answer is somewhere in this zone.",
  },

  {
    id: "gate-2-3",
    fromZone: 2,
    toZone: 3,
    tile: { x: 61, y: 10 },
    sprite: "door_wood",
    spriteUnlocked: "door_wood_open",
    question: "In a mature AI-assisted project, where does most of the human effort go?",
    options: [
      { text: "Writing the code", correct: false },
      { text: "Reviewing, testing and deciding", correct: true },
      { text: "Writing longer prompts", correct: false },
      { text: "Choosing the right model", correct: false },
    ],
    nudge: "Not quite — the answer is somewhere in this zone.",
  },
];
