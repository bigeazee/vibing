/**
 * COLLISION
 * =========
 *
 * Three small pure predicates over the grid returned by parseMap. Kept separate
 * from the player so they can be tested in plain Node with no DOM and no timing.
 *
 * The rule that matters: out of bounds is SOLID. The map's own border is belt
 * and braces; this is the braces, and it is what guarantees the camera never
 * has to show the void.
 */

import { index } from "./tilemap.js";

/** True if (x, y) is a tile inside the map. */
export function isInBounds(grid, x, y) {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
}

/** True if (x, y) blocks movement. Anything outside the map counts as solid. */
export function isSolid(grid, x, y) {
  if (!isInBounds(grid, x, y)) return true;
  return grid.solid[index(grid.width, x, y)] === 1;
}

/** True if the player may stand on (x, y). */
export function canEnter(grid, x, y) {
  return isInBounds(grid, x, y) && !isSolid(grid, x, y);
}
