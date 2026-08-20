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
  // Two posts with a space between them. Not solid: it reads as a way through,
  // and it is the look the zone gates will use later.
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
  // On the path, a couple of tiles in from the west end.
  spawn: { x: 5, y: 9 },
  // Two ranges so zoneAt() is exercised across a boundary. The real map's zones
  // arrive with the real map.
  zones: [
    { id: 1, from: 0, to: 19 },
    { id: 2, from: 20, to: 39 },
  ],
  // 40 columns x 20 rows. The tree line around the edge is the map border.
  rows: [
    "TtTYToTtTyTtTYToTtTyTtTYToTtTyTtTYToTtTy",
    "T.....,......*...,..........,.*........t",
    "Y,...[---+----]..y..T..,..*.o.....,....T",
    "T....|W,....,K|...,...*.t....,b....y...y",
    "o*Y..|,.C..,..|...*...Y.,.......Y..,...T",
    "T....|....P..L|....T..........,*.......t",
    "t..y.{---G----}.s........,t*...o....,..T",
    "T.....*..,%%......m.,s.*......%,....b..Y",
    "y.*1222222222222222222222222222222223,.T",
    "T..455555555q555555w5555555e5555r5556..o",
    "t..7888888888888888888888888888888889.,T",
    "T......*...,..........,.%%.......,.....t",
    "Y..*..,b....t....,..*..m....,.....T..*.T",
    "T,..y.<-->..,...*......,o.....s..m,....y",
    "o......,....*.....,..........t.........T",
    "T.,...T.*....o.......y..,*.........,Y..t",
    "t.b.*s..,t.....b...,.*...T....,.......*T",
    "T..,....m..b..,..Y..b....,.b.....o*.,..Y",
    "y........,...*......,.........*,.......T",
    "YToTtTyTtTYToTtTyTtTYToTtTyTtTYToTtTyTtT",
  ],
};
