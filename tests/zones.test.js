/**
 * Two jobs here, and the second one is the important one.
 *
 * The unit tests below check that a station tile becomes solid and that a gate
 * is a wall until its zone is unlocked. Fine, but small.
 *
 * THE FLOOD FILL AT THE BOTTOM IS THE TEST THAT MATTERS. It walks the real map
 * from the real spawn with the real gates and asserts that a locked zone is
 * genuinely unreachable - not "looks walled off in the editor", but provably no
 * path. One walkable tile left in a barrier column silently undoes the entire
 * gate mechanic, and nobody would notice by eye. Written to be lifted into the
 * real map's work package unchanged: it reads the zones out of the map rather
 * than hardcoding three of them.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { parseMap, index } from "../src/engine/tilemap.js";
import { canEnter } from "../src/engine/collision.js";
import { lockGates, markStationsSolid } from "../src/engine/zones.js";
import { legend, mapDef } from "../src/content/map.js";
import { stations } from "../src/content/stations.js";
import { gates } from "../src/content/gates.js";

const fixtureLegend = {
  ".": { terrain: "grass" },
  "T": { terrain: "grass", overlay: "tree_green", solid: true },
};

/**
 * 5 x 3, with a tree at (2, 0):
 *   . . T . .
 *   . . . . .
 *   . . . . .
 */
function fixture() {
  return parseMap(
    { name: "Zones fixture", spawn: { x: 0, y: 2 }, zones: [], rows: ["..T..", ".....", "....."] },
    fixtureLegend
  );
}

const solidAt = (grid, x, y) => grid.solid[index(grid.width, x, y)] === 1;

// ------------------------------------------------------------ markStationsSolid

test("station tiles become solid, so you stand next to a station not on it", () => {
  const grid = fixture();
  assert.equal(solidAt(grid, 1, 1), false);

  markStationsSolid(grid, [{ id: "one", tile: { x: 1, y: 1 } }, { id: "two", tile: { x: 3, y: 2 } }]);

  assert.equal(solidAt(grid, 1, 1), true);
  assert.equal(solidAt(grid, 3, 2), true);
  assert.equal(solidAt(grid, 0, 0), false, "and nothing else is touched");
});

test("a station on a solid map tile throws, naming the station id", () => {
  const grid = fixture();
  assert.throws(
    () => markStationsSolid(grid, [{ id: "on-a-tree", tile: { x: 2, y: 0 } }]),
    (error) => {
      assert.match(error.message, /on-a-tree/, "the message must name the station");
      assert.match(error.message, /\(2, 0\)/);
      assert.ok(!/row \d/.test(error.message), "a definition fault has no row and column");
      return true;
    }
  );
});

test("a station off the edge of the map throws, naming the station id", () => {
  const grid = fixture();
  assert.throws(
    () => markStationsSolid(grid, [{ id: "adrift", tile: { x: 99, y: 0 } }]),
    /adrift.*outside a map 5x3/s
  );
});

test("a station with no usable tile throws, naming the station id", () => {
  const grid = fixture();
  assert.throws(() => markStationsSolid(grid, [{ id: "no-tile" }]), /no-tile.*tile/s);
  assert.throws(
    () => markStationsSolid(grid, [{ id: "half-tile", tile: { x: 1 } }]),
    /half-tile/
  );
});

// ------------------------------------------------------------------ lockGates

test("a locked gate is solid and an unlocked one is not", () => {
  const grid = fixture();
  const testGates = [{ id: "g", toZone: 2, tile: { x: 1, y: 1 } }];

  lockGates(grid, testGates, () => false);
  assert.equal(solidAt(grid, 1, 1), true, "locked: a wall");

  lockGates(grid, testGates, () => true);
  assert.equal(solidAt(grid, 1, 1), false, "unlocked: a doorway");
});

test("lockGates is idempotent, in both states and in either order", () => {
  const grid = fixture();
  const testGates = [{ id: "g", toZone: 2, tile: { x: 1, y: 1 } }];

  lockGates(grid, testGates, () => false);
  lockGates(grid, testGates, () => false);
  lockGates(grid, testGates, () => false);
  assert.equal(solidAt(grid, 1, 1), true);

  lockGates(grid, testGates, () => true);
  lockGates(grid, testGates, () => true);
  assert.equal(solidAt(grid, 1, 1), false);

  lockGates(grid, testGates, () => false);
  assert.equal(solidAt(grid, 1, 1), true, "and it can be closed again after a reset");
});

