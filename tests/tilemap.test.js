/**
 * parseMap is the gate between a hand-edited text file and the engine. Every one
 * of its refusals gets its own test, and every test asserts on the message,
 * because a vague error here lands on someone who does not write code.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { index, parseMap } from "../src/engine/tilemap.js";

const legend = {
  ".": { terrain: "grass" },
  ",": { terrain: "grass_clover" },
  "T": { terrain: "grass", overlay: "tree_green", solid: true },
  "s": { terrain: "grass", overlay: "sapling" },
};

/** 5 x 3, one tree at (3, 1), one sapling at (1, 2) that does not block. */
function validMap(overrides = {}) {
  return {
    name: "Fixture",
    spawn: { x: 1, y: 1 },
    zones: [
      { id: 1, from: 0, to: 1 },
      { id: 2, from: 3, to: 4 },
    ],
    rows: [".....", ".,.T.", ".s..."],
    ...overrides,
  };
}

test("index() is row-major", () => {
  assert.equal(index(5, 0, 0), 0);
  assert.equal(index(5, 3, 1), 8);
  assert.equal(index(5, 4, 2), 14);
});

test("a valid map parses to the right shape", () => {
  const grid = parseMap(validMap(), legend);

  assert.equal(grid.width, 5);
  assert.equal(grid.height, 3);
  assert.deepEqual(grid.spawn, { x: 1, y: 1 });

  assert.equal(grid.terrain.length, 15);
  assert.equal(grid.overlay.length, 15);
  assert.equal(grid.solid.length, 15);
  assert.ok(grid.solid instanceof Uint8Array);
});

test("terrain is never null and maps characters to sprite names", () => {
  const grid = parseMap(validMap(), legend);

  for (let i = 0; i < grid.terrain.length; i++) {
    assert.equal(typeof grid.terrain[i], "string", `terrain[${i}] is not a sprite name`);
  }
  assert.equal(grid.terrain[index(5, 0, 0)], "grass");
  assert.equal(grid.terrain[index(5, 1, 1)], "grass_clover");
  assert.equal(grid.terrain[index(5, 3, 1)], "grass");
});

test("overlay carries the prop layer and is null everywhere else", () => {
  const grid = parseMap(validMap(), legend);

  assert.equal(grid.overlay[index(5, 3, 1)], "tree_green");
  assert.equal(grid.overlay[index(5, 1, 2)], "sapling");
  assert.equal(grid.overlay[index(5, 0, 0)], null);
  assert.equal(grid.overlay.filter((name) => name !== null).length, 2);
});

test("solid is set only where the legend says solid", () => {
  const grid = parseMap(validMap(), legend);

  assert.equal(grid.solid[index(5, 3, 1)], 1, "the tree should block");
  assert.equal(grid.solid[index(5, 1, 2)], 0, "the sapling should not block");
  assert.equal(grid.solid.reduce((total, value) => total + value, 0), 1);
});

test("zoneAt() returns the zone inside a range and 0 outside every range", () => {
  const grid = parseMap(validMap(), legend);

  assert.equal(grid.zoneAt(0, 0), 1);
  assert.equal(grid.zoneAt(1, 2), 1);
  assert.equal(grid.zoneAt(3, 0), 2);
  assert.equal(grid.zoneAt(4, 1), 2);

  assert.equal(grid.zoneAt(2, 0), 0, "x=2 is in the gap between the two zones");
  assert.equal(grid.zoneAt(-1, 0), 0, "off the west edge");
  assert.equal(grid.zoneAt(0, -1), 0, "off the north edge");
  assert.equal(grid.zoneAt(99, 0), 0, "off the east edge");
});

test("a map with no zones parses, and zoneAt() is 0 everywhere", () => {
  const grid = parseMap(validMap({ zones: undefined }), legend);

  assert.deepEqual(grid.zones, []);
  assert.equal(grid.zoneAt(0, 0), 0);
});

// --------------------------------------------------------------- refusals ---

test("throws when rows are not all the same length", () => {
  const mapDef = validMap({ rows: [".....", ".,.T", "....."] });

  assert.throws(
    () => parseMap(mapDef, legend),
    (error) => {
      assert.match(error.message, /row 1 has 4 characters but row 0 has 5/);
      assert.match(error.message, /Every row must be the same length/);
      return true;
    }
  );
});

