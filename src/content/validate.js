/**
 * CONTENT VALIDATION
 * ==================
 *
 * THE HIGHEST-VALUE CODE IN THIS REPOSITORY. It is what stops somebody's pull
 * request breaking the live site.
 *
 * A station is one object in one file, added by somebody who may never have
 * written JavaScript. That is the whole point of the data model, and it only
 * works if a mistake is caught here, with a sentence that says what to fix,
 * rather than in front of an audience as a blank canvas.
 *
 * Two rules shape everything below.
 *
 * IT COLLECTS, IT NEVER THROWS. Somebody who has made three mistakes should see
 * three messages, not play whack-a-mole through three test runs. Even a map that
 * will not parse comes back as a string in the array rather than an exception.
 *
 * MESSAGES MATCH THEIR SCOPE - see CLAUDE.md section 9. A fault in the grid
 * names the row, the column and the offending character. A fault in a
 * definition has no row and column, so it names the key it belongs to: the
 * station id, the gate id, the legend character, or the plaque's zone. Every
 * message is a complete sentence that could be read out over a shoulder.
 *
 * It lives in a module rather than in the test file so the test stays thin, and
 * so a later package can run it at boot if we ever want the game itself to
 * refuse to start on broken content.
 */

import { canEnter } from "../engine/collision.js";
import { MOVE_MS } from "../engine/player.js";
import { index, parseMap } from "../engine/tilemap.js";
import { lockGates, markSolid } from "../engine/zones.js";
import { spriteExists } from "./sprites.js";
import { FLAGSHIP_MARKER_SPRITE } from "./stations.js";
import { plaqueId } from "./plaques.js";

/** The seven receipt fields, in CLAUDE.md's order. Never reorder, never trim. */
export const RECEIPT_FIELDS = [
  "buildTime",
  "tool",
  "cost",
  "lines",
  "dataTouched",
  "skill",
  "hardestPart",
];

/** The zone ids the game knows about. */
export const ZONE_IDS = [1, 2, 3];

/** Stations per zone, and flagships per zone. */
const STATIONS_PER_ZONE = 3;
const FLAGSHIPS_PER_ZONE = 1;

/** CLAUDE.md section 7: three to five concrete steps. */
const MIN_STEPS = 3;
const MAX_STEPS = 5;

/** demo.type values the panel knows how to render. */
const DEMO_TYPES = ["placeholder", "external", "embedded"];

/**
 * The furthest two stations that follow one another may be, in tiles walked.
 *
 * At MOVE_MS per tile this is about three seconds, which is the point where
 * narrating a walk in front of an audience turns into dead air. CLAUDE.md
 * section 6 asks for two to three seconds between adjacent stations; this is the
 * hard ceiling, not the target.
 */
export const MAX_WALK_TILES = 17;

const NEIGHBOURS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/**
 * @param {object} content
 * @param {object[]} content.stations
 * @param {object[]} content.gates
 * @param {object[]} content.plaques
 * @param {object} content.mapDef
 * @param {object} content.legend
 * @returns {string[]} every problem found, each a complete actionable sentence.
 *   An empty array means the content is valid.
 */
export function validateContent({ stations, gates, plaques, mapDef, legend } = {}) {
  const problems = [];

  const stationList = asArray(stations, "stations", problems);
  const gateList = asArray(gates, "gates", problems);
  const plaqueList = asArray(plaques, "plaques", problems);

  for (const station of stationList) checkStation(station, problems);
  for (const gate of gateList) checkGate(gate, problems);
  for (const plaque of plaqueList) checkPlaque(plaque, problems);

  checkUniqueIds(stationList, "station", problems);
  checkUniqueIds(gateList, "gate", problems);
  checkZoneCounts(stationList, plaqueList, problems);

  if (!spriteExists(FLAGSHIP_MARKER_SPRITE)) {
    problems.push(
      `The flagship marker sprite "${FLAGSHIP_MARKER_SPRITE}" is not a sprite name in ` +
        `src/content/sprites.js. Fix FLAGSHIP_MARKER_SPRITE in src/content/stations.js.`
    );
  }

  // The map is parsed last of the "definitions" work, because everything below
  // needs the grid and parseMap is the one part allowed to give up early.
  let grid = null;
  try {
    grid = parseMap(mapDef, legend);
  } catch (error) {
    // parseMap's messages already name the row, the column and the character,
    // which is the right scope for a grid fault. Pass it straight through.
    problems.push(error.message);
    return problems;
  }

  const placed = [
    ...stationList.map((s) => ({ kind: "station", id: idOf(s), item: s })),
    ...gateList.map((g) => ({ kind: "gate", id: idOf(g), item: g })),
    ...plaqueList.map((p) => ({ kind: "plaque", id: plaqueId(p), item: p })),
  ];

  const placementProblems = [];
  checkPlacement(grid, placed, placementProblems);
  problems.push(...placementProblems);

  // Walking the map means making station tiles solid and locking gates, and
  // both of those throw on a tile the placement pass has already reported. No
  // point saying it twice in two different voices.
  if (placementProblems.length === 0) {
    checkTheMapAsWalked(grid, stationList, gateList, plaqueList, problems);
  }

  return problems;
}

