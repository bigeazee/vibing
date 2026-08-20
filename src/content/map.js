/**
 * THE DEMO MAP
 * ============
 *
 * Throwaway scaffolding that proves the engine works: the real three-zone map
 * replaces this file wholesale in a later work package. It is 40x20 tiles, which
 * is wider AND taller than the 25x15 viewport, so the camera has to scroll and
 * clamp on both axes.
 *
 * The format is deliberately an ASCII grid with a legend rather than an array of
 * tile numbers, because someone who does not write code has to be able to open
 * this file, see the shape of the map, and move a tree.
 *
 * To edit it:
 *   - every row must be exactly the same length; parseMap throws if not
 *   - every character must appear in `legend` below
 *   - `terrain` must be an opaque sprite, `overlay` is drawn on top of it
 *   - `solid: true` blocks movement
 *   - sprite names come from src/content/sprites.js and nowhere else
 *
 * THE TWO BARRIERS ARE LORE-BEARING. Columns 13 and 26 are a solid fence from
 * the top border to the bottom border, pierced by exactly one walkable tile
 * each, at row 9. Those two tiles are the gates in src/content/gates.js, and
 * they are the only way between the zones. A single walkable tile anywhere else
 * in either column lets the player skip a zone's content, which is the one thing
 * the gate mechanic exists to prevent. tests/zones.test.js flood-fills the map
 * from the spawn and fails if that ever happens, so do not take the fence apart
 * to make room for something.
 *
 * Stations and gates are NOT in this grid. They are drawn from stations.js and
 * gates.js as entities, so adding a station stays a one-object edit to one file.
 * Their tiles must therefore be walkable ground here - markStationsSolid() and
 * lockGates() in src/engine/zones.js make them solid at boot, and they throw if
 * the map already did.
 */

/**
 * character -> { terrain, overlay?, solid? }
 *
 * The path digits are laid out like a phone keypad, so the block reads the same
 * way the tiles sit on the map:
 *
 *     1 2 3     top-left, top, top-right
 *     4 5 6     left, middle, right
 *     7 8 9     bottom-left, bottom, bottom-right
 *
 * The compass suffixes in the sprite names say which side the GRASS is on, so
 * `path_n` (the grass is to the north) is the TOP edge of a paved patch.
 */
export const legend = {
  // -- ground -------------------------------------------------------------
  ".": { terrain: "grass" },
  ",": { terrain: "grass_clover" },
  "*": { terrain: "grass_flowers" },
  "%": { terrain: "grass_gravel" },

  // -- dirt path, as a nine-slice ------------------------------------------
  "1": { terrain: "path_nw" },
  "2": { terrain: "path_n" },
  "3": { terrain: "path_ne" },
  "4": { terrain: "path_w" },
  "5": { terrain: "path" },
  "6": { terrain: "path_e" },
  "7": { terrain: "path_sw" },
  "8": { terrain: "path_s" },
  "9": { terrain: "path_se" },
  "q": { terrain: "path_tuft_nw" },
  "w": { terrain: "path_tuft_ne" },
  "e": { terrain: "path_tuft_se" },
  "r": { terrain: "path_tuft_sw" },

  // -- foliage --------------------------------------------------------------
  "T": { terrain: "grass", overlay: "tree_green", solid: true },
  "t": { terrain: "grass", overlay: "tree_green_alt", solid: true },
  "o": { terrain: "grass", overlay: "tree_green_round", solid: true },
  "Y": { terrain: "grass", overlay: "tree_orange", solid: true },
  "y": { terrain: "grass", overlay: "tree_orange_alt", solid: true },
  "b": { terrain: "grass", overlay: "bush", solid: true },
  "s": { terrain: "grass", overlay: "sapling" },
  "m": { terrain: "grass_clover", overlay: "mushrooms" },

  // -- fencing --------------------------------------------------------------
  // Corner names describe which way the piece joins: tl connects south+east,
  // tr south+west, bl north+east, br north+west.
  "-": { terrain: "grass", overlay: "fence_h", solid: true },
  "|": { terrain: "grass", overlay: "fence_v", solid: true },
  "+": { terrain: "grass", overlay: "fence_h_post", solid: true },
  "[": { terrain: "grass", overlay: "fence_corner_tl", solid: true },
  "]": { terrain: "grass", overlay: "fence_corner_tr", solid: true },
  "{": { terrain: "grass", overlay: "fence_corner_bl", solid: true },
  "}": { terrain: "grass", overlay: "fence_corner_br", solid: true },
  "<": { terrain: "grass", overlay: "fence_h_end_left", solid: true },
  ">": { terrain: "grass", overlay: "fence_h_end_right", solid: true },
  // Two posts with a space between them. Not solid: it reads as a way through.
  "G": { terrain: "grass", overlay: "fence_gap" },

  // -- props ----------------------------------------------------------------
  "C": { terrain: "grass", overlay: "chest", solid: true },
  "P": { terrain: "grass", overlay: "plaque", solid: true },
  "W": { terrain: "grass", overlay: "well", solid: true },
  "L": { terrain: "grass", overlay: "log", solid: true },
  "K": { terrain: "grass", overlay: "basket", solid: true },
};

export const mapDef = {
  name: "Demo",
  // On the path in Zone 1, a few tiles in from the west end.
  spawn: { x: 4, y: 9 },
  // Three inclusive tile-x ranges covering the whole map. Each barrier column
  // belongs to the zone BEHIND it, so a gate tile is the last tile of the zone
  // you are leaving rather than the first tile of the one you have not earned.
  zones: [
    { id: 1, from: 0, to: 13 },
    { id: 2, from: 14, to: 26 },
    { id: 3, from: 27, to: 39 },
  ],
  // 40 columns x 20 rows. Trees are the map border; the two "|" columns at
  // x=13 and x=26 are the zone barriers, each pierced only at row 9.
  rows: [
    "TtTYToTtTyTtTYToTtTyTtTYToTtTyTtTYToTtTy", //  0
    "t.*...,....Y.|...,.....T*.|.,......*...T", //  1
    "T,T.....*o..,|..T..*...,..|..T*...,....t", //  2
    "Y..*..t,.....|*...,..y...*|..,......*y.T", //  3
    "T.,......*.b.|.t....*...,.|....*..o,...y", //  4
    "o.y.*...,....|.*...,....o.|.Y.,......*.T", //  5
    "T..s......T..|,...b..*...,|....b*...t..t", //  6
    "t....*...,...|..*...,.....|*...,......*T", //  7
    "T122222222222|222222222222|222222222223Y", //  8
    "y45555555q55555555w55555555555e5555r556T", //  9
    "T788888888888|888888888888|888888888889o", // 10
    "t......*...,.|....*...,...|..*...,.....T", // 11
    "T.*L..,..m...|...,.Y....s.|.,....T.*...t", // 12
    "YT......y...,|...m.*...,..|...*...,.o..T", // 13
    "T..*...,....Y|*...,......T|..,y.....*..y", // 14
    "o.,..o...*...|......b...,.|....*...,..bT", // 15
    "T...*...,..T.|.*o..,......|..m,......*.t", // 16
    "t.b,..t...*..|,......*t..,|.....T..t,..T", // 17
    "T....*...,...|..*...,.....|*...,......*Y", // 18
    "YToTtTyTtTYToTtTyTtTYToTtTyTtTYToTtTyTtT", // 19
  ],
};
