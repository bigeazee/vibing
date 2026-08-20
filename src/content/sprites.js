/**
 * THE SPRITE SHEET CONTRACT
 * =========================
 *
 * This file is the single source of truth for every sprite in Vibing.
 *
 * Rules:
 *   1. Content and engine code refer to sprites BY NAME, never by atlas index.
 *      Write  sprite: "chest"   not   sprite: 130
 *   2. A test asserts that every sprite name referenced by any station or map
 *      layer exists in SPRITES. A typo fails the build rather than the site.
 *   3. To use a tile that is not named here, add it to SPRITES first. That is a
 *      one-line change and it is always the correct move.
 *
 * Atlas geometry (verified against the shipped PNGs, not assumed):
 *   - Both atlases are 192x176 px: 12 columns x 11 rows of 16x16 tiles, 132 tiles.
 *   - There is NO padding or spacing between tiles in tilemap_packed.png.
 *     (Kenney also ships a 1px-spaced tilemap.png. We do not use it, and it is
 *     not in this repo. Do not reintroduce it.)
 *   - Indices are ROW-MAJOR: index = row * 12 + col. This was verified by
 *     cropping all 132 tiles from each atlas and comparing them byte-for-byte
 *     against the pack's individual Tiles/tile_NNNN.png files.
 *
 * Art: Kenney "Tiny Town" and "Tiny Dungeon", CC0. See CREDITS.md.
 */

/** Every tile in both atlases is 16x16 px. */
export const TILE_SIZE = 16;

/**
 * The two atlases. `src` is relative to the site root (where index.html lives).
 */
export const ATLASES = {
  town: {
    src: "assets/kenney-tiny-town/tilemap_packed.png",
    cols: 12,
    rows: 11,
    count: 132,
  },
  dungeon: {
    src: "assets/kenney-tiny-dungeon/tilemap_packed.png",
    cols: 12,
    rows: 11,
    count: 132,
  },
};

/**
 * Named sprites: name -> [atlasKey, tileIndex].
 *
 * Names describe what the art *is* (chest, signpost, monitor), not what a
 * particular station uses it for. That keeps them reusable when the map changes.
 *
 * Tiny Town has no character sprites, so the player and all NPCs come from
 * Tiny Dungeon. The two packs share a palette and outline style and sit together
 * on one map without clashing.
 */
export const SPRITES = {
  // ---------------------------------------------------------------- terrain
  grass: ["town", 0],
  grass_clover: ["town", 1],
  grass_flowers: ["town", 2],
  grass_gravel: ["town", 43],

  // A dirt path drawn as a 3x3 nine-slice: the edge and corner tiles carry the
  // grass border, `path` is the plain middle. Compass suffixes say which side
  // the GRASS is on, so `path_n` is the top edge of a path patch. Verified by
  // measuring grass-pixel mass per quadrant, not by eye.
  // The four `path_tuft_*` tiles are plain path with a small grass tuft in the
  // named corner - scatter them to break up large paved areas.
  path_nw: ["town", 12],
  path_n: ["town", 13],
  path_ne: ["town", 14],
  path_w: ["town", 24],
  path: ["town", 25],
  path_e: ["town", 26],
  path_sw: ["town", 36],
  path_s: ["town", 37],
  path_se: ["town", 38],
  path_tuft_nw: ["town", 39],
  path_tuft_ne: ["town", 40],
  path_tuft_se: ["town", 41],
  path_tuft_sw: ["town", 42],

  // ---------------------------------------------------------------- foliage
  tree_green: ["town", 4],
  tree_green_alt: ["town", 16],
  tree_green_round: ["town", 28],
  tree_orange: ["town", 3],
  tree_orange_alt: ["town", 15],
  tree_orange_round: ["town", 27],
  bush: ["town", 5],
  sapling: ["town", 17],
  mushrooms: ["town", 29],

  // ------------------------------------------------------------------ fence
  // Wooden fencing. Connectivity below was derived by testing which tile edges
  // carry opaque pixels, so these names describe how the pieces actually join:
  //   fence_h        W-E    fence_v          N-S
  //   fence_h_post   W-E (with an upright post)
  //   fence_h_end_left  E only     fence_h_end_right  W only
  //   fence_v_top       S only     fence_v_bottom     N only
  //   fence_corner_tl  S+E   fence_corner_tr  S+W
  //   fence_corner_bl  N+E   fence_corner_br  N+W
  // `fence_gap` is two posts with a space between them: the intended look for a
  // zone gate, because it reads as a way through rather than a wall.
  fence_h: ["town", 81],
  fence_h_end_left: ["town", 80],
  fence_h_end_right: ["town", 82],
  fence_v: ["town", 56],
  fence_v_alt: ["town", 58],
  fence_v_alt2: ["town", 59],
  fence_v_top: ["town", 47],
  fence_v_bottom: ["town", 71],
  fence_corner_tl: ["town", 44],
  fence_corner_tr: ["town", 46],
  fence_corner_bl: ["town", 68],
  fence_corner_br: ["town", 70],
  fence_h_post: ["town", 45],
  fence_gap: ["town", 69],

  // -------------------------------------------------------------- buildings
  wall_orange: ["town", 72],
  wall_orange_alt: ["town", 73],
  wall_orange_doorway: ["town", 74],
  wall_white: ["town", 76],
  wall_white_alt: ["town", 77],
  wall_white_doorway: ["town", 78],
  window_orange: ["town", 84],
  door_orange: ["town", 85],
  door_orange_wide: ["town", 86],
  window_white: ["town", 88],
  door_white: ["town", 89],
  door_white_wide: ["town", 90],
  roof_blue_top: ["town", 48],
  roof_blue: ["town", 60],
  roof_blue_peak: ["town", 63],
  roof_red_top: ["town", 52],
  roof_red: ["town", 64],
  roof_red_peak: ["town", 67],
  awning: ["town", 92],

  // ------------------------------------------------- stone / industrial (z3)
  floor_stone: ["dungeon", 37],
  floor_stone_alt: ["dungeon", 36],
  floor_wood: ["dungeon", 48],
  floor_wood_speck: ["dungeon", 49],
  wall_brick: ["dungeon", 40],
  wall_brick_alt: ["dungeon", 57],
  wall_brick_alt2: ["dungeon", 58],
  door_wood: ["dungeon", 46],
  door_wood_open: ["dungeon", 45],
  bars: ["dungeon", 76],
  rail: ["dungeon", 70],

  // ------------------------------------------------------------------ props
  // Interactable station objects and scenery. `plaque` is the signpost used for
  // the zone plaques that make gate answers discoverable in-zone.
  plaque: ["town", 83],
  chest: ["town", 130],
  chest_open: ["town", 131],
  chest_wood: ["dungeon", 89],
  chest_locked: ["dungeon", 90],
  chest_wood_open: ["dungeon", 91],
  well: ["town", 104],
  basket: ["town", 107],
  log: ["town", 106],
  beehive: ["town", 94],
  crate: ["dungeon", 63],
  table: ["dungeon", 72],
  anvil: ["dungeon", 74],
  terminal: ["dungeon", 55],
  server: ["dungeon", 54],
  barrel: ["dungeon", 82],
  book: ["dungeon", 66],
  torch_wall: ["dungeon", 29],
  potion_green: ["dungeon", 114],
  potion_red: ["dungeon", 115],
  potion_blue: ["dungeon", 116],

  // ------------------------------------------------------------- characters
  // Single front-facing frame each. There are NO directional variants and NO
  // walk-cycle frames in these packs. Engine code must not assume either exists.
  player: ["dungeon", 98],
  npc_knight: ["dungeon", 97],
  npc_knight_helm: ["dungeon", 96],
  npc_wizard: ["dungeon", 84],
  npc_villager: ["dungeon", 85],
  npc_ranger: ["dungeon", 99],
  npc_elder: ["dungeon", 100],
};