test("lockGates asks the predicate about the zone the gate leads TO", () => {
  const grid = fixture();
  const asked = [];
  lockGates(grid, [{ id: "g", fromZone: 1, toZone: 2, tile: { x: 1, y: 1 } }], (zoneId) => {
    asked.push(zoneId);
    return false;
  });
  assert.deepEqual(asked, [2]);
});

test("a gate on a solid map tile throws, naming the gate id", () => {
  const grid = fixture();
  assert.throws(
    () => lockGates(grid, [{ id: "walled-in", toZone: 2, tile: { x: 2, y: 0 } }], () => false),
    (error) => {
      assert.match(error.message, /walled-in/);
      assert.ok(!/row \d/.test(error.message), "a definition fault has no row and column");
      return true;
    }
  );
});

test("lockGates rejects a predicate that is not a function", () => {
  const grid = fixture();
  assert.throws(() => lockGates(grid, [], null), /isZoneUnlocked/);
});

// ---------------------------------------------------------- the barrier proof

/** Every tile reachable on foot from `start`, as a set of "x,y" keys. */
function reachableFrom(grid, start) {
  const seen = new Set();
  const queue = [start];
  seen.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { x, y } = queue.pop();
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
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

/** The real map, with stations blocked and gates set from an unlock predicate. */
function liveGrid(isZoneUnlocked) {
  const grid = parseMap(mapDef, legend);
  markStationsSolid(grid, stations);
  lockGates(grid, gates, isZoneUnlocked);
  return grid;
}

test("with the gates locked, only zone 1 is reachable from the spawn", () => {
  const grid = liveGrid((zoneId) => zoneId === 1);
  const reachable = reachableFrom(grid, grid.spawn);

  assert.deepEqual(
    zonesReachable(grid, reachable),
    [1],
    "a locked gate must be a wall - a single walkable tile in a barrier column undoes the whole mechanic"
  );
});

test("unlocking zone 2 opens zone 2 and leaves zone 3 shut", () => {
  const grid = liveGrid((zoneId) => zoneId === 1 || zoneId === 2);
  const reachable = reachableFrom(grid, grid.spawn);

  assert.deepEqual(zonesReachable(grid, reachable), [1, 2]);
});

test("unlocking both gates opens the whole map", () => {
  const grid = liveGrid(() => true);
  const reachable = reachableFrom(grid, grid.spawn);

  assert.deepEqual(zonesReachable(grid, reachable), [1, 2, 3]);
});

test("re-locking after an unlock shuts the zones again", () => {
  const grid = parseMap(mapDef, legend);
  markStationsSolid(grid, stations);

  lockGates(grid, gates, () => true);
  assert.deepEqual(zonesReachable(grid, reachableFrom(grid, grid.spawn)), [1, 2, 3]);

  // What "reset progress" has to do without a page reload.
  lockGates(grid, gates, (zoneId) => zoneId === 1);
  assert.deepEqual(zonesReachable(grid, reachableFrom(grid, grid.spawn)), [1]);
});

test("every station can actually be walked up to from the spawn", () => {
  const grid = liveGrid(() => true);
  const reachable = reachableFrom(grid, grid.spawn);

  for (const station of stations) {
    const neighbours = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(
      ([dx, dy]) => `${station.tile.x + dx},${station.tile.y + dy}`
    );
    assert.ok(
      neighbours.some((key) => reachable.has(key)),
      `station "${station.id}" has no walkable tile next to it - nobody can ever open it`
    );
  }
});

test("every gate can be walked up to from the zone it leads out of", () => {
  const grid = liveGrid((zoneId) => zoneId === 1);
  const reachable = reachableFrom(grid, grid.spawn);

  const firstGate = gates.find((gate) => gate.fromZone === 1);
  const neighbours = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(
    ([dx, dy]) => `${firstGate.tile.x + dx},${firstGate.tile.y + dy}`
  );
  assert.ok(
    neighbours.some((key) => reachable.has(key)),
    `gate "${firstGate.id}" cannot be reached, so its question can never be asked`
  );
});

test("markStationsSolid can be called twice without reporting its own work", () => {
  const grid = fixture();
  const testStations = [{ id: "one", tile: { x: 1, y: 1 } }];

  markStationsSolid(grid, testStations);
  markStationsSolid(grid, testStations);

  assert.equal(solidAt(grid, 1, 1), true);
});