// ---------------------------------------------------------------- definitions

function asArray(value, name, problems) {
  if (Array.isArray(value)) return value;
  problems.push(`${name} must be an array. Check the export in src/content/${name}.js.`);
  return [];
}

function idOf(definition) {
  return definition && typeof definition.id === "string" && definition.id !== ""
    ? definition.id
    : "(no id)";
}

function checkStation(station, problems) {
  const id = idOf(station);
  const say = (text) => problems.push(`Station "${id}" ${text}`);

  if (!station || typeof station !== "object") {
    problems.push("Every entry in stations must be an object. See src/content/stations.js.");
    return;
  }
  if (id === "(no id)") {
    say('needs an id: a short lower-case name, unique across stations, like "backlog-swipe".');
  }

  for (const field of ["title", "sprite", "problem", "build", "prompt"]) {
    if (!isFilledString(station[field])) {
      say(`needs a non-empty "${field}". Every station has all four sections filled in.`);
    }
  }
  checkZone(station.zone, say);
  checkTileShape(station.tile, say);

  if (typeof station.flagship !== "boolean") {
    say('needs flagship: true or flagship: false. One station per zone is the flagship.');
  }

  if (!Array.isArray(station.steps)) {
    say(`needs "steps": an array of ${MIN_STEPS} to ${MAX_STEPS} concrete steps.`);
  } else {
    if (station.steps.length < MIN_STEPS || station.steps.length > MAX_STEPS) {
      say(
        `has ${station.steps.length} steps. The house style is ${MIN_STEPS} to ${MAX_STEPS} — ` +
          `fewer and nobody can follow it, more and nobody reads it.`
      );
    }
    if (station.steps.some((step) => !isFilledString(step))) {
      say("has an empty step. Every step is a sentence somebody can actually do.");
    }
  }

  checkReceipt(station.receipt, say);
  checkDemo(station, say);

  if (!Array.isArray(station.links)) {
    say('needs "links": an array. Use [] when there is nothing to link to.');
  }

  if (isFilledString(station.sprite) && !spriteExists(station.sprite)) {
    say(
      `uses sprite "${station.sprite}", which is not a name in src/content/sprites.js. ` +
        `Add it to SPRITES there first, or pick one that already exists.`
    );
  }
}

/**
 * The receipt is checked as an ordered list of keys rather than field by field,
 * which catches a missing field, an extra eighth one and a reordering in one
 * comparison. CLAUDE.md section 7: never omit a field, never reorder them,
 * never add an eighth.
 */
function checkReceipt(receipt, say) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    say(`needs a receipt with all seven fields: ${RECEIPT_FIELDS.join(", ")}.`);
    return;
  }
  const keys = Object.keys(receipt);
  const expected = RECEIPT_FIELDS.join(", ");
  if (keys.length !== RECEIPT_FIELDS.length || keys.some((key, i) => key !== RECEIPT_FIELDS[i])) {
    say(
      `has receipt fields [${keys.join(", ")}] but every receipt has exactly these seven, in ` +
        `this order: ${expected}. Never omit one, never reorder them, never add an eighth.`
    );
    return;
  }
  for (const field of RECEIPT_FIELDS) {
    if (!isFilledString(receipt[field])) {
      say(
        `has an empty receipt field "${field}". If you do not know the real figure, say so and ` +
          `mark it, like "Not counted (est.)" — never leave it blank and never guess a number.`
      );
    }
  }
}

function checkDemo(station, say) {
  const demo = station.demo;
  if (!demo || typeof demo !== "object" || !DEMO_TYPES.includes(demo.type)) {
    say(`needs demo: { type } where type is one of ${DEMO_TYPES.join(", ")}.`);
    return;
  }
  if (demo.type === "embedded") {
    say(
      'has demo.type "embedded", which is not implemented in this version. Use "placeholder" ' +
        "until an embedded demo module exists."
    );
  }
  // "external" with no links is LEGAL, and it is the honest state for a thing
  // that has been built but has nowhere public to point at. The panel renders
  // "No demo linked for this one yet", which is true. "placeholder" would
  // render "Playable demo coming soon", which promises something that is not
  // coming - and this game's whole argument rests on its figures being honest.
  for (const link of Array.isArray(station.links) ? station.links : []) {
    if (!link || !isFilledString(link.href)) {
      say("has a link with no href. Every link needs a full URL somebody can click.");
    }
  }
}

