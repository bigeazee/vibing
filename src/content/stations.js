/**
 * THE STATIONS
 * ============
 *
 * One object per thing on the map you can walk up to and open. This file is the
 * whole of it: adding a station means adding an object here and changing nothing
 * else, ever. If you find yourself editing src/engine/ to add one, the data
 * model needs extending - the station is not special.
 *
 * Every station needs, in this order:
 *   problem   the pain it addresses, in plain language, no jargon
 *   build     a short description of the thing
 *   steps     three to five concrete steps
 *   prompt    an opening prompt the reader can copy and paste as-is
 *   receipt   the same seven fields, always, in the same order
 *
 * THE RECEIPT IS THE ARGUMENT. Its seven fields are what make the difficulty
 * curve legible as you walk left to right, so never drop one, never reorder them
 * and never add an eighth. Figures for things that have actually been built are
 * real. Anything not built yet is marked "(est.)" - the panel notices the marker
 * and says so on the card. An audience that spots one invented number stops
 * trusting the whole curve, and the curve is the entire argument of the talk.
 *
 * NOTHING HERE HAS BEEN BUILT YET. Every figure in every receipt below is an
 * estimate and is marked as one. When one of these gets built for real, replace
 * the estimate with what it actually took - including if that is embarrassing.
 *
 * This file is published on the open internet. Keep every example invented and
 * generic: no employer process detail, no system or team names, no real ticket
 * references, no data about anybody. See CLAUDE.md section 1.
 */

/**
 * Drawn on the tile directly above any station with `flagship: true`, so a
 * content author never has to remember to pick a different sprite to make a
 * flagship look like one.
 *
 * Why a beehive: it has to read as "this one" on green grass, at 16 pixels, on a
 * compressed video stream, from the back of a room. That rules out most of the
 * contract. It is transparent-backed, so it sits ON the grass rather than
 * punching a square out of it; it fills nearly the whole tile; it is the one
 * strongly saturated warm shape in the set, which is the furthest thing from
 * grass green a codec can hold on to; and its outline is unbroken, so it stays
 * a recognisable silhouette after compression.
 */
export const FLAGSHIP_MARKER_SPRITE = "beehive";

