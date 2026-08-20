/**
 * updatePlayer is the most timing-sensitive pure logic in the engine, and the
 * bugs it can have are the ones you cannot see in a screenshot: half a tile of
 * drift per step, a stutter every time a move completes, a wall you pass
 * through when the frame rate dips. All of them are testable without a DOM,
 * because the whole module takes dtMs as an argument rather than reading a
 * clock.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { parseMap } from "../src/engine/tilemap.js";
import { createPlayer, updatePlayer, MOVE_MS } from "../src/engine/player.js";
import { TILE_SIZE } from "../src/content/sprites.js";

const legend = {
  ".": { terrain: "grass" },
  "T": { terrain: "grass", overlay: "tree_green", solid: true },
};

/**
 * 5 x 3, with a tree at (3, 1):
 *   . . . . .
 *   . . . T .
 *   . . . . .
 */
function fixture() {
  return parseMap(
    { name: "Player fixture", spawn: { x: 1, y: 1 }, zones: [], rows: [".....", "...T.", "....."] },
    legend
  );
}

/** An input stub. `held` is a direction vector or null. */
function stubInput(held) {
  return { direction: () => held };
}

const RIGHT = { dx: 1, dy: 0 };
const UP = { dx: 0, dy: -1 };

test("one press moves exactly one tile over MOVE_MS", () => {
  const grid = fixture();
  const player = createPlayer({ x: 1, y: 1 });

  updatePlayer(player, stubInput(RIGHT), grid, MOVE_MS / 2);
  assert.equal(player.moving, true, "half way through, still moving");
  assert.equal(player.tileX, 1, "the tile only changes on landing");
  assert.equal(player.pxX, 1.5 * TILE_SIZE, "and the pixels are half way there");

  updatePlayer(player, stubInput(null), grid, MOVE_MS / 2);
  assert.equal(player.moving, false);
  assert.equal(player.tileX, 2);
  assert.equal(player.tileY, 1);
  assert.equal(player.pxX, 2 * TILE_SIZE);
});

test("a blocked target does not move the player but does turn them", () => {
  const grid = fixture();
  const player = createPlayer({ x: 2, y: 1 }); // the tree is at (3, 1)

  updatePlayer(player, stubInput(RIGHT), grid, MOVE_MS);

  assert.equal(player.tileX, 2, "did not enter the tree");
  assert.equal(player.moving, false);
  assert.equal(player.facing, "right", "but walking into a tree still turns you to look at it");
  assert.equal(player.pxX, 2 * TILE_SIZE, "and leaves them exactly on the tile");
});

test("leftover time carries into the next tile while a direction is held", () => {
  const grid = fixture();
  const player = createPlayer({ x: 0, y: 1 });
  const input = stubInput(RIGHT);

  updatePlayer(player, input, grid, MOVE_MS + 30);

  assert.equal(player.tileX, 1, "landed on the first tile");
  assert.equal(player.moving, true, "and set off for the next one in the same frame");
  assert.equal(player.toX, 2);
  assert.equal(player.elapsed, 30, "carrying the leftover 30ms, rather than dropping it");
});

test("a released direction stops the player exactly on a tile boundary", () => {
  const grid = fixture();
  const player = createPlayer({ x: 1, y: 1 });

  updatePlayer(player, stubInput(RIGHT), grid, 90);
  assert.equal(player.moving, true);

  // Key released mid-step: the step in progress still finishes.
  updatePlayer(player, stubInput(null), grid, 90);
  assert.equal(player.moving, false);
  assert.equal(player.tileX, 2);
  assert.equal(player.pxX, 2 * TILE_SIZE, "no fraction of a tile left over");

  updatePlayer(player, stubInput(null), grid, 500);
  assert.equal(player.tileX, 2, "and nothing moves while nothing is held");
  assert.equal(player.pxX, 2 * TILE_SIZE);
});

test("a large dtMs does not skip past a solid tile", () => {
  const grid = fixture();
  const player = createPlayer({ x: 1, y: 1 });

  // Ten tiles' worth of time in one frame, with a tree two tiles away.
  updatePlayer(player, stubInput(RIGHT), grid, MOVE_MS * 10);

  assert.equal(player.tileX, 2, "stopped at the tile before the tree");
  assert.equal(player.moving, false);
  assert.equal(player.pxX, 2 * TILE_SIZE);
});

test("a large dtMs does not skip past the edge of the map", () => {
  const grid = fixture();
  const player = createPlayer({ x: 1, y: 1 });

  updatePlayer(player, stubInput(UP), grid, MOVE_MS * 10);

  assert.equal(player.tileY, 0, "out of bounds is solid, so the border holds");
  assert.equal(player.moving, false);
  assert.equal(player.pxY, 0);
});