function checkGate(gate, problems) {
  const id = idOf(gate);
  const say = (text) => problems.push(`Gate "${id}" ${text}`);

  if (!gate || typeof gate !== "object") {
    problems.push("Every entry in gates must be an object. See src/content/gates.js.");
    return;
  }
  if (id === "(no id)") say('needs an id, unique across gates, like "gate-1-2".');

  for (const field of ["question", "nudge", "sprite", "spriteUnlocked"]) {
    if (!isFilledString(gate[field])) say(`needs a non-empty "${field}".`);
  }
  checkZone(gate.fromZone, say, "fromZone");
  checkZone(gate.toZone, say, "toZone");
  checkTileShape(gate.tile, say);

  for (const field of ["sprite", "spriteUnlocked"]) {
    if (isFilledString(gate[field]) && !spriteExists(gate[field])) {
      say(`uses ${field} "${gate[field]}", which is not a name in src/content/sprites.js.`);
    }
  }

  if (!Array.isArray(gate.options) || gate.options.length < 3) {
    say("needs at least three options. One question, three or four answers, one of them right.");
    return;
  }
  if (gate.options.some((option) => !option || !isFilledString(option.text))) {
    say("has an option with no text.");
  }
  const correct = gate.options.filter((option) => option && option.correct === true).length;
  if (correct !== 1) {
    say(
      `has ${correct} correct options. A gate needs exactly one — ` +
        `${correct === 0 ? "nobody could ever pass it" : "any of them would open the door"}.`
    );
  }
}

function checkPlaque(plaque, problems) {
  // A plaque has no id: there is exactly one per zone, so the zone IS the
  // identity, and that is what the message names. See src/content/plaques.js.
  const say = (text) => problems.push(`The plaque for zone ${plaque && plaque.zone} ${text}`);

  if (!plaque || typeof plaque !== "object") {
    problems.push("Every entry in plaques must be an object. See src/content/plaques.js.");
    return;
  }
  checkZone(plaque.zone, (text) => problems.push(`A plaque ${text}`));

  for (const field of ["title", "level", "body", "sprite"]) {
    if (!isFilledString(plaque[field])) {
      say(`needs a non-empty "${field}".`);
    }
  }
  checkTileShape(plaque.tile, say);

  if (isFilledString(plaque.sprite) && !spriteExists(plaque.sprite)) {
    say(`uses sprite "${plaque.sprite}", which is not a name in src/content/sprites.js.`);
  }
  if (plaque.receipt !== undefined) {
    say(
      "has a receipt. A plaque is not a station: it has no build time, no cost and no line " +
        "count, and seven invented figures cost more trust than the plaque is worth."
    );
  }
}

function checkZone(zone, say, field = "zone") {
  if (!ZONE_IDS.includes(zone)) {
    say(`has ${field} ${JSON.stringify(zone)}. It must be one of ${ZONE_IDS.join(", ")}.`);
  }
}

function checkTileShape(tile, say) {
  if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y)) {
    say("needs tile: { x, y } with whole-number tile coordinates.");
  }
}

function checkUniqueIds(list, kind, problems) {
  const seen = new Set();
  for (const item of list) {
    const id = idOf(item);
    if (id === "(no id)") continue;
    if (seen.has(id)) {
      problems.push(
        `There are two ${kind}s with the id "${id}". Ids have to be unique — progress is saved ` +
          `against them, so a duplicate makes two things share one saved state.`
      );
    }
    seen.add(id);
  }
}

function checkZoneCounts(stationList, plaqueList, problems) {
  for (const zone of ZONE_IDS) {
    const inZone = stationList.filter((station) => station && station.zone === zone);
    if (inZone.length !== STATIONS_PER_ZONE) {
      problems.push(
        `Zone ${zone} has ${inZone.length} stations. Every zone has exactly ` +
          `${STATIONS_PER_ZONE}: the difficulty curve only reads if the zones are the same size.`
      );
    }
    const flagships = inZone.filter((station) => station.flagship === true);
    if (flagships.length !== FLAGSHIPS_PER_ZONE) {
      problems.push(
        `Zone ${zone} has ${flagships.length} flagship stations (${
          flagships.map((s) => `"${idOf(s)}"`).join(", ") || "none"
        }). Every zone has exactly ${FLAGSHIPS_PER_ZONE}, because one per zone gets talked ` +
          `through live.`
      );
    }
    const inZonePlaques = plaqueList.filter((plaque) => plaque && plaque.zone === zone);
    if (inZonePlaques.length !== 1) {
      problems.push(
        `Zone ${zone} has ${inZonePlaques.length} plaques. Every zone has exactly one, at its ` +
          `entrance — it is what makes that zone's gate answer findable without a narrator.`
      );
    }
  }
}

