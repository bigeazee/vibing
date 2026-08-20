/**
 * GAME LOOP
 * =========
 *
 * Wires the engine together and runs it. This module knows nothing about
 * stations, gates or any particular map — the map definition and legend are
 * handed in, so content can change without the engine changing. That is the rule
 * in CLAUDE.md and it is what makes adding a station a one-object edit.
 *
 * pause() and resume() exist for the panel UI: a panel must freeze movement
 * while it is open, without the game going black behind it.
 *
 * `entities` and `onUpdate` are how the boot module gets content onto the screen
 * without the engine ever importing any. The caller owns the entities array and
 * may mutate the objects in it - swapping a gate's sprite when it unlocks, for
 * instance - and this module simply draws whatever is in there each frame,
 * underneath the player. Nothing here knows what a station or a gate is.
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
 * @param {object} content
 * @param {object} content.mapDef       the ASCII map definition
 * @param {object} content.legend       character -> tile definition
 * @param {object[]} [content.entities] drawn every frame, in order, under the
 *   player. The caller keeps the reference and may mutate it.
 * @param {(dtMs: number) => void} [content.onUpdate] called once a frame after
 *   the player is advanced, PAUSED OR NOT, so the boot module can keep polling
 *   input and the HUD while an overlay is open.
 * @returns {Promise<object>} the loop controls plus the player, grid and input
 *   the boot module needs to work out what the player is standing next to
 */
export async function startGame(canvas, { mapDef, legend, entities = [], onUpdate = null }) {
  const grid = parseMap(mapDef, legend);
  const images = await loadAtlases(ATLASES);
  const renderer = createRenderer(canvas, images);
  const input = createInput();
  const player = createPlayer(grid.spawn);

  const mapPxW = grid.width * TILE_SIZE;
  const mapPxH = grid.height * TILE_SIZE;

  // Reused each frame so a 60fps loop allocates nothing. drawList is refilled
  // rather than rebuilt: map, then the caller's entities, then the player last.
  const playerEntity = { sprite: "player", pxX: player.pxX, pxY: player.pxY };
  const drawList = [];

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

    // Runs while paused too. An open panel still needs its keys polled, and the
    // HUD still needs to be right the moment the panel closes.
    if (onUpdate) onUpdate(dtMs);

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

    drawList.length = 0;
    for (let i = 0; i < entities.length; i++) drawList.push(entities[i]);
    drawList.push(playerEntity);
    renderer.draw(grid, camera, drawList);
  }

  frameId = requestAnimationFrame(frame);

  return {
    /**
     * The live player state, the parsed grid and the input reader.
     *
     * Exposed because the boot module has to answer "what is the player next
     * to?" every frame, and it cannot without them. Read them; do not reach in
     * and move the player - that is what updatePlayer is for.
     */
    player,
    grid,
    input,

    /** True while movement is frozen. */
    isPaused() {
      return paused;
    },

    /**
     * Put the player back on the spawn tile, mid-step or not.
     *
     * Exists for the progress reset. Re-locking the gates while the player is
     * standing in Zone 2 would seal them in a zone they can never leave, and
     * CLAUDE.md is explicit that this game has no way to lose. A reset puts you
     * back at the start, which is what a reset means anyway.
     */
    respawn() {
      Object.assign(player, createPlayer(grid.spawn));
    },

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
