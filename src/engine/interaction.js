/**
 * INTERACTION
 * ===========
 *
 * Works out what the player is standing next to. Pure: no DOM, no timers, and
 * deliberately no idea what a station or a gate is. It is generic over anything
 * carrying a `tile: {x, y}`, which is what lets the engine stay ignorant of
 * content while the boot module hands it stations and gates together.
 *
 * The resolution order is forgiving on purpose. This game is driven live in
 * front of an audience, and nobody should have to nudge the player round to get
 * the right facing before a panel will open. Facing wins if there is something
 * there; otherwise any orthogonal neighbour will do.
 */

/** Checked in this order when nothing is directly in front of the player. */
const NEIGHBOURS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

const FACING_VECTORS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/**
 * The tile the player is looking at.
 *
 * Uses the player's CURRENT tile, not their interpolated pixel position, so the
 * answer never changes half way through a step.
 *
 * @param {{tileX: number, tileY: number, facing: string}} player
 * @returns {{x: number, y: number}}
 */
export function facingTile(player) {
  const vector = FACING_VECTORS[player.facing] || FACING_VECTORS.down;
  return { x: player.tileX + vector.dx, y: player.tileY + vector.dy };
}

/**
 * The first item sitting on (x, y), or null.
 *
 * @param {{tile: {x: number, y: number}}[]} items
 * @param {number} x
 * @param {number} y
 */
export function itemOnTile(items, x, y) {
  if (!items) return null;
  for (const item of items) {
    if (item && item.tile && item.tile.x === x && item.tile.y === y) return item;
  }
  return null;
}

/**
 * The item the player may interact with right now, or null.
 *
 *   1. whatever is on the tile they are facing
 *   2. otherwise the first item up, down, left or right - in that order
 *   3. otherwise null
 *
 * Diagonals never count: a corner brush past a station must not pop a panel.
 *
 * @param {{tile: {x: number, y: number}}[]} items
 * @param {{tileX: number, tileY: number, facing: string}} player
 */
export function interactableFor(items, player) {
  if (!items || !player) return null;

  const front = facingTile(player);
  const faced = itemOnTile(items, front.x, front.y);
  if (faced) return faced;

  for (const { dx, dy } of NEIGHBOURS) {
    const found = itemOnTile(items, player.tileX + dx, player.tileY + dy);
    if (found) return found;
  }
  return null;
}