// ----------------------------------------------------------------- placement

function checkPlacement(grid, placed, problems) {
  const byTile = new Map();

  for (const { kind, id, item } of placed) {
    const tile = item && item.tile;
    if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y)) continue; // already said

    if (tile.x < 0 || tile.y < 0 || tile.x >= grid.width || tile.y >= grid.height) {
      problems.push(
        `The ${kind} "${id}" is at tile (${tile.x}, ${tile.y}), off a map that is ` +
          `${grid.width}x${grid.height} tiles.`
      );
      continue;
    }

    if (grid.solid[index(grid.width, tile.x, tile.y)] === 1) {
      problems.push(
        `The ${kind} "${id}" is at tile (${tile.x}, ${tile.y}), which is a solid tile in the ` +
          `map — there is a "${whatIsThere(grid, tile.x, tile.y)}" on it. It has to sit on ` +
          `walkable ground: move it, or clear that tile in src/content/map.js.`
      );
      continue;
    }

    const key = `${tile.x},${tile.y}`;
    const already = byTile.get(key);
    if (already) {
      problems.push(
        `The ${kind} "${id}" and the ${already.kind} "${already.id}" are both on tile ` +
          `(${tile.x}, ${tile.y}). Two things cannot share a tile: whichever is found first is ` +
          `the only one you can ever open.`
      );
    } else {
      byTile.set(key, { kind, id });
    }

    if (kind === "station" || kind === "plaque") {
      const open = NEIGHBOURS.some(([dx, dy]) => canEnter(grid, tile.x + dx, tile.y + dy));
      if (!open) {
        problems.push(
          `The ${kind} "${id}" at tile (${tile.x}, ${tile.y}) is walled in on all four sides, ` +
            `so nobody can ever stand next to it and open it.`
        );
      }
    }
  }
}

/**
 * What is standing on a tile, named the way the sprite contract names it.
 *
 * The parsed grid holds sprite names rather than legend characters, and the
 * sprite name is the more useful half anyway: "there is a tree_green on it" is
 * something you can go and find in the map, where "the character is t" still
 * needs looking up.
 */
function whatIsThere(grid, x, y) {
  const i = index(grid.width, x, y);
  return grid.overlay[i] || grid.terrain[i];
}

// --------------------------------------------------------- the map, as walked