test("throws, naming row, column and character, on a character not in the legend", () => {
  const mapDef = validMap({ rows: [".....", ".,.T.", "..Z.."] });

  assert.throws(
    () => parseMap(mapDef, legend),
    (error) => {
      assert.match(error.message, /row 2, column 2 \(tile x=2, y=2\)/);
      assert.match(error.message, /character "Z" has no entry in the legend/);
      return true;
    }
  );
});

test("throws when a legend terrain is not a sprite name", () => {
  const broken = { ...legend, ".": { terrain: "grazz" } };

  assert.throws(
    () => parseMap(validMap(), broken),
    (error) => {
      assert.match(error.message, /legend entry "\." \(terrain "grazz"\)/);
      assert.match(error.message, /not a sprite name in src\/content\/sprites\.js/);
      return true;
    }
  );
});

test("throws when a legend terrain is an overlay sprite", () => {
  const broken = { ...legend, ".": { terrain: "tree_green" } };

  assert.throws(
    () => parseMap(validMap(), broken),
    (error) => {
      assert.match(error.message, /legend entry "\." \(terrain "tree_green"\)/);
      assert.match(error.message, /is an overlay sprite and cannot be used as a terrain tile/);
      assert.match(error.message, /Move it to "overlay"/);
      return true;
    }
  );
});

test("throws when a legend overlay is not a sprite name", () => {
  const broken = { ...legend, "T": { terrain: "grass", overlay: "treee", solid: true } };

  assert.throws(
    () => parseMap(validMap(), broken),
    (error) => {
      assert.match(error.message, /legend entry "T" \(overlay "treee"\)/);
      assert.match(error.message, /not a sprite name in src\/content\/sprites\.js/);
      return true;
    }
  );
});

test("throws when a legend entry has no terrain at all", () => {
  const broken = { ...legend, "?": { overlay: "chest", solid: true } };

  assert.throws(
    () => parseMap(validMap(), broken),
    (error) => {
      assert.match(error.message, /legend entry "\?" has no "terrain"/);
      return true;
    }
  );
});

test("throws when spawn is out of bounds", () => {
  const mapDef = validMap({ spawn: { x: 9, y: 1 } });

  assert.throws(
    () => parseMap(mapDef, legend),
    (error) => {
      assert.match(error.message, /spawn \(9, 1\) is outside the map, which is 5x3 tiles/);
      return true;
    }
  );
});

test("throws when spawn is on a solid tile, naming the legend character", () => {
  const mapDef = validMap({ spawn: { x: 3, y: 1 } });

  assert.throws(
    () => parseMap(mapDef, legend),
    (error) => {
      assert.match(error.message, /spawn \(3, 1\) is on a solid tile \(legend character "T"\)/);
      return true;
    }
  );
});

// ------------------------------------------------------------- demo map -----

test("the shipped demo map parses and spawns on walkable ground", async () => {
  const { mapDef, legend: demoLegend } = await import("../src/content/map.js");
  const grid = parseMap(mapDef, demoLegend);

  assert.equal(grid.width, 40);
  assert.equal(grid.height, 20);
  assert.equal(grid.solid[index(grid.width, grid.spawn.x, grid.spawn.y)], 0);
});

test("the demo map has a fully solid border, so the player can never walk off it", async () => {
  const { mapDef, legend: demoLegend } = await import("../src/content/map.js");
  const grid = parseMap(mapDef, demoLegend);

  for (let x = 0; x < grid.width; x++) {
    assert.equal(grid.solid[index(grid.width, x, 0)], 1, `top border open at x=${x}`);
    assert.equal(grid.solid[index(grid.width, x, grid.height - 1)], 1, `bottom border open at x=${x}`);
  }
  for (let y = 0; y < grid.height; y++) {
    assert.equal(grid.solid[index(grid.width, 0, y)], 1, `left border open at y=${y}`);
    assert.equal(grid.solid[index(grid.width, grid.width - 1, y)], 1, `right border open at y=${y}`);
  }
});
