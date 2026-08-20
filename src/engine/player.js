/**
 * PLAYER
 * ======
 *
 * Grid-aligned movement with smooth interpolation. The player always starts and
 * ends on a tile centre and slides between them over MOVE_MS. While a move is in
 * progress further direction input is ignored, so you can never end up between
 * tiles.
 *
 * Leftover time from a finished move is carried into the next one. Without that
 * carry-over, held movement stutters by up to one frame per tile, which is
 * exactly the kind of thing that looks broken over a compressed video stream.
 *
 * Pure apart from mutating the player object it is handed: no DOM, no timers.
 */

import { TILE_SIZE } from "../content/sprites.js";
import { canEnter } from "./collision.js";

/**
 * Milliseconds to traverse one tile — roughly 5.5 tiles a second.
 * Exported because it will be tuned against the live talk. Never hardcode 180.
 */
export const MOVE_MS = 180;

const VECTOR_FACING = [
  { dx: 0, dy: -1, facing: "up" },
  { dx: 0, dy: 1, facing: "down" },
  { dx: -1, dy: 0, facing: "left" },
  { dx: 1, dy: 0, facing: "right" },
];

/**
 * @param {{x: number, y: number}} spawn tile coordinates
 * @returns {object} player state
 */
export function createPlayer(spawn) {
  const player = {
    tileX: spawn.x,
    tileY: spawn.y,
    pxX: spawn.x * TILE_SIZE,
    pxY: spawn.y * TILE_SIZE,
    moving: false,
    facing: "down",
    // Move in progress: where it started, where it ends, how far through it is.
    fromX: spawn.x,
    fromY: spawn.y,
    toX: spawn.x,
    toY: spawn.y,
    elapsed: 0,
  };
  return player;
}

/**
 * Advance the player by dtMs.
 *
 * @param {object} player state from createPlayer
 * @param {object|null} input anything with direction(); null means no input
 * @param {object} grid parseMap result
 * @param {number} dtMs elapsed milliseconds
 */
export function updatePlayer(player, input, grid, dtMs) {
  let remaining = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 0;

  // Normally one pass, occasionally two when a move completes mid-frame. The
  // guard only matters if a caller ignores the loop's dt clamp.
  for (let pass = 0; pass < 16; pass++) {
    if (!player.moving && !beginMove(player, input, grid)) break;

    player.elapsed += remaining;
    remaining = 0;

    if (player.elapsed < MOVE_MS) break;

    remaining = player.elapsed - MOVE_MS;
    land(player);
    if (remaining <= 0) break;
  }

  syncPixels(player);
}

/**
 * Try to start a move in the currently held direction.
 * Facing updates even when the target is blocked, so walking into a tree still
 * turns you to look at it.
 */
function beginMove(player, input, grid) {
  const direction = input && typeof input.direction === "function" ? input.direction() : null;
  if (!direction) return false;

  const step = VECTOR_FACING.find((v) => v.dx === direction.dx && v.dy === direction.dy);
  if (!step) return false;

  player.facing = step.facing;

  const targetX = player.tileX + step.dx;
  const targetY = player.tileY + step.dy;
  if (!canEnter(grid, targetX, targetY)) return false;

  player.fromX = player.tileX;
  player.fromY = player.tileY;
  player.toX = targetX;
  player.toY = targetY;
  player.moving = true;
  player.elapsed = 0;
  return true;
}

function land(player) {
  player.tileX = player.toX;
  player.tileY = player.toY;
  player.fromX = player.toX;
  player.fromY = player.toY;
  player.moving = false;
  player.elapsed = 0;
}

function syncPixels(player) {
  if (!player.moving) {
    player.pxX = player.tileX * TILE_SIZE;
    player.pxY = player.tileY * TILE_SIZE;
    return;
  }
  const t = Math.min(1, player.elapsed / MOVE_MS);
  player.pxX = (player.fromX + (player.toX - player.fromX) * t) * TILE_SIZE;
  player.pxY = (player.fromY + (player.toY - player.fromY) * t) * TILE_SIZE;
}