function checkTheMapAsWalked(grid, stations, gates, plaques, problems) {
  // One grid per unlock state, so no check leaves marks on another one.
  const build = (isZoneUnlocked) => {
    const g = copyOf(grid);
    markSolid(g, stations, "station");
    markSolid(g, plaques, "plaque");
    lockGates(g, gates, isZoneUnlocked);
    return g;
  };

  // --- the barrier proof: a locked zone must be provably unreachable
  // Read out of the map rather than hardcoded, so a fourth zone would be
  // covered by this the day somebody adds one.
  const zonesInMap = grid.zones.map((zone) => zone.id).sort((a, b) => a - b);
  for (let i = 0; i < zonesInMap.length; i++) {
    const open = new Set(zonesInMap.slice(0, i + 1));
    const g = build((zoneId) => open.has(zoneId));
    const reached = zonesReachable(g, reachableFrom(g, g.spawn));
    const expected = [...open].sort((a, b) => a - b);
    if (JSON.stringify(reached) !== JSON.stringify(expected)) {
      problems.push(
        `With zones ${expected.join(", ")} unlocked, the player can reach zones ` +
          `${reached.join(", ")}. A locked zone has to be provably unreachable: one walkable ` +
          `tile left in a barrier column lets somebody skip a whole zone's content, which is ` +
          `the one thing the gates exist to prevent. Check the barrier columns in ` +
          `src/content/map.js.`
      );
    }
  }

  // --- reachability: with everything open, everything must be walkable-to
  const openGrid = build(() => true);
  const reachable = reachableFrom(openGrid, openGrid.spawn);
  const everything = [
    ...stations.map((s) => ({ kind: "station", id: idOf(s), tile: s.tile })),
    ...gates.map((g) => ({ kind: "gate", id: idOf(g), tile: g.tile })),
    ...plaques.map((p) => ({ kind: "plaque", id: plaqueId(p), tile: p.tile })),
  ];
  for (const { kind, id, tile } of everything) {
    if (!tile) continue;
    const canStandBeside = NEIGHBOURS.some(([dx, dy]) =>
      reachable.has(`${tile.x + dx},${tile.y + dy}`)
    );
    if (!canStandBeside) {
      problems.push(
        `The ${kind} "${id}" at tile (${tile.x}, ${tile.y}) cannot be walked to from the spawn ` +
          `even with every gate open, so nobody will ever see it.`
      );
    }
  }

  // --- walking distance between stations that follow one another in a zone
  for (const zone of ZONE_IDS) {
    const route = stations
      .filter((station) => station && station.zone === zone && station.tile)
      .sort((a, b) => a.tile.x - b.tile.x || a.tile.y - b.tile.y);

    for (let i = 0; i + 1 < route.length; i++) {
      const from = route[i];
      const to = route[i + 1];
      const steps = walkingDistance(openGrid, from.tile, to.tile);
      if (steps === Infinity) {
        problems.push(
          `There is no walking route between station "${idOf(from)}" and station "${idOf(to)}", ` +
            `which follow one another in zone ${zone}.`
        );
      } else if (steps > MAX_WALK_TILES) {
        problems.push(
          `Station "${idOf(from)}" and station "${idOf(to)}" follow one another in zone ${zone} ` +
            `but are ${steps} tiles apart on foot, over the limit of ${MAX_WALK_TILES} ` +
            `(about ${(steps * MOVE_MS) / 1000} seconds of walking). The talk is narrated while ` +
            `moving, and dead air crossing empty scenery is how this format fails in front of ` +
            `an audience. Move them closer together in src/content/map.js.`
        );
      }
    }
  }
}

/**
 * A fresh grid with the same layers.
 *
 * Each unlock state gets its own copy, because markSolid and lockGates write
 * into the collision layer and the checks would otherwise see each other's
 * work.
 */
function copyOf(grid) {
  return {
    width: grid.width,
    height: grid.height,
    spawn: grid.spawn,
    terrain: grid.terrain,
    overlay: grid.overlay,
    solid: Uint8Array.from(grid.solid),
    zones: grid.zones,
    zoneAt: grid.zoneAt,
  };
}

/** Every tile reachable on foot from `start`, as a set of "x,y" keys. */
function reachableFrom(grid, start) {
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const { x, y } = queue[head];
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !canEnter(grid, nx, ny)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

/** Which zone ids the player can actually set foot in. */
function zonesReachable(grid, reachable) {
  const zoneIds = new Set();
  for (const key of reachable) {
    const [x, y] = key.split(",").map(Number);
    const zoneId = grid.zoneAt(x, y);
    if (zoneId > 0) zoneIds.add(zoneId);
  }
  return [...zoneIds].sort((a, b) => a - b);
}

/**
 * Steps between two station tiles, measured the way a player walks it.
 *
 * Stations are solid, so nobody ever stands ON one: this is the distance from a
 * tile you can stand on beside the first to a tile you can stand on beside the
 * second, by breadth-first search over walkable tiles. Straight-line distance
 * would happily report six tiles for two stations either side of a wall.
 */
function walkingDistance(grid, fromTile, toTile) {
  const targets = new Set(
    NEIGHBOURS.map(([dx, dy]) => `${toTile.x + dx},${toTile.y + dy}`).filter((key) => {
      const [x, y] = key.split(",").map(Number);
      return canEnter(grid, x, y);
    })
  );
  if (targets.size === 0) return Infinity;

  const starts = NEIGHBOURS.map(([dx, dy]) => ({ x: fromTile.x + dx, y: fromTile.y + dy })).filter(
    (tile) => canEnter(grid, tile.x, tile.y)
  );
  if (starts.length === 0) return Infinity;

  const distance = new Map();
  const queue = [];
  for (const start of starts) {
    const key = `${start.x},${start.y}`;
    if (distance.has(key)) continue;
    distance.set(key, 0);
    queue.push(start);
  }

  for (let head = 0; head < queue.length; head++) {
    const { x, y } = queue[head];
    const here = distance.get(`${x},${y}`);
    if (targets.has(`${x},${y}`)) return here;
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (distance.has(key) || !canEnter(grid, nx, ny)) continue;
      distance.set(key, here + 1);
      queue.push({ x: nx, y: ny });
    }
  }
  return Infinity;
}

function isFilledString(value) {
  return typeof value === "string" && value.trim() !== "";
}
