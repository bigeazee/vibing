/**
 * Collision is three lines of logic and one rule that has to hold everywhere:
 * outside the map is solid. If that ever slips, the player walks into the void
 * and the camera has nothing to draw.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { parseMap } from "../src/engine/tilemap.js";
import { canEnter, isInBounds, isSolid } from "../src/engine/collision.js";

const legend = {
  ".": { terrain: "grass" },
  "T": { terrain: "grass", overlay: "tree_green", solid: true },
  "s": { terrain: "grass", overlay: "sapling" },
};

/**
 * 4 x 3:
 *   . . . .
 *   . T s .
 *   . . . .
 */
const grid = parseMap(
  {
    name: "Collision fixture",
    spawn: { x: 0, y: 0 },
    zones: [],
    rows: ["....", ".Ts.", "...."],
  },
  legend
);

test("open ground is in bounds, not solid, and enterable", () => {
  assert.equal(isInBounds(grid, 0, 0), true);
  assert.equal(isSolid(grid, 0, 0), false);
  assert.equal(canEnter(grid, 0, 0), true);
});

test("a solid overlay blocks movement", () => {
  assert.equal(isInBounds(grid, 1, 1), true);
  assert.equal(isSolid(grid, 1, 1), true);
  assert.equal(canEnter(grid, 1, 1), false);
});

test("a non-solid overlay does not block movement", () => {
  assert.equal(isSolid(grid, 2, 1), false);
  assert.equal(canEnter(grid, 2, 1), true, "the sapling is scenery, not a wall");
});

test("out of bounds counts as solid on all four edges", () => {
  const outside = [
    ["west", -1, 1],
    ["north", 1, -1],
    ["east", grid.width, 1],
    ["south", 1, grid.height],
  ];

  for (const [edge, x, y] of outside) {
    assert.equal(isInBounds(grid, x, y), false, `${edge}: should be out of bounds`);
    assert.equal(isSolid(grid, x, y), true, `${edge}: out of bounds must be solid`);
    assert.equal(canEnter(grid, x, y), false, `${edge}: must not be enterable`);
  }
});

test("the corners just outside the map are solid too", () => {
  const corners = [
    [-1, -1],
    [grid.width, -1],
    [-1, grid.height],
    [grid.width, grid.height],
  ];

  for (const [x, y] of corners) {
    assert.equal(isSolid(grid, x, y), true, `(${x}, ${y}) must be solid`);
  }
});

test("the last row and column are still inside the map", () => {
  assert.equal(isInBounds(grid, grid.width - 1, grid.height - 1), true);
  assert.equal(canEnter(grid, grid.width - 1, grid.height - 1), true);
});
