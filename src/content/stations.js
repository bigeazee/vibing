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
 * SEVEN OF THE NINE HAVE NOT BEEN BUILT. Every figure on those is an estimate
 * and is marked as one. When one of them gets built for real, replace the
 * estimate with what it actually took - including if that is embarrassing.
 *
 * Linky and Monty HAVE been built, and that makes them the dangerous ones. Use
 * the facts that are known and mark everything else "(est.)" - a number nobody
 * measured is a guess even when the thing it describes is real, and a guess
 * dressed as a measurement on the two stations that exist would undo the other
 * seven. "Not counted (est.)" is a perfectly good receipt entry. An invented
 * line count is not.
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
    tile: { x: 10, y: 8 },
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
    tile: { x: 19, y: 12 },
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
    tile: { x: 27, y: 8 },
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

  // ------------------------------------------------------------------ zone 2
  // Intermediate. One file, but it holds state between clicks and it can take a
  // CSV or a JSON file in and give you one back.

  {
    id: "backlog-swipe",
    zone: 2,
    flagship: true,
    title: "Backlog Swipe",
    tile: { x: 40, y: 8 },
    sprite: "table",

    problem:
      "Prioritisation meetings end in agreement, because agreeing is how meetings end. Everyone " +
      "nods at the ordered list, and then over the next fortnight three people quietly work on " +
      "the things they personally thought mattered. Nobody lied and nobody went rogue. The list " +
      "was one ordering imposed on a room that never actually shared one, and the moment it left " +
      "the meeting it stopped describing anybody's real view — including yours.",

    build:
      "A page that shows one backlog item at a time and asks a single question: does this matter " +
      "more than the last thing you saw? You swipe left or right, thirty or forty times, in " +
      "about four minutes. That much is a familiar toy.\n\n" +
      "The part worth building is what happens when two people do it. Instead of averaging their " +
      "answers into one sorted list, it lays the two sets of swipes side by side and shows only " +
      "the items they disagreed about, biggest gap first. The output is a disagreement map. A " +
      "sorted list tells you what to do next and hides the argument; the disagreement map is the " +
      "argument, and it fits on one screen. Half the rows on it will be items whose titles were " +
      "too vague to judge, which is a finding you get for free.",

    steps: [
      "Export twenty to forty backlog items as a CSV with two columns: an id and a one-line " +
        "title. Any more than forty and people stop reading and start swiping to get to the end.",
      "Paste the prompt below into Claude and ask for one self-contained HTML file. Load your " +
        "CSV and swipe it yourself first — you will immediately find the titles nobody could " +
        "judge in four seconds.",
      "Get a second person to swipe the same file, and have them export their result as JSON at " +
        "the end. Two people is enough. Six people is a research project.",
      "Load both results back in and open the disagreement screen. Take the top three rows into " +
        "your next refinement session and ask each person to say out loud why they swiped that " +
        "way. That conversation is the entire point of the tool.",
    ],

    prompt:
      "Build me a single-page prioritisation tool as ONE self-contained HTML file - no " +
      "libraries, no build step, no network calls of any kind.\n\n" +
      "Loading in:\n" +
      "- A file picker that accepts a CSV with two columns, id and title, and a header row.\n" +
      "- Also accept a previously exported JSON result file, so I can reload a session.\n\n" +
      "Swiping:\n" +
      "- Show ONE item at a time, in large type, with two big buttons: \"more important\" and " +
      "\"less important\". Left and right arrow keys do the same thing.\n" +
      "- Keep a running order using the comparisons so far, and show progress as \"12 of 30\".\n" +
      "- Let me stop half way and come back: keep the state in local storage.\n\n" +
      "The output:\n" +
      "- Export my answers as a JSON file with a name I can recognise.\n" +
      "- Then let me load TWO exported files and show a comparison screen listing ONLY the items " +
      "the two people ranked differently, sorted by the size of the gap, biggest first.\n" +
      "- No combined score and no merged list. Do not resolve the disagreement - display it.\n\n" +
      "It gets shown on a shared screen, so use big type and high contrast, and put every piece " +
      "of visible wording in one clearly marked block at the top of the file.",

    receipt: {
      buildTime: "Two evenings (est.)",
      tool: "Claude web, nothing installed",
      cost: "Free tier (est.)",
      lines: "~600 (est.)",
      dataTouched: "Backlog titles you paste in, held only in the page. Demo it with invented ones.",
      skill: "Writing titles somebody can judge in four seconds",
      hardestPart: "Not turning the disagreement back into a single sorted list",
    },

    demo: { type: "placeholder" },
    links: [],
  },

  {
    id: "requirements-linter",
    zone: 2,
    flagship: false,
    title: "Requirements Linter",
    tile: { x: 50, y: 12 },
    sprite: "book",

    problem:
      "A requirement can be wrong in a way that reading it will never catch, because the reader " +
      "supplies the missing half without noticing they did it. \"The system should notify the " +
      "user quickly\" has no actor, no trigger, no definition of quickly and no way to tell " +
      "whether it has been met. You read it and your brain quietly fills in a reasonable answer " +
      "for all four. So does everybody else, and each of them fills in something slightly " +
      "different.",

    build:
      "A page you paste a requirement into that marks up what is missing rather than judging " +
      "whether it is good. Passive voice, so you can see where the actor went. Adjectives with " +
      "no number behind them — fast, intuitive, seamless, robust. Sentences with no acceptance " +
      "criteria attached at all.\n\n" +
      "Underneath, it drafts GIVEN-WHEN-THEN skeletons from what it can work out and leaves " +
      "blanks where it cannot. The blanks are the useful part: each one is a decision nobody has " +
      "made yet, sitting in the open instead of inside somebody's head. It keeps your own list " +
      "of banned words between visits, so the vocabulary your team keeps arguing about is the " +
      "vocabulary it checks.",

    steps: [
      "Write down the six words your team keeps arguing about after the fact. Those are your " +
        "rules. Everybody's six are different, and yours are the ones worth checking for.",
      "Paste the prompt below into Claude and ask for one self-contained HTML file that keeps " +
        "its rule list in local storage, so your list survives a reload.",
      "Run it over three requirements you have already delivered, including the one that went " +
        "wrong. If it flags nothing on that one, your rule list is missing the rule that would " +
        "have caught it — add it and run it again.",
      "Use it in the room during refinement rather than mailing the output round. The flags are " +
        "conversation starters, and they read as an accusation the moment they arrive by email.",
    ],

    prompt:
      "Build me a requirements checker as ONE self-contained HTML file - no libraries, no build " +
      "step, no network calls of any kind.\n\n" +
      "A big text box at the top where I paste one requirement. Below it, a report with four " +
      "sections, each listing the exact phrases it found:\n" +
      "1. Passive voice, or any sentence where you cannot tell who does the thing.\n" +
      "2. Adjectives and adverbs with no number behind them - fast, quick, intuitive, seamless, " +
      "robust, simple, and anything else in my own list.\n" +
      "3. Words that hide a decision: should, may, appropriate, as needed, where possible.\n" +
      "4. Anything that reads like a requirement but has no acceptance criteria.\n\n" +
      "Underneath the report, draft GIVEN-WHEN-THEN skeletons from whatever you could work out, " +
      "and put a visible [BLANK] wherever you could not. Do not invent the blanks.\n\n" +
      "Let me add and remove my own flagged words, and keep that list in local storage so it is " +
      "still there tomorrow. Let me export the list as JSON and load one back in, so I can share " +
      "it with the rest of my team.\n\n" +
      "Report, never grade. No score, no percentage, no traffic lights. Big type, high contrast: " +
      "this goes on a shared screen.",

    receipt: {
      buildTime: "An evening (est.)",
      tool: "Claude web, nothing installed",
      cost: "Free tier (est.)",
      lines: "~350 (est.)",
      dataTouched: "Whatever you paste, in the page only. Never paste anything confidential into a page you have not read.",
      skill: "Knowing which vague words actually cause trouble",
      hardestPart: "Keeping it descriptive instead of letting it grade people",
    },

    demo: { type: "placeholder" },
    links: [],
  },

  {
    id: "interactive-prd",
    zone: 2,
    flagship: false,
    title: "Interactive PRD",
    tile: { x: 58, y: 8 },
    sprite: "chest_wood",

    problem:
      "The twelve-page specification gets read once, properly, by two people, on the day it goes " +
      "out. Everybody else skims the headings, builds a picture in their head and works from the " +
      "picture. Six weeks later the document and the thing being built have drifted apart, and " +
      "there is no moment where anyone notices, because the drift is made of small, individually " +
      "reasonable decisions that were never written down anywhere.",

    build:
      "The spec ships as the prototype. Instead of a document describing screens, you send a " +
      "clickable set of screens with the requirements attached to them: click a field and the " +
      "rule for that field opens beside it; click a button and you see what it does, including " +
      "what happens when it fails. Nobody has to read twelve pages, because the twelve pages are " +
      "wherever the reader is standing.\n\n" +
      "You are inside one of these right now. This is a talk with its argument attached to the " +
      "objects: you walked up to a thing, pressed a key, and got the reasoning for that thing " +
      "rather than for all nine of them. If that feels like a stunt, notice how much further " +
      "into the argument you are than you would be at slide four of a deck.",

    steps: [
      "Pick one screen or one flow. Not a product. The first one exists to prove to yourself " +
        "that the format works.",
      "Write the screen out in plain prose first — what is on it, what each control does, what " +
        "happens when something goes wrong. That prose is your requirements. It just ends up " +
        "attached to the controls instead of in a numbered list.",
      "Paste the prompt below into Claude and ask for one self-contained HTML file with every " +
        "annotation in a single JSON block at the top, so you can rewrite a rule without going " +
        "anywhere near the prototype.",
      "Send the link instead of the document, and ask people to open the three annotations they " +
        "disagree with. You will get more specific feedback in a day than the document got in " +
        "three weeks.",
      "Keep the JSON block as the record of decisions. Change a rule there and the prototype " +
        "changes with it — a spec and a prototype cannot drift apart if they are the same file.",
    ],

    prompt:
      "Build me a clickable prototype with the requirements attached to it, as ONE self-contained " +
      "HTML file - no libraries, no build step, no network calls of any kind.\n\n" +
      "Here is the screen I want, in prose:\n" +
      "[paste yours here]\n\n" +
      "How it should work:\n" +
      "- Draw the screen as a simple, obviously-a-prototype mock-up. Grey boxes are fine; I am " +
      "not asking for visual design.\n" +
      "- Every control that has a rule gets a small marker next to it. Clicking the marker opens " +
      "that rule in a panel beside the screen, and clicking it again closes it.\n" +
      "- Each rule states what the control does, what it does when it fails, and what is still " +
      "undecided. Show the undecided ones in a different colour - those are the ones I need " +
      "people to argue about.\n" +
      "- Buttons that move between screens should actually move between screens.\n\n" +
      "Put every screen definition and every annotation in ONE clearly marked JSON block at the " +
      "top of the file, and show me exactly where to edit it. I will be rewriting the rules far " +
      "more often than the prototype.\n\n" +
      "Add a button that exports that JSON block on its own, so the decisions can be read without " +
      "opening the prototype at all.",

    receipt: {
      buildTime: "Two evenings (est.)",
      tool: "Claude web, nothing installed",
      cost: "Free tier (est.)",
      lines: "~700 (est.)",
      dataTouched: "None. Invent the screen, or mock up something nobody depends on.",
      skill: "Writing a rule short enough to sit next to the thing it governs",
      hardestPart: "Resisting the urge to annotate everything",
    },

    demo: { type: "placeholder" },
    links: [],
  },

  // ------------------------------------------------------------------ zone 3
  // Advanced. A repository, tests that run on every push, an image somebody
  // else can pull, and a release you could put a date against.

  {
    id: "linky",
    zone: 3,
    flagship: true,
    title: "Linky",
    tile: { x: 70, y: 8 },
    sprite: "server",

    problem:
      "Anything with more than a few hundred moving parts ends up held together by links between " +
      "records: this blocks that, this duplicates that, this was split out of that. No tracker " +
      "shows you the shape of it. You can see one item and its immediate neighbours, one screen " +
      "at a time, and you certainly cannot fix two hundred links without opening two hundred " +
      "screens. So nobody fixes them, and the links quietly stop meaning anything.",

    build:
      "A small web service that draws the link graph around an item and lets you rewire it in " +
      "place. It runs as a container: one command to pull it, one to run it, and it talks to " +
      "your tracker's API using credentials that never leave the machine it is running on.\n\n" +
      "The drawing is not the interesting part. What made it something another person could " +
      "safely run is the machinery around it. It lives in a Git repository. Every push runs the " +
      "test suite — 145 automated tests — and the image is rebuilt every week whether or not " +
      "anything changed, because the base image picks up security fixes and an image nobody " +
      "rebuilds is an image quietly rotting. It is published for more than one processor " +
      "architecture, so it runs on a colleague's laptop as well as on the machine it was " +
      "written on.\n\n" +
      "The AI wrote most of the code. The two decisions that mattered most were in none of the " +
      "prompts: keeping the access token on the server so it never reaches the browser, and " +
      "refusing to fetch URLs that a user supplies, so the service cannot be talked into making " +
      "requests on somebody else's behalf. Nothing asked for either. Nothing pointed out that " +
      "they were missing. They came from a person who had seen both go wrong before — and that, " +
      "not the code, is the argument this whole map has been making.",

    steps: [
      "Take something you already built at the level behind you and put it in a Git repository " +
        "before you add another feature to it. That one move is most of the distance between " +
        "these two zones.",
      "Ask for tests before you ask for features, and make the AI run them. A suite you never " +
        "run is a comment. This is also the point where you stop reading every line and start " +
        "reading every result.",
      "Paste the prompt below into your editor's AI agent — this is the level where you have " +
        "one — and let it set up the repository, the tests and the pipeline in one go.",
      "Turn on CI so the tests run on every push, and add a scheduled weekly rebuild. The " +
        "rebuild is not optional: it is how the container picks up security fixes you will " +
        "otherwise never hear about.",
      "Before you publish anything, ask yourself the question nothing will ask you: what does " +
        "this hold that must not reach the browser, and what does it fetch that a user could " +
        "choose? Write your answers down. Those are yours to get right.",
    ],

    prompt:
      "I have a working script that does something useful and I want to turn it into a service " +
      "somebody else can run safely. Do it in this order, and stop after each step so I can " +
      "read what you did.\n\n" +
      "1. Put it in a Git repository with a README that says what it is and how to run it.\n" +
      "2. Write automated tests for the behaviour that already works. Run them. Show me the " +
      "output, including anything that fails.\n" +
      "3. Add a continuous integration workflow that runs those tests on every push.\n" +
      "4. Containerise it, with a documented way to pass in credentials. Credentials must come " +
      "from the environment and must never appear in the image or in the browser.\n" +
      "5. Add a scheduled weekly rebuild so the base image picks up security updates.\n\n" +
      "Then, separately, review your own work as a security reviewer would and tell me: what " +
      "secrets does this hold, where could they leak, and can a user of this service make it " +
      "fetch a URL of their choosing? List what you find. Do not fix anything yet - I want to " +
      "decide which of those matter.",

    receipt: {
      buildTime: "Not recorded (est.)",
      tool: "An editor with an AI agent, a Git repository, and CI on every push",
      cost: "Free tier (est.)",
      lines: "Not counted (est.)",
      dataTouched: "An access token for a work tracker, held on the server and never sent to the browser.",
      skill: "Knowing which decisions not to delegate",
      hardestPart: "The two security decisions nothing prompted us for",
    },

    demo: { type: "external" },
    links: [
      {
        label: "Pull the published container image from Docker Hub",
        href: "https://hub.docker.com/r/edwinjclark/linky",
      },
    ],
  },

  {
    id: "monty",
    zone: 3,
    flagship: false,
    title: "Monty",
    tile: { x: 80, y: 12 },
    sprite: "anvil",

    problem:
      "Somebody asks when it will be done and you give a date, because a range sounds like " +
      "hedging and a date sounds like an answer. The date is a single sample from a distribution " +
      "nobody ever drew. When it slips — and one date pulled out of a wide distribution nearly " +
      "always slips — the conversation that follows is about your credibility rather than about " +
      "the spread, which was the honest answer in the first place.",

    build:
      "One file that runs ten thousand imaginary versions of the next few months. You give it " +
      "how many items your team finished in each of the last ten weeks and how many are left. It " +
      "samples from your own past weeks, over and over, and counts how many of those ten " +
      "thousand futures have finished by each date.\n\n" +
      "What comes out is not a date. It is a shape: a fifty percent line, an eighty-five percent " +
      "line, and the distance between them, which is a fact about your team that nobody has to " +
      "argue about. There is no backend, no API and no data store anywhere in it — it is a page " +
      "that does arithmetic quickly. Its output has sat behind a release estimate that senior " +
      "people acted on, which says more about how rare an honest range is than about the " +
      "sophistication of the arithmetic.",

    steps: [
      "Count how many items your team finished in each of the last ten weeks. Ten numbers, off a " +
        "board you already have. Do not tidy them up: the bad weeks are the entire point.",
      "Count what is left, and accept that the number will grow. If you know roughly how much it " +
        "has grown per week in the past, that is a second input worth having.",
      "Paste the prompt below into Claude and ask for one self-contained HTML file. Type your " +
        "ten numbers in and read the eighty-five percent line.",
      "Present the shape rather than the date, and say out loud why you are doing it. The method " +
        "is the thing that has to survive contact with the room — this week's answer will be " +
        "wrong soon enough either way.",
    ],

    prompt:
      "Build me a Monte Carlo delivery forecast as ONE self-contained HTML file - no libraries, " +
      "no build step, no network calls of any kind.\n\n" +
      "Inputs at the top:\n" +
      "- Ten boxes for how many items were finished in each of the last ten weeks.\n" +
      "- How many items are left.\n" +
      "- Optionally, how many new items appear per week, as a range.\n\n" +
      "When I press run, simulate ten thousand futures. For each one, sample a weekly throughput " +
      "at random from the ten weeks I gave you (with replacement), add any new work, and count " +
      "the weeks until the remaining work reaches zero.\n\n" +
      "Show me:\n" +
      "- A histogram of finish weeks.\n" +
      "- The 50th, 85th and 95th percentile dates, clearly labelled, with the 85th largest and " +
      "most prominent.\n" +
      "- One plain-English sentence I can read out, of the form \"85 out of 100 simulated futures " +
      "finished by <date>\".\n\n" +
      "No date is ever presented on its own without its percentile. Big type, high contrast, " +
      "meant for a shared screen. Keep all the wording in one clearly marked block at the top.",

    receipt: {
      buildTime: "Not recorded (est.)",
      tool: "Not recorded (est.)",
      cost: "Free tier (est.)",
      lines: "Not counted (est.)",
      dataTouched: "None. Ten weekly counts, typed in by hand. No backend, no API, nothing stored.",
      skill: "Explaining a range to somebody who asked for a date",
      hardestPart: "Trusting your own bad weeks enough to leave them in",
    },

    // Built, but with nowhere public to point at. "external" with no links
    // renders "No demo linked for this one yet", which is true. "placeholder"
    // would say "Playable demo coming soon", which would not be.
    demo: { type: "external" },
    links: [],
  },

  {
    id: "beyond-the-map",
    zone: 3,
    flagship: false,
    title: "Beyond the Map",
    tile: { x: 88, y: 8 },
    sprite: "chest_locked",

    problem:
      "Everything on this map is something one person can build in evenings, and that ceiling is " +
      "already moving. The risk is not that you fall behind the tools. It is that you decide " +
      "once, this year, what these things are for, and then never revisit the decision — so the " +
      "answer you settled on quietly goes out of date while you are still repeating it.",

    build:
      "A short list of what is arriving next, and one thing to do about it.\n\n" +
      "Agents that run on a schedule rather than when you ask: something that reads yesterday's " +
      "changes each morning and leaves you three lines about what actually moved. Tools that " +
      "connect to the systems you already use, so the thing you built stops being an island you " +
      "paste into and out of. And tools that open their own pull requests — you describe a " +
      "change and what comes back is not a file to copy, but a proposal against a real " +
      "repository, tests already run, waiting for a person to say yes.\n\n" +
      "None of that changes the argument. The AI at the top of that list is the same AI in the " +
      "first zone of this map. What changes, again, is the discipline you wrap around it — and " +
      "at this end of the scale the discipline is mostly review, because the thing now proposes " +
      "changes faster than you can read them.\n\n" +
      "So here is the last one, and it is the only station that asks something of you. This game " +
      "is a repository. Fork it, add a station describing something you would build, and open a " +
      "pull request. The contributing guide below has a list of ideas nobody has picked up yet — " +
      "take one, or ignore all of them and write your own.",

    steps: [
      "Open the contributing guide linked below. It has the whole procedure, and a backlog of " +
        "station ideas at the bottom for when you want one and cannot think of one.",
      "Fork the repository on GitHub and open src/content/stations.js. Every station you have " +
        "walked past today is one object in that one array.",
      "Copy whichever station is closest to what you want to say. Change the id, the title, the " +
        "tile and the sprite, then fill in all four sections and all seven receipt fields.",
      "Run node --test. The content validation suite checks that your tile is in bounds and " +
        "walkable, that your sprite name exists, that nothing else is standing on that tile, and " +
        "that your receipt is complete. When something is wrong it tells you which line to fix.",
      "Open a pull request. If a figure in your receipt is a guess, mark it (est.) — that " +
        "convention is the only reason anybody believes the figures that are not.",
    ],

    prompt:
      "I want to add a station to an open-source browser game. It is vanilla JavaScript with no " +
      "build step, no framework and no dependencies, and a station is one plain object in " +
      "src/content/stations.js.\n\n" +
      "Here is the idea I want to describe:\n" +
      "[paste yours here]\n\n" +
      "Read CONTRIBUTING.md and src/content/stations.js in the repository first, then write me " +
      "one station object that matches the house style exactly: the four sections, the seven " +
      "receipt fields in the same order as the others, and an opening prompt somebody can copy " +
      "and paste.\n\n" +
      "Two rules I care about more than the rest:\n" +
      "- Mark every figure you cannot verify as an estimate, like \"~400 (est.)\". Do not invent " +
      "a number that looks measured.\n" +
      "- Keep every example invented and generic. This is published on the open internet, so no " +
      "employer detail, no system names, no real ticket references and no data about anybody.\n\n" +
      "Then run node --test and fix whatever the content validation suite says is wrong.",

    receipt: {
      buildTime: "An evening, for your first station (est.)",
      tool: "A text editor and a GitHub account",
      cost: "Free. A fork and a pull request cost nothing.",
      lines: "~40, for one station object (est.)",
      dataTouched: "None. Everything in this repository is invented or already public.",
      skill: "Describing something you would actually use",
      hardestPart: "Picking one idea and stopping there",
    },

    demo: { type: "external" },
    links: [
      {
        label: "How to add a station, and the backlog of ideas (CONTRIBUTING.md)",
        href: "https://github.com/bigeazee/vibing/blob/main/CONTRIBUTING.md",
      },
      {
        label: "The repository this game is built from",
        href: "https://github.com/bigeazee/vibing",
      },
    ],
  },
];
