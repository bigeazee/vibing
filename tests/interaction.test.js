/**
 * The rule this file exists to pin down: facing wins, adjacency is the
 * fallback, and diagonals never count. The fallback order is up, down, left,
 * right, and it has to be deterministic - two stations either side of the
 * player must always open the same one, or the same demo run twice in front of
 * an audience does two different things.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { facingTile, interactableFor, itemOnTile } from "../src/engine/interaction.js";

/** Anything with a tile counts. interaction.js must not know what these are. */
const item = (id, x, y) => ({ id, tile: { x, y } });

const player = (x, y, facing) => ({ tileX: x, tileY: y, facing });

test("facingTile follows the player's facing", () => {
  assert.deepEqual(facingTile(player(5, 5, "up")), { x: 5, y: 4 });
  assert.deepEqual(facingTile(player(5, 5, "down")), { x: 5, y: 6 });
  assert.deepEqual(facingTile(player(5, 5, "left")), { x: 4, y: 5 });
  assert.deepEqual(facingTile(player(5, 5, "right")), { x: 6, y: 5 });
});

test("itemOnTile finds an item by tile, or returns null", () => {
  const items = [item("a", 1, 1), item("b", 2, 2)];
  assert.equal(itemOnTile(items, 2, 2).id, "b");
  assert.equal(itemOnTile(items, 9, 9), null);
  assert.equal(itemOnTile([], 1, 1), null);
});

test("what you are facing wins over what is merely next to you", () => {
  // "up" is first in the fallback order, so this only passes if facing is
  // genuinely checked first rather than happening to be found first.
  const items = [item("above", 5, 4), item("right", 6, 5)];

  assert.equal(interactableFor(items, player(5, 5, "right")).id, "right");
  assert.equal(interactableFor(items, player(5, 5, "up")).id, "above");
});

test("with nothing in front, the fallback order is up, down, left, right", () => {
  const up = item("up", 5, 4);
  const down = item("down", 5, 6);
  const left = item("left", 4, 5);
  const right = item("right", 6, 5);

  // Face a tile with nothing on it, so only the fallback can answer, then peel
  // the candidates away one at a time.
  const facingRight = player(5, 5, "right");
  assert.equal(interactableFor([left, down, up], facingRight).id, "up", "up first");
  assert.equal(interactableFor([left, down], facingRight).id, "down", "then down");
  assert.equal(interactableFor([left], facingRight).id, "left", "then left");

  const facingUp = player(5, 5, "up");
  assert.equal(interactableFor([right], facingUp).id, "right", "then right");
});

test("the fallback order does not depend on the order of the items array", () => {
  const facingRight = player(5, 5, "right");
  const items = [item("left", 4, 5), item("down", 5, 6), item("up", 5, 4)];

  assert.equal(interactableFor(items, facingRight).id, "up");
  assert.equal(interactableFor(items.slice().reverse(), facingRight).id, "up");
});

test("nothing adjacent returns null", () => {
  assert.equal(interactableFor([item("far", 20, 20)], player(5, 5, "up")), null);
  assert.equal(interactableFor([], player(5, 5, "up")), null);
  assert.equal(interactableFor(null, player(5, 5, "up")), null);
});

test("a diagonal neighbour is not interactable", () => {
  const diagonals = [item("ne", 6, 4), item("nw", 4, 4), item("se", 6, 6), item("sw", 4, 6)];
  for (const facing of ["up", "down", "left", "right"]) {
    assert.equal(
      interactableFor(diagonals, player(5, 5, facing)),
      null,
      `a corner brush must not open a panel while facing ${facing}`
    );
  }
});

test("an item on the player's own tile is not interactable", () => {
  assert.equal(interactableFor([item("under", 5, 5)], player(5, 5, "up")), null);
});
