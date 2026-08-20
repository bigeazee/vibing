/**
 * MAP PARSER
 * ==========
 *
 * Turns the human-editable map definition in src/content/map.js — an ASCII grid
 * plus a legend — into flat typed layers the engine can index in O(1).
 *
 * Pure. No DOM access. Importable in plain Node for tests.
 *
 * Every validation failure throws with a message that names the row, the column
 * and the offending character, because the person who hits it is most likely a
 * non-developer who has just edited a row by hand.
 */

import { spriteExists, isOverlay } from "../content/sprites.js";

/** Flat array index of a tile. The one place row-major order is written down. */
export function index(width, x, y) {
  return y * width + x;
}

/**
 * @param {object} mapDef  { name, spawn: {x, y}, zones: [{id, from, to}], rows: string[] }
 * @param {object} legend  character -> { terrain, overlay?, solid? }
 * @returns {{
 *   width: number, height: number, spawn: {x: number, y: number},
 *   terrain: string[], overlay: (string|null)[], solid: Uint8Array,
 *   zones: {id: number, from: number, to: number}[],
 *   zoneAt: (x: number, y: number) => number
 * }}
 * @throws {Error} on any malformed map or legend — never returns a half-valid grid.
 */
export function parseMap(mapDef, legend) {
  if (!mapDef || typeof mapDef !== "object") {
    throw new Error("parseMap: mapDef must be an object.");
  }
  if (!legend || typeof legend !== "object") {
    throw new Error("parseMap: legend must be an object of character -> tile definition.");
  }

  const rows = mapDef.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("parseMap: mapDef.rows must be a non-empty array of strings.");
  }

  validateLegend(legend);

  const width = rows[0].length;
  const height = rows.length;
  if (width === 0) {
    throw new Error("parseMap: map row 0 is empty. A map needs at least one column.");
  }

  const terrain = new Array(width * height);
  const overlay = new Array(width * height).fill(null);
  const solid = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (typeof row !== "string") {
      throw new Error(`parseMap: map row ${y} is not a string.`);
    }
    if (row.length !== width) {
      throw new Error(
        `parseMap: map row ${y} has ${row.length} characters but row 0 has ${width}. ` +
          `Every row must be the same length.`
      );
    }
    for (let x = 0; x < width; x++) {
      const char = row[x];
      const def = Object.prototype.hasOwnProperty.call(legend, char) ? legend[char] : undefined;
      if (!def) {
        throw new Error(
          `parseMap: map row ${y}, column ${x} (tile x=${x}, y=${y}): ` +
            `character "${char}" has no entry in the legend.`
        );
      }
      const i = index(width, x, y);
      terrain[i] = def.terrain;
      overlay[i] = def.overlay ?? null;
      solid[i] = def.solid ? 1 : 0;
    }
  }

  const zones = normaliseZones(mapDef.zones, width);
  const spawn = validateSpawn(mapDef.spawn, width, height, solid, rows);

  return {
    width,
    height,
    spawn,
    terrain,
    overlay,
    solid,
    zones,
    zoneAt(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return 0;
      for (const zone of zones) {
        if (x >= zone.from && x <= zone.to) return zone.id;
      }
      return 0;
    },
  };
}

/**
 * Check every legend entry up front, so an unused-but-broken entry still fails
 * loudly rather than waiting for someone to place it on the map.
 */
function validateLegend(legend) {
  for (const [char, def] of Object.entries(legend)) {
    if (!def || typeof def !== "object") {
      throw new Error(`parseMap: legend entry "${char}" must be an object, e.g. { terrain: "grass" }.`);
    }
    if (typeof def.terrain !== "string" || def.terrain === "") {
      throw new Error(
        `parseMap: legend entry "${char}" has no "terrain". ` +
          `Every legend entry needs an opaque terrain sprite name.`
      );
    }
    if (!spriteExists(def.terrain)) {
      throw new Error(
        `parseMap: legend entry "${char}" (terrain "${def.terrain}"): ` +
          `"${def.terrain}" is not a sprite name in src/content/sprites.js.`
      );
    }
    if (isOverlay(def.terrain)) {
      throw new Error(
        `parseMap: legend entry "${char}" (terrain "${def.terrain}"): ` +
          `"${def.terrain}" is an overlay sprite and cannot be used as a terrain tile. ` +
          `Move it to "overlay" and give this entry an opaque terrain.`
      );
    }
    if (def.overlay !== undefined && def.overlay !== null) {
      if (typeof def.overlay !== "string" || !spriteExists(def.overlay)) {
        throw new Error(
          `parseMap: legend entry "${char}" (overlay "${def.overlay}"): ` +
            `"${def.overlay}" is not a sprite name in src/content/sprites.js.`
        );
      }
    }
  }
}

/** Zones are inclusive tile-x ranges. Absent zones are legal — zoneAt then always returns 0. */
function normaliseZones(zones, width) {
  if (zones === undefined || zones === null) return [];
  if (!Array.isArray(zones)) {
    throw new Error("parseMap: mapDef.zones must be an array of { id, from, to }.");
  }
  return zones.map((zone, i) => {
    if (!zone || !Number.isInteger(zone.id) || !Number.isInteger(zone.from) || !Number.isInteger(zone.to)) {
      throw new Error(`parseMap: zone ${i} must be { id, from, to } with whole-number values.`);
    }
    if (zone.from > zone.to) {
      throw new Error(`parseMap: zone ${zone.id} has from=${zone.from} after to=${zone.to}.`);
    }
    if (zone.from < 0 || zone.to >= width) {
      throw new Error(
        `parseMap: zone ${zone.id} spans x=${zone.from}..${zone.to}, outside a map ${width} tiles wide.`
      );
    }
    return { id: zone.id, from: zone.from, to: zone.to };
  });
}

function validateSpawn(spawn, width, height, solid, rows) {
  if (!spawn || !Number.isInteger(spawn.x) || !Number.isInteger(spawn.y)) {
    throw new Error("parseMap: mapDef.spawn must be { x, y } with whole-number tile coordinates.");
  }
  if (spawn.x < 0 || spawn.y < 0 || spawn.x >= width || spawn.y >= height) {
    throw new Error(
      `parseMap: spawn (${spawn.x}, ${spawn.y}) is outside the map, which is ${width}x${height} tiles.`
    );
  }
  if (solid[index(width, spawn.x, spawn.y)] === 1) {
    throw new Error(
      `parseMap: spawn (${spawn.x}, ${spawn.y}) is on a solid tile ` +
        `(legend character "${rows[spawn.y][spawn.x]}").`
    );
  }
  return { x: spawn.x, y: spawn.y };
}
