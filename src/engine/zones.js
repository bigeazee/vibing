/**
 * ZONES
 * =====
 *
 * The two jobs that turn content coordinates into collision:
 *
 *   markStationsSolid  you stand NEXT TO a station, never on top of it
 *   lockGates          a gate is a wall until its zone is unlocked
 *
 * Pure. Both mutate the `solid` layer of the grid they are handed and nothing
 * else - no storage, no DOM, no progress object. lockGates takes a PREDICATE
 * rather than the progress object precisely so it can be tested with a one-line
 * fake instead of a storage stub.
 *
 * Both assume the map itself leaves station and gate tiles walkable. That is
 * what makes clearing a gate safe: lockGates writes 0, and if the map had put a
 * fence there the gate would open onto a wall. The assumption is enforced with a
 * thrown error rather than trusted - see mapSaidSolid() for how that is kept
 * compatible with lockGates being callable over and over.
 *
 * Error messages name the station or gate `id`, not a row and column. A broken
 * definition has no row and column - see CLAUDE.md section 9. The person reading
 * the message has usually just added one object to stations.js by hand.
 */

import { index } from "./tilemap.js";

/**
 * Block every station tile.
 *
 * Called once at boot, before the player can move, and idempotent if it is ever
 * called again.
 *
 * @param {object} grid parseMap result
 * @param {{id: string, tile: {x: number, y: number}}[]} stations
 */
export function markStationsSolid(grid, stations) {
  if (!Array.isArray(stations)) {
    throw new Error("markStationsSolid: stations must be an array.");
  }
  for (const station of stations) {
    const { x, y } = requireWalkableTile(grid, station, "station", "markStationsSolid");
    grid.solid[index(grid.width, x, y)] = 1;
  }
}

/**
 * Make each gate tile solid while its destination zone is locked, and walkable
 * once it is not.
 *
 * Idempotent and safe to call as often as you like: it writes the answer rather
 * than toggling. Call it at boot, again whenever a zone unlocks, and again after
 * a progress reset.
 *
 * @param {object} grid parseMap result
 * @param {{id: string, toZone: number, tile: {x: number, y: number}}[]} gates
 * @param {(zoneId: number) => boolean} isZoneUnlocked a predicate, not the
 *   progress object - keeps this testable with no storage anywhere near it
 */
export function lockGates(grid, gates, isZoneUnlocked) {
  if (!Array.isArray(gates)) {
    throw new Error("lockGates: gates must be an array.");
  }
  if (typeof isZoneUnlocked !== "function") {
    throw new Error("lockGates: isZoneUnlocked must be a function taking a zone id.");
  }
  for (const gate of gates) {
    const { x, y } = requireWalkableTile(grid, gate, "gate", "lockGates");
    grid.solid[index(grid.width, x, y)] = isZoneUnlocked(gate.toZone) ? 0 : 1;
  }
}

/**
 * Validate one station or gate tile and return it.
 *
 * `solidIsAllowed` is deliberately absent: a definition's tile must be walkable
 * ground in the map, full stop.
 *
 * What this does NOT catch is two definitions sharing one tile - see the
 * mapVerdict comment below for why, and tests/content.test.js for where that
 * case is caught instead.
 */
function requireWalkableTile(grid, definition, kind, caller) {
  if (!definition || typeof definition !== "object") {
    throw new Error(`${caller}: every ${kind} must be an object with an id and a tile.`);
  }
  const id = typeof definition.id === "string" && definition.id !== "" ? definition.id : "(no id)";
  const tile = definition.tile;

  if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y)) {
    throw new Error(
      `${caller}: ${kind} "${id}" needs tile: { x, y } with whole-number tile coordinates.`
    );
  }
  if (tile.x < 0 || tile.y < 0 || tile.x >= grid.width || tile.y >= grid.height) {
    throw new Error(
      `${caller}: ${kind} "${id}" is at tile (${tile.x}, ${tile.y}), ` +
        `outside a map ${grid.width}x${grid.height} tiles.`
    );
  }
  if (mapSaidSolid(grid, tile.x, tile.y)) {
    throw new Error(
      `${caller}: ${kind} "${id}" is at tile (${tile.x}, ${tile.y}), which is a solid tile ` +
        `in the map. A ${kind} has to sit on walkable ground - move it, or clear that tile in ` +
        `src/content/map.js.`
    );
  }
  return tile;
}

/**
 * What the MAP said about a tile, as opposed to what this module has since
 * written there.
 *
 * lockGates has to do two things that pull against each other. It has to be
 * callable over and over - at boot, on every unlock, and after a reset - and it
 * has to catch a gate placed on a wall. Read the collision layer directly and
 * those two are incompatible: the moment lockGates locks a gate the tile IS
 * solid, and the next call would report this function's own work as a map
 * conflict. So the map's verdict on a tile is recorded the first time either
 * function looks at it, before anything is written, and every later call is
 * checked against that instead.
 *
 * Kept in a WeakMap keyed on the grid: nothing is added to the grid itself, two
 * grids never see each other's answers, and a grid that goes out of scope takes
 * its entry with it.
 *
 * What this deliberately does NOT catch is a gate and a station on the same
 * tile - the first one through records the tile as walkable and the second is
 * waved past. That is a content mistake rather than a map one, and it belongs
 * with the content validation suite.
 */
const mapVerdict = new WeakMap();

function mapSaidSolid(grid, x, y) {
  let seen = mapVerdict.get(grid);
  if (!seen) {
    seen = new Map();
    mapVerdict.set(grid, seen);
  }
  const key = `${x},${y}`;
  if (!seen.has(key)) seen.set(key, grid.solid[index(grid.width, x, y)] === 1);
  return seen.get(key);
}
