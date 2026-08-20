/**
 * CAMERA
 * ======
 *
 * Pure. No DOM. Given where the player is, work out the top-left pixel of the
 * camera window.
 *
 * The rendering contract locks the player to the exact centre tile of the
 * viewport — (12, 7) of 25x15 — so the offset is half the view minus half a
 * tile, not half the view. That is why TILE_SIZE is imported here: centring on
 * the player's centre point rather than their top-left corner is what keeps the
 * player on a whole-tile boundary and stops the half-tile camera fudge that
 * makes pixel art shimmer.
 *
 * The result may be fractional while a move is interpolating. That is
 * deliberate: the renderer rounds at draw time so the world slides under a
 * pixel-locked player in whole-pixel steps.
 */

import { TILE_SIZE } from "../content/sprites.js";

/**
 * @param {object} view
 * @param {number} view.playerPxX player's TOP-LEFT pixel x, not their centre
 * @param {number} view.playerPxY player's TOP-LEFT pixel y, not their centre
 * @param {number} view.mapPxW    map width in pixels
 * @param {number} view.mapPxH    map height in pixels
 * @param {number} view.viewPxW   canvas width in pixels
 * @param {number} view.viewPxH   canvas height in pixels
 * @returns {{x: number, y: number}} top-left of the camera window, in pixels
 */
export function cameraTopLeft({ playerPxX, playerPxY, mapPxW, mapPxH, viewPxW, viewPxH }) {
  return {
    x: axis(playerPxX, mapPxW, viewPxW),
    y: axis(playerPxY, mapPxH, viewPxH),
  };
}

function axis(playerPx, mapPx, viewPx) {
  // A map narrower or shorter than the view cannot be scrolled, so centre it.
  if (mapPx <= viewPx) return (mapPx - viewPx) / 2;

  const centred = playerPx + TILE_SIZE / 2 - viewPx / 2;
  const max = mapPx - viewPx;
  if (centred < 0) return 0;
  if (centred > max) return max;
  return centred;
}