export const stations = [
  {
    id: "cyoa",
    zone: 1,
    flagship: true,
    title: "Choose Your Own Adventure",
    tile: { x: 7, y: 7 },
    sprite: "chest",

    problem:
      "Get eight people to agree on how a decision actually gets made and they will all nod. " +
      "Ask them to write it down and you get eight documents. Ask them in a survey and you get " +
      "eight answers to a question none of them was really asked, because a survey lets people " +
      "describe the process they wish they followed rather than the one they use. What you " +
      "actually want is to watch them walk through a real situation and see the exact point " +
      "where they part company.",

    build:
      "A branching scenario as a single web page you send as a link. The reader is dropped into " +
      "a situation — a request has landed, here is what you know, what do you do? — and every " +
      "choice opens the next situation. At the end they see the route they took and can copy it " +
      "back to you. Twelve to twenty situations is plenty. The endings are not the value. The " +
      "value is that three people who each insisted the process was obvious finish in three " +
      "different places, and now everyone can see it rather than argue about it.",

    steps: [
      "Pick one decision people genuinely argue about: how work gets prioritised, when " +
        "something counts as ready, who gets to say no. One decision, not a whole process.",
      "Write the opening situation and its first three choices in plain prose, before you open " +
        "the AI. This is the part only you can do, and it is the part that decides whether the " +
        "finished thing is worth anyone's time.",
      "Paste the prompt below into Claude along with your opening situation, and ask for one " +
        "self-contained HTML file.",
      "Play your own scenario end to end. Every path that dead-ends or quietly loops back is a " +
        "branch you have not thought through yet — go back and say what should happen there.",
      "Send the file, or put it on any free static host, and ask people to paste back the route " +
        "they took. Compare the routes in the next session.",
    ],

    prompt:
      "I want a branching \"choose your own adventure\" scenario as ONE self-contained HTML " +
      "file - no build step, no libraries, no external files - so it works whether someone " +
      "opens it directly or I put it on a static host.\n\n" +
      "Here is the opening situation and the first set of choices:\n" +
      "[paste yours here]\n\n" +
      "Rules:\n" +
      "- Every screen is one short situation (60 words or fewer) and two to four choices.\n" +
      "- Track the route the reader took and show it as a plain list at the end, with a button " +
      "that copies it to the clipboard.\n" +
      "- No score, no right answer, nothing that reads as losing. Different endings, all of " +
      "them defensible.\n" +
      "- Keep every piece of scenario text in one clearly marked block at the top of the file " +
      "so I can rewrite the wording without touching any code.\n\n" +
      "Ask me for the branches you still need and I will write them.",

    receipt: {
      buildTime: "One evening (est.)",
      tool: "Claude web, nothing installed",
      cost: "Free tier (est.)",
      lines: "~400 (est.)",
      dataTouched: "None. The scenario is invented.",
      skill: "Writing clear branches",
      hardestPart: "Deciding what the branches should be",
    },

    demo: { type: "placeholder" },
    links: [],
  },

  {
    id: "ambiguity-roulette",
    zone: 1,
    flagship: false,
    title: "Ambiguity Roulette",
    tile: { x: 4, y: 11 },
    sprite: "well",

    problem:
      "A sentence in a requirement is perfectly clear to the person who wrote it. That is the " +
      "problem. Clarity is a feeling, and the feeling does not survive being read by somebody " +
      "else. You find out at the demo, when what arrives is a completely defensible reading of " +
      "what you wrote and not the one you meant.",

    build:
      "A page you paste one requirement sentence into. It shows four different readings of that " +
      "sentence side by side — each one straight-faced, each one something a reasonable person " +
      "could build — and lets the room vote for the one they thought it said. At this level the " +
      "readings are ones you generated in the chat and pasted in by hand, which is exactly the " +
      "right amount of machinery. When the vote splits, you have found the sentence to rewrite, " +
      "and you found it before anybody built anything.",

    steps: [
      "Collect five or six real sentences from your own recent tickets — the kind of line that " +
        "seemed obvious the moment you wrote it.",
      "Paste the prompt below into Claude and ask it for a single HTML file. Then ask it, " +
        "separately, for four readings of your first sentence, and paste those in.",
      "Run it on the sentence you are most certain is unambiguous. That is the useful test: if " +
        "the four readings really do all agree, you have a baseline for what good looks like.",
      "Use it live in the next refinement session. The disagreement is the output — the page is " +
        "only what makes it visible.",
    ],

    prompt:
      "Build me a single-page tool as ONE self-contained HTML file - no libraries, no build " +
      "step, no network calls of any kind.\n\n" +
      "Layout:\n" +
      "- A box at the top showing the requirement sentence being discussed.\n" +
      "- Below it, four numbered readings of that sentence, side by side, in large readable " +
      "type. These are plain text I will fill in by hand.\n" +
      "- Under each reading, a vote button, and a running tally that stays visible so a group " +
      "can vote out loud and watch the count.\n" +
      "- A reset button that clears the tally but keeps the readings.\n\n" +
      "Put the sentence and the four readings in one clearly marked block at the top of the " +
      "file, and show me exactly where to paste new ones. Make it readable on a shared screen: " +
      "big type, high contrast, no decoration.",

    receipt: {
      buildTime: "An afternoon (est.)",
      tool: "Claude web, nothing installed",
      cost: "Free tier (est.)",
      lines: "~150 (est.)",
      dataTouched: "None. Use invented sentences, never anything confidential.",
      skill: "Choosing sentences worth testing",
      hardestPart: "Accepting that all four readings are fair",
    },

    demo: { type: "placeholder" },
    links: [],
  },

  {
    id: "meeting-cost-meter",
    zone: 1,
    flagship: false,
    title: "Meeting Cost Meter",
    tile: { x: 10, y: 11 },
    sprite: "terminal",

    problem:
      "Everybody already knows the standing meeting is too big and too long. Nobody can feel " +
      "it. \"Fourteen people, an hour a week\" is an abstraction, and abstractions do not change " +
      "anyone's behaviour. A number climbing on a shared screen is not an abstraction.",

    build:
      "One page. You type in how many people are in the room and a rough average hourly cost, " +
      "press start, and a large number ticks upward in real time. That is the entire thing.\n\n" +
      "This is the smallest station in the game and it is here on purpose. It is an hour's " +
      "work, it stores nothing, it does one multiplication on a timer — and it will get a " +
      "bigger reaction in a room than plenty of things that took a quarter. That gap is the " +
      "point. The floor of what you can build for yourself is now much lower than most people " +
      "assume, which makes \"could I build this?\" the boring question. The interesting one is " +
      "whether it is worth building at all.",

    steps: [
      "Decide the two numbers you are comfortable putting on a screen: a headcount, and a " +
        "rough blended hourly cost. Round them hard. Nobody's actual salary belongs in this.",
      "Paste the prompt below into Claude and ask for one HTML file.",
      "Open it. If the number climbs, you are finished. Resist adding features to it.",
      "Run it once, at the start of a meeting that deserves it. Then decide whether to keep it " +
        "or whether you have already made the point.",
    ],

    prompt:
      "Make me ONE self-contained HTML file - no libraries, no build step - that shows a " +
      "running cost meter for a meeting.\n\n" +
      "Two inputs at the top: number of people, and average cost per person per hour. Then " +
      "start, pause and reset buttons.\n\n" +
      "While it is running, show one very large number: the total cost so far, updating about " +
      "four times a second, formatted as currency. Underneath, in much smaller type, the " +
      "elapsed time.\n\n" +
      "It will be on a shared screen, so the big number has to be readable from the back of a " +
      "room: huge type, dark background, high contrast, and nothing else on the page competing " +
      "with it.",

    receipt: {
      buildTime: "About an hour (est.)",
      tool: "Claude web, nothing installed",
      cost: "Free tier (est.)",
      lines: "~80 (est.)",
      dataTouched: "None. Two numbers you type in, held only in the page.",
      skill: "Rounding a number until it is safe to show",
      hardestPart: "Not adding features to it",
    },

    demo: { type: "placeholder" },
    links: [],
  },
];