/**
 * Sprites that contain transparent pixels and therefore CANNOT be used as a base
 * terrain tile - drawn on their own they show the void behind them. Put these in
 * the map's object layer, over an opaque terrain tile.
 *
 * Derived by scanning the alpha channel of all 98 named sprites, not by eye.
 * If you add a sprite with any transparency, add its name here too. The content
 * validation test uses this to reject an overlay sprite in a terrain layer.
 */
export const OVERLAY_SPRITES = new Set([
  "anvil", "awning", "barrel", "bars", "basket", "beehive", "book", "bush",
  "chest", "chest_locked", "chest_open", "chest_wood", "chest_wood_open",
  "crate", "fence_corner_bl", "fence_corner_br", "fence_corner_tl",
  "fence_corner_tr", "fence_gap", "fence_h", "fence_h_end_left",
  "fence_h_end_right", "fence_h_post", "fence_v", "fence_v_alt",
  "fence_v_alt2", "fence_v_bottom", "fence_v_top", "log", "mushrooms",
  "npc_elder", "npc_knight", "npc_knight_helm", "npc_ranger", "npc_villager",
  "npc_wizard", "plaque", "player", "potion_blue", "potion_green", "potion_red",
  "rail", "sapling", "server", "table", "terminal", "tree_green",
  "tree_green_alt", "tree_green_round", "tree_orange", "tree_orange_alt",
  "tree_orange_round", "wall_orange_doorway", "wall_white_doorway", "well",
]);

/** True if `name` must be drawn over a terrain tile rather than as one. */
export function isOverlay(name) {
  return OVERLAY_SPRITES.has(name);
}

/** True if `name` is a sprite defined in this contract. */
export function spriteExists(name) {
  return Object.prototype.hasOwnProperty.call(SPRITES, name);
}

/** Every defined sprite name, sorted. Used by the content validation test. */
export function spriteNames() {
  return Object.keys(SPRITES).sort();
}

/**
 * Resolve a sprite name to everything a canvas drawImage call needs.
 *
 * @param {string} name a key of SPRITES
 * @returns {{atlas: string, src: string, sx: number, sy: number, w: number, h: number}}
 * @throws {Error} if the name is not in the contract — fail loudly, never draw
 *                 a silent wrong tile.
 */
export function spriteRect(name) {
  const entry = SPRITES[name];
  if (!entry) {
    throw new Error(
      `Unknown sprite "${name}". Add it to SPRITES in src/content/sprites.js.`
    );
  }
  const [atlasKey, index] = entry;
  const atlas = ATLASES[atlasKey];
  if (!atlas) {
    throw new Error(`Sprite "${name}" refers to unknown atlas "${atlasKey}".`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= atlas.count) {
    throw new Error(
      `Sprite "${name}" has index ${index}, outside atlas "${atlasKey}" (0..${atlas.count - 1}).`
    );
  }
  return {
    atlas: atlasKey,
    src: atlas.src,
    sx: (index % atlas.cols) * TILE_SIZE,
    sy: Math.floor(index / atlas.cols) * TILE_SIZE,
    w: TILE_SIZE,
    h: TILE_SIZE,
  };
}
