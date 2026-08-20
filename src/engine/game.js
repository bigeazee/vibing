/**
 * GAME LOOP
 * =========
 *
 * Wires the engine together and runs it. This module knows nothing about
 * stations, gates or any particular map — the map definition and legend are
 * handed in, so content can change without the engine changing. That is the rule
 * in CLAUDE.md and it is what makes adding a station a one-object edit.
 *
 * pause() and resume() exist for the panel UI that comes next: a panel must
 * freeze movement while it is open, without the game going black behind it.
 */

import { ATLASES, TILE_SIZE } from "../content/sprites.js";
import { loadAtlases } from "./assets.js";
import { parseMap } from "./tilemap.js";
import { createRenderer } from "./renderer.js";
import { createInput } from "./input.js";
import { createPlayer, updatePlayer } from "./player.js";
import { cameraTopLeft } from "./camera.js";

/**
 * Longest step the simulation will take in one frame. A backgrounded tab can
 * hand back a multi-second delta; without this clamp the player teleports
 * through walls on return.
 */
const MAX_DT_MS = 100;

/**
 * @param {HTMLCanvasElement} canvas 400x240 logical canvas
 * @param {{mapDef: object, legend: object}} content
 * @returns {Promise<{pause: () => void, resume: () => void, destroy: () => void}>}
 */
export async function startGame(canvas, { mapDef, legend }) {
  const grid = parseMap(mapDef, legend);
  const images = await loadAtlases(ATLASES);
  const renderer = createRenderer(canvas, images);
  const input = createInput();
  const player = createPlayer(grid.spawn);

  const mapPxW = grid.width * TILE_SIZE;
  const mapPxH = grid.height * TILE_SIZE;

  // Reused each frame so a 60fps loop allocates nothing.
  const playerEntity = { sprite: "player", pxX: player.pxX, pxY: player.pxY };
  const entities = [playerEntity];

  let frameId = null;
  let lastTime = now();
  let paused = false;
  let destroyed = false;

  function frame(timestamp) {
    if (destroyed) return;
    frameId = requestAnimationFrame(frame);

    const dtMs = Math.min(MAX_DT_MS, Math.max(0, timestamp - lastTime));
    lastTime = timestamp;

    if (!paused) {
      updatePlayer(player, input, grid, dtMs);
    }

    const camera = cameraTopLeft({
      playerPxX: player.pxX,
      playerPxY: player.pxY,
      mapPxW,
      mapPxH,
      viewPxW: canvas.width,
      viewPxH: canvas.height,
    });

    playerEntity.pxX = player.pxX;
    playerEntity.pxY = player.pxY;
    renderer.draw(grid, camera, entities);
  }

  frameId = requestAnimationFrame(frame);

  return {
    /** Freeze movement and input handling. Rendering continues. */
    pause() {
      paused = true;
    },

    /** Resume movement. The paused time is discarded rather than simulated. */
    resume() {
      if (destroyed || !paused) return;
      paused = false;
      lastTime = now();
    },

    /** Stop the loop and release every listener. Not restartable. */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      input.destroy();
    },
  };
}

function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : 0;
}
