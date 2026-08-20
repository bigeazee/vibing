/**
 * THE MAP
 * =======
 *
 * One continuous world, 92 x 20 tiles, laid out left to right as three zones:
 *
 *   Zone 1  x 0..30    meadow      open grass, a dirt lane, trees
 *   Zone 2  x 31..61   village     grass, a gravel plaza, RED roofs
 *   Zone 3  x 62..91   the works    wooden decking, grey brick, iron and fire
 *
 * The three zones are a difficulty curve made physical, so they are built out
 * of three deliberately different palettes. That is not decoration: on a
 * compressed video stream, "I am somewhere else now" has to land in one glance.
 *
 * WHY THE MATERIALS ARE SPLIT THE WAY THEY ARE. Zone 2 keeps the warm half of
 * the building set (red roofs, orange walls) on green grass; zone 3 inverts it,
 * putting the cool half (blue roofs, white walls, grey brick) on warm decking.
 * They were measured before they were chosen: floor_stone and wall_brick differ
 * by 14 in luminance and share a hue, so a stone floor under brick walls turns
 * an entire zone into one flat grey wash with no readable floor. Decking under
 * brick is a 39-luminance gap plus opposite hues, and it reads.
 *
 * The format is an ASCII grid plus a legend rather than an array of tile
 * numbers, because someone who does not write code has to be able to open this
 * file, see the shape of the map, and move a tree.
 *
 * To edit it:
 *   - every row must be exactly the same length; parseMap throws if not
 *   - every character must appear in `legend` below
 *   - `terrain` must be an opaque sprite, `overlay` is drawn on top of it
 *   - `solid: true` blocks movement
 *   - sprite names come from src/content/sprites.js and nowhere else
 *
 * THE TWO BARRIERS ARE LORE-BEARING. Columns 30 and 61 are a brick wall from
 * the top border to the bottom border, pierced by exactly one walkable tile
 * each, at row 10. Those two tiles are the gates in src/content/gates.js, and
 * they are the only way between the zones. A single walkable tile anywhere else
 * in either column lets the player skip a zone's content, which is the one
 * thing the gate mechanic exists to prevent. tests/zones.test.js and
 * tests/content.test.js both flood-fill the map from the spawn and fail if that
 * ever happens, so do not take a wall apart to make room for something.
 *
 * Stations, gates and plaques are NOT in this grid. They are drawn from
 * stations.js, gates.js and plaques.js as entities, so adding a station stays a
 * one-object edit to one file. Their tiles must therefore be walkable ground
 * here - markStationsSolid() and lockGates() in src/engine/zones.js make them
 * solid at boot, and they throw if the map already did.
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
  // -- ground ---------------------------------------------------------------
  ".": { terrain: "grass" },
  ",": { terrain: "grass_clover" },
  "*": { terrain: "grass_flowers" },
  "%": { terrain: "grass_gravel" },
  "#": { terrain: "floor_stone" },
  "=": { terrain: "floor_stone_alt" },
  "_": { terrain: "floor_wood" },
  ";": { terrain: "floor_wood_speck" },

  // -- dirt lane, as a nine-slice -------------------------------------------
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
  "O": { terrain: "grass", overlay: "tree_orange_round", solid: true },
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

  // -- zone 2 buildings -----------------------------------------------------
  // Four tiles tall, drawn top to bottom: roof edge, roof, upper wall, lower
  // wall. Zone 2 uses ONLY the red-and-orange half of the building set.
  "x": { terrain: "roof_red_top", solid: true },
  "X": { terrain: "roof_red_peak", solid: true },
  "R": { terrain: "roof_red", solid: true },
  "a": { terrain: "wall_orange_alt", solid: true },
  "A": { terrain: "wall_orange", solid: true },
  "d": { terrain: "window_orange", solid: true },
  "D": { terrain: "door_orange", solid: true },
  "~": { terrain: "grass", overlay: "awning", solid: true },

  // -- zone 3 structures ----------------------------------------------------
  // The cool half of the building set, plus brick, iron and fire.
  "u": { terrain: "roof_blue_top", solid: true },
  "V": { terrain: "roof_blue_peak", solid: true },
  "U": { terrain: "roof_blue", solid: true },
  "c": { terrain: "wall_white_alt", solid: true },
  "B": { terrain: "wall_white", solid: true },
  "h": { terrain: "window_white", solid: true },
  "H": { terrain: "door_white", solid: true },
  "M": { terrain: "wall_brick", solid: true },
  "N": { terrain: "wall_brick_alt", solid: true },
  "n": { terrain: "wall_brick_alt2", solid: true },
  "F": { terrain: "torch_wall", solid: true },
  "I": { terrain: "wall_brick", overlay: "bars", solid: true },
  "i": { terrain: "floor_wood", overlay: "rail", solid: true },

  // -- props ----------------------------------------------------------------
  // Scenery only. None of these is a station: every sprite a station uses is
  // deliberately absent from this list, so a prop can never be mistaken for
  // something you can press E at.
  "K": { terrain: "grass", overlay: "basket", solid: true },
  "L": { terrain: "grass", overlay: "log", solid: true },
  "C": { terrain: "grass", overlay: "crate", solid: true },
  "k": { terrain: "grass", overlay: "barrel", solid: true },
  "j": { terrain: "floor_wood", overlay: "crate", solid: true },
  "J": { terrain: "floor_wood", overlay: "barrel", solid: true },
};

export const mapDef = {
  name: "Vibing",
  // On the lane in zone 1, a few tiles in from the west end.
  spawn: { x: 3, y: 10 },
  // Three inclusive tile-x ranges covering the whole map. Each barrier column
  // belongs to the zone BEHIND it, so a gate tile is the last tile of the zone
  // you are leaving rather than the first tile of the one you have not earned.
  zones: [
    { id: 1, from: 0, to: 30 },
    { id: 2, from: 31, to: 61 },
    { id: 3, from: 62, to: 91 },
  ],
  // 92 columns x 20 rows. The two "M" columns at x=30 and x=61 are the zone
  // barriers, each pierced only at row 10.
  rows: [
    "toyyotytyTTtoTYYyoYtotyyTyoyoTMYooTTTttYttYtoTYYyyttTotttYtYTMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", //  0
    "o,*..**t.*.Oo...bt,.t..t..OTtyM.Tb,.T.ttTT....y.t.........btoMJJ____;;;;i__jJi___;____;_J__M", //  1
    "T.o...,T.....TO.T...y..o....O.M.T.b.y,TT..ty.T.....T*tt.by..tM_;______;;_;_____;__;_;______M", //  2
    "t.m..b.,.....T..L.*t.*Y..Y.TY.MK.Ck...,......K..........C...kMMMMMMMjJii;____;___JjNNMM____M", //  3
    "o...T**.s...T.y....Y..,T..,o.,MXx...Xx.....xxXxxx...xxXxx....MMMMMMM__;_;uuVuuu;___MMMM__jjM", //  4
    "o.....t........tO.....y.ty..y.MRR...RR.....RRRRRR...RRRRR....MMMMMMM___;_UUUUUU____MMMn__;_M", //  5
    "t.,T*T*.......bo.ttY...Y...tO.Mda...da.....aaddaaC.kaadda....MMMMMMM=###=cchhcc_ij_MMMN_;__M", //  6
    "o.............m..m..,........sMAD...AD.....ADAADA~~~ADAAD..CkMFIMMIF#####BHBBHB____FMIF_;__M", //  7
    "t.............................M%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%M_J;_;_#####_jJ________;ii____M", //  8
    "t12222222222222222222222222222F%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%F___;;_________;______________M", //  9
    "T455555q555555r5555555q555e5555%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%_______;___________________;_M", // 10
    "T78888888888888888888888888888F%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%F____;_________;_________;____M", // 11
    "t.............................M%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%M;___ii_;;_____ii_____________M", // 12
    "tt,...,,.t...........t.,....b.M.xxXxxx...xxXxxx[---].xxXxxx..MFMIMFj__uuVuuu;__i_J_FMINIF;_M", // 13
    "T.b.T......s,o....,y..*,.,T..*M.RRRRRR...RRRRRR|,sm|.RRRRRR..MnMMnN___UUUUUUj______MMMMMM__M", // 14
    "o,.[--G-].s*,t,.......TtK.....M.aaddaa...aaddaa{---}.aaddaa..MMMMMM___cchhcc______;MMMMMNJJM", // 15
    "o..|,mms|t.*.LO..m.....bT.*.,.M.ADAADAK..ADAADA...Ck.ADAADA.CMMMNMM;__BHBBHB;____;JnMnMMM;_M", // 16
    "o..{----}...,.....st....b..oYTM.............Ck.,...,..,..*,..MMnMNMjJi___;__;jJ____MMMMMniiM", // 17
    "ob..t,.*...m.T...*......Y..*.*M.,tb.t.Tt.oT..ybTT....ot..TTT.M__ii;_;;__;___;_________i____M", // 18
    "tooToTtoYYTTYYtYoyotyttYYYyTyYMYoTytYTyotYyotoTTotytTyoTYTtYtMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", // 19
  ],
};
