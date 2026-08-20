/**
 * RENDERER
 * ========
 *
 * Draws the map and a list of entities onto the 400x240 logical canvas.
 *
 * Three rules keep it honest:
 *
 *   1. Every sprite is resolved through spriteRect() from the sprite contract.
 *      Atlas offsets are never computed here.
 *   2. Draw destinations are rounded to whole logical pixels. The camera may sit
 *      on a fraction mid-move; the world then slides in whole-pixel steps under a
 *      player who stays exactly on the centre tile.
 *   3. Only the visible window is drawn, plus one tile of bleed, so map size
 *      costs nothing at run time.
 */

import { TILE_SIZE, spriteRect } from "../content/sprites.js";

/** Shown where the map does not reach, which the camera clamp should prevent. */
const VOID_COLOUR = "#0d0f14";

/**
 * @param {HTMLCanvasElement} canvas the 400x240 logical canvas
 * @param {Record<string, HTMLImageElement>} images from loadAtlases
 * @returns {{ draw: (grid: object, camera: {x: number, y: number}, entities?: object[]) => void }}
 */
export function createRenderer(canvas, images) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("createRenderer: could not get a 2d context from the canvas.");
  }
  if (!images || typeof images !== "object") {
    throw new Error("createRenderer: images must be the object returned by loadAtlases().");
  }
  ctx.imageSmoothingEnabled = false;

  // spriteRect() allocates; the map asks for the same few hundred names every
  // frame, so resolve each one once.
  const rects = new Map();
  function rectFor(name) {
    let rect = rects.get(name);
    if (!rect) {
      rect = spriteRect(name);
      rects.set(name, rect);
    }
    return rect;
  }

  function blit(name, dx, dy) {
    const rect = rectFor(name);
    const image = images[rect.atlas];
    if (!image) {
      throw new Error(
        `Renderer has no loaded image for atlas "${rect.atlas}", needed by sprite "${name}".`
      );
    }
    ctx.drawImage(image, rect.sx, rect.sy, rect.w, rect.h, dx, dy, rect.w, rect.h);
  }

  function draw(grid, camera, entities = []) {
    const viewW = canvas.width;
    const viewH = canvas.height;

    // Whole-pixel camera: everything downstream lands on the pixel grid.
    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = VOID_COLOUR;
    ctx.fillRect(0, 0, viewW, viewH);

    const firstCol = clamp(Math.floor(camX / TILE_SIZE) - 1, 0, grid.width - 1);
    const lastCol = clamp(Math.floor((camX + viewW) / TILE_SIZE) + 1, 0, grid.width - 1);
    const firstRow = clamp(Math.floor(camY / TILE_SIZE) - 1, 0, grid.height - 1);
    const lastRow = clamp(Math.floor((camY + viewH) / TILE_SIZE) + 1, 0, grid.height - 1);

    // Terrain first: opaque, one tile per cell, no gaps.
    for (let y = firstRow; y <= lastRow; y++) {
      const rowStart = y * grid.width;
      const dy = y * TILE_SIZE - camY;
      for (let x = firstCol; x <= lastCol; x++) {
        blit(grid.terrain[rowStart + x], x * TILE_SIZE - camX, dy);
      }
    }

    // Then overlays, which have transparent pixels and need terrain underneath.
    for (let y = firstRow; y <= lastRow; y++) {
      const rowStart = y * grid.width;
      const dy = y * TILE_SIZE - camY;
      for (let x = firstCol; x <= lastCol; x++) {
        const name = grid.overlay[rowStart + x];
        if (name) blit(name, x * TILE_SIZE - camX, dy);
      }
    }

    // Entities last, in the order given.
    for (const entity of entities) {
      blit(entity.sprite, Math.round(entity.pxX) - camX, Math.round(entity.pxY) - camY);
    }
  }

  return { draw };
}

function clamp(value, low, high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}
