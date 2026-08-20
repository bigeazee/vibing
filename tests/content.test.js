/**
 * THE CONTENT VALIDATION SUITE
 * ============================
 *
 * CLAUDE.md calls this the highest-value test in the repository, and it is: it
 * is the thing standing between somebody's first pull request and a broken live
 * site. Every other test here protects code. This one protects contributors.
 *
 * Every rule is tested twice, and the second half is the half that matters:
 *
 *   1. the real content satisfies it
 *   2. the rule FIRES on content that breaks it, with a message that says what
 *      to do about it
 *
 * A validator nobody has watched fail is not a validator. A rule with only the
 * first test passes just as happily when the check has been commented out.
 *
 * The messages are asserted, not just the count, because the message is the
 * whole product here. The person reading it has usually just hand-edited one
 * line of a file they have never opened before.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { MAX_WALK_TILES, RECEIPT_FIELDS, validateContent } from "../src/content/validate.js";
import { gates } from "../src/content/gates.js";
import { legend, mapDef } from "../src/content/map.js";
import { plaques } from "../src/content/plaques.js";
import { stations } from "../src/content/stations.js";

/** The real content, deep-copied, with one thing broken in it. */
function brokenContent(mutate) {
  const bundle = structuredClone({ stations, gates, plaques, mapDef, legend });
  if (mutate) mutate(bundle);
  return validateContent(bundle);
}

/** Assert that some problem matches, and hand it back so it can be read. */
function fires(problems, pattern) {
  const hit = problems.filter((problem) => pattern.test(problem));
  assert.ok(
    hit.length > 0,
    `expected a problem matching ${pattern}\nbut got:\n  ${problems.join("\n  ") || "(none)"}`
  );
  return hit[0];
}

function station(bundle, id) {
  const found = bundle.stations.find((s) => s.id === id);
  assert.ok(found, `test fixture expected a station "${id}"`);
  return found;
}

/** Replace one character in one map row. */
function setTile(bundle, x, y, char) {
  const row = bundle.mapDef.rows[y];
  bundle.mapDef.rows[y] = row.slice(0, x) + char + row.slice(x + 1);
}

// ============================================================== the real thing

test("the real content is valid: no problems at all", () => {
  const problems = validateContent({ stations, gates, plaques, mapDef, legend });
  assert.deepEqual(
    problems,
    [],
    `the shipped content must validate cleanly:\n  ${problems.join("\n  ")}`
  );
});

test("validateContent collects every problem instead of stopping at the first", () => {
  const problems = brokenContent((bundle) => {
    bundle.stations[0].title = "";
    bundle.stations[1].receipt.cost = "";
    bundle.gates[0].options.forEach((option) => {
      option.correct = false;
    });
  });
  assert.ok(
    problems.length >= 3,
    `three mistakes should produce at least three messages, got:\n  ${problems.join("\n  ")}`
  );
});

test("validateContent never throws, whatever it is handed", () => {
  assert.doesNotThrow(() => validateContent());
  assert.doesNotThrow(() => validateContent({}));
  assert.doesNotThrow(() => validateContent({ stations: 7, gates: null, plaques: "no" }));
  assert.ok(validateContent({}).length > 0, "and it still reports what is wrong");
});

// ================================================================ definitions

test("a station missing a required field fires, naming the station id", () => {
  for (const field of ["title", "sprite", "problem", "build", "prompt"]) {
    const problems = brokenContent((bundle) => {
      station(bundle, "monty")[field] = "";
    });
    const message = fires(problems, new RegExp(`Station "monty".*"${field}"`));
    assert.ok(!/row \d/.test(message), "a definition fault has no row and column");
  }
});

test("a station with no id at all still produces a usable message", () => {
  const problems = brokenContent((bundle) => {
    delete station(bundle, "monty").id;
  });
  fires(problems, /Station "\(no id\)" needs an id/);
});

test("a station with a zone outside 1-3 fires", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").zone = 4;
  });
  fires(problems, /Station "monty" has zone 4\. It must be one of 1, 2, 3\./);
});

test("two stations with the same id fires", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").id = "linky";
  });
  fires(problems, /two stations with the id "linky"/);
});

test("a zone with the wrong number of stations fires, naming the zone", () => {
  const tooFew = brokenContent((bundle) => {
    bundle.stations = bundle.stations.filter((s) => s.id !== "monty");
  });
  fires(tooFew, /Zone 3 has 2 stations\. Every zone has exactly 3/);

  const tooMany = brokenContent((bundle) => {
    const extra = structuredClone(station(bundle, "monty"));
    extra.id = "monty-two";
    extra.flagship = false;
    extra.tile = { x: 78, y: 12 };
    bundle.stations.push(extra);
  });
  fires(tooMany, /Zone 3 has 4 stations/);
});

test("a zone without exactly one flagship fires, naming the offenders", () => {
  const two = brokenContent((bundle) => {
    station(bundle, "monty").flagship = true;
  });
  fires(two, /Zone 3 has 2 flagship stations \("linky", "monty"\)/);

  const none = brokenContent((bundle) => {
    station(bundle, "linky").flagship = false;
  });
  fires(none, /Zone 3 has 0 flagship stations \(none\)/);
});

test("a station with too few or too many steps fires", () => {
  const few = brokenContent((bundle) => {
    station(bundle, "monty").steps = ["only one"];
  });
  fires(few, /Station "monty" has 1 steps\. The house style is 3 to 5/);

  const many = brokenContent((bundle) => {
    station(bundle, "monty").steps = ["a", "b", "c", "d", "e", "f"];
  });
  fires(many, /Station "monty" has 6 steps/);
});

test("an empty step fires", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").steps[1] = "   ";
  });
  fires(problems, /Station "monty" has an empty step/);
});

// -------------------------------------------------------------- the receipt

test("every real receipt has all seven fields, in CLAUDE.md's order", () => {
  for (const item of stations) {
    assert.deepEqual(
      Object.keys(item.receipt),
      RECEIPT_FIELDS,
      `station "${item.id}" must carry the seven receipt fields in order`
    );
  }
});

test("a receipt missing a field fires, listing the seven", () => {
  const problems = brokenContent((bundle) => {
    delete station(bundle, "monty").receipt.cost;
  });
  const message = fires(problems, /Station "monty" has receipt fields/);
  assert.match(message, /never add an eighth/);
  assert.match(message, /buildTime, tool, cost, lines, dataTouched, skill, hardestPart/);
});

test("a receipt with an eighth field fires", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").receipt.testsWritten = "145";
  });
  fires(problems, /Station "monty" has receipt fields \[.*testsWritten\]/);
});

test("a receipt with the fields in the wrong order fires", () => {
  const problems = brokenContent((bundle) => {
    const receipt = station(bundle, "monty").receipt;
    const reordered = { tool: receipt.tool, buildTime: receipt.buildTime };
    for (const field of RECEIPT_FIELDS) {
      if (field !== "tool" && field !== "buildTime") reordered[field] = receipt[field];
    }
    station(bundle, "monty").receipt = reordered;
  });
  fires(problems, /Station "monty" has receipt fields \[tool, buildTime/);
});

test("a blank receipt field fires, and says what to write instead of guessing", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").receipt.lines = "";
  });
  const message = fires(problems, /Station "monty" has an empty receipt field "lines"/);
  assert.match(message, /never guess a number/);
});

// ------------------------------------------------------------------- demos

test("an unknown demo type fires", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").demo = { type: "interpretive-dance" };
  });
  fires(problems, /Station "monty" needs demo: \{ type \} where type is one of/);
});

test('demo.type "embedded" fires, because it is not implemented', () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").demo = { type: "embedded" };
  });
  fires(problems, /Station "monty" has demo\.type "embedded", which is not implemented/);
});

test('demo.type "external" with no links is legal: it is the honest state', () => {
  // A thing that has been built but has nowhere public to point at. The panel
  // says "No demo linked for this one yet", which is true; "placeholder" would
  // say "Playable demo coming soon", which would be a promise nobody has made.
  const problems = brokenContent((bundle) => {
    station(bundle, "linky").links = [];
  });
  assert.deepEqual(
    problems.filter((problem) => /"linky".*(demo|link)/.test(problem)),
    [],
    "external with no links must not be reported as a problem"
  );
});

test("a link with no href fires", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "linky").links = [{ label: "somewhere" }];
  });
  fires(problems, /Station "linky" has a link with no href/);
});

// ------------------------------------------------------------------ sprites

test("an unknown station sprite fires, and says where sprite names come from", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").sprite = "space_hopper";
  });
  const message = fires(problems, /Station "monty" uses sprite "space_hopper"/);
  assert.match(message, /src\/content\/sprites\.js/);
});

test("an unknown gate sprite fires, for both the locked and unlocked sprite", () => {
  const locked = brokenContent((bundle) => {
    bundle.gates[0].sprite = "portcullis";
  });
  fires(locked, /Gate "gate-1-2" uses sprite "portcullis"/);

  const unlocked = brokenContent((bundle) => {
    bundle.gates[0].spriteUnlocked = "portcullis";
  });
  fires(unlocked, /Gate "gate-1-2" uses spriteUnlocked "portcullis"/);
});

test("an unknown plaque sprite fires", () => {
  const problems = brokenContent((bundle) => {
    bundle.plaques[0].sprite = "billboard";
  });
  fires(problems, /The plaque for zone 1 uses sprite "billboard"/);
});

test("an unknown sprite in the map legend fires, naming the legend character", () => {
  const problems = brokenContent((bundle) => {
    bundle.legend["."] = { terrain: "astroturf" };
  });
  const message = fires(problems, /legend entry "\."/);
  assert.match(message, /astroturf/);
  assert.ok(!/row \d/.test(message), "a legend fault names the character, not a row");
});

// ------------------------------------------------------------------- gates

test("a gate with no correct option fires, saying nobody could pass it", () => {
  const problems = brokenContent((bundle) => {
    bundle.gates[0].options.forEach((option) => {
      option.correct = false;
    });
  });
  fires(problems, /Gate "gate-1-2" has 0 correct options.*nobody could ever pass it/s);
});

test("a gate with two correct options fires", () => {
  const problems = brokenContent((bundle) => {
    bundle.gates[0].options[0].correct = true;
  });
  fires(problems, /Gate "gate-1-2" has 2 correct options.*any of them would open the door/s);
});

test("a gate with fewer than three options fires", () => {
  const problems = brokenContent((bundle) => {
    bundle.gates[0].options = bundle.gates[0].options.slice(0, 2);
  });
  fires(problems, /Gate "gate-1-2" needs at least three options/);
});

test("a gate missing its question or its nudge fires", () => {
  for (const field of ["question", "nudge"]) {
    const problems = brokenContent((bundle) => {
      bundle.gates[1][field] = "";
    });
    fires(problems, new RegExp(`Gate "gate-2-3" needs a non-empty "${field}"`));
  }
});

test("two gates with the same id fires", () => {
  const problems = brokenContent((bundle) => {
    bundle.gates[1].id = bundle.gates[0].id;
  });
  fires(problems, /two gates with the id "gate-1-2"/);
});

// ------------------------------------------------------------------ plaques

test("a zone without exactly one plaque fires, naming the zone", () => {
  const none = brokenContent((bundle) => {
    bundle.plaques = bundle.plaques.filter((plaque) => plaque.zone !== 2);
  });
  fires(none, /Zone 2 has 0 plaques\. Every zone has exactly one/);

  const two = brokenContent((bundle) => {
    const extra = structuredClone(bundle.plaques[0]);
    extra.zone = 3;
    extra.tile = { x: 66, y: 8 };
    bundle.plaques.push(extra);
  });
  fires(two, /Zone 3 has 2 plaques/);
});

test("a plaque missing a field fires, naming the zone it belongs to", () => {
  for (const field of ["title", "level", "body"]) {
    const problems = brokenContent((bundle) => {
      bundle.plaques[1][field] = "";
    });
    const message = fires(problems, new RegExp(`The plaque for zone 2 needs a non-empty "${field}"`));
    assert.ok(!/row \d/.test(message), "a definition fault has no row and column");
  }
});

test("a plaque with a receipt fires: a plaque is not a station", () => {
  const problems = brokenContent((bundle) => {
    bundle.plaques[0].receipt = { buildTime: "an afternoon" };
  });
  fires(problems, /The plaque for zone 1 has a receipt\. A plaque is not a station/);
});

test("a plaque in a zone that does not exist fires", () => {
  const problems = brokenContent((bundle) => {
    bundle.plaques[0].zone = 9;
  });
  fires(problems, /A plaque has zone 9\. It must be one of 1, 2, 3\./);
});

// ============================================================== placement

test("a station off the edge of the map fires, giving the map size", () => {
  const problems = brokenContent((bundle) => {
    station(bundle, "monty").tile = { x: 400, y: 3 };
  });
  fires(problems, /The station "monty" is at tile \(400, 3\), off a map that is 92x20 tiles\./);
});

test("a station on a solid map tile fires, and says how to fix it", () => {
  const problems = brokenContent((bundle) => {
    // (0, 10) is the treeline down the western edge of zone 1.
    station(bundle, "cyoa").tile = { x: 0, y: 10 };
  });
  const message = fires(problems, /The station "cyoa" is at tile \(0, 10\), which is a solid tile/);
  assert.match(message, /walkable ground/);
  assert.match(message, /src\/content\/map\.js/);
});

test("two things on the same tile fires - the case zones.js deliberately misses", () => {
  const stationOnGate = brokenContent((bundle) => {
    station(bundle, "meeting-cost-meter").tile = { ...bundle.gates[0].tile };
  });
  fires(
    stationOnGate,
    /The gate "gate-1-2" and the station "meeting-cost-meter" are both on tile \(30, 10\)/
  );

  const plaqueOnStation = brokenContent((bundle) => {
    bundle.plaques[0].tile = { ...station(bundle, "cyoa").tile };
  });
  fires(
    plaqueOnStation,
    /The plaque "plaque-zone-1" and the station "cyoa" are both on tile \(10, 8\)/
  );
});

test("a station walled in on all four sides fires: nobody could ever open it", () => {
  const problems = brokenContent((bundle) => {
    // Trees on all four neighbours of the zone 1 flagship.
    setTile(bundle, 9, 8, "T");
    setTile(bundle, 11, 8, "T");
    setTile(bundle, 10, 7, "T");
    setTile(bundle, 10, 9, "T");
  });
  fires(problems, /The station "cyoa" at tile \(10, 8\) is walled in on all four sides/);
});

// ========================================================= the map, as walked

test("a hole in a barrier column fires: that is a whole zone skipped", () => {
  const problems = brokenContent((bundle) => {
    // One walkable tile in the wall between zone 1 and zone 2, with open
    // ground on both sides of it.
    setTile(bundle, 30, 12, ".");
  });
  const message = fires(problems, /With zones 1 unlocked, the player can reach zones 1, 2/);
  assert.match(message, /barrier column/);
});

test("a hole in the second barrier fires too, and names the zones reached", () => {
  const problems = brokenContent((bundle) => {
    setTile(bundle, 61, 12, "%");
  });
  fires(problems, /With zones 1, 2 unlocked, the player can reach zones 1, 2, 3/);
});

test("an unreachable station fires, even with every gate open", () => {
  const problems = brokenContent((bundle) => {
    // Two floor tiles sealed inside the zone 3 brick. The station has somewhere
    // to be stood next to, so this is a reachability fault and nothing else.
    setTile(bundle, 64, 4, "_");
    setTile(bundle, 64, 5, "_");
    station(bundle, "linky").tile = { x: 64, y: 5 };
  });
  fires(
    problems,
    /The station "linky" at tile \(64, 5\) cannot be walked to from the spawn even with every gate open/
  );
});

test("stations too far apart fires, and reports the distance it measured", () => {
  const problems = brokenContent((bundle) => {
    // Up into the trees at the top of zone 1, well off the lane.
    station(bundle, "ambiguity-roulette").tile = { x: 15, y: 2 };
  });
  const message = fires(problems, /follow one another in zone 1 but are \d+ tiles apart on foot/);
  assert.match(message, /"cyoa"/);
  assert.match(message, /"ambiguity-roulette"/);
  assert.match(message, new RegExp(`over the limit of ${MAX_WALK_TILES}`));
  assert.match(message, /seconds of walking/);
});

test("walking distance is measured on foot, not as the crow flies", () => {
  // (10, 8) to (15, 2) is eleven tiles in a straight line, comfortably inside
  // the limit. On foot, round the trees and back down to the lane, it is not.
  // Straight-line distance would wave this through.
  const problems = brokenContent((bundle) => {
    station(bundle, "ambiguity-roulette").tile = { x: 15, y: 2 };
  });
  const message = fires(problems, /are \d+ tiles apart on foot/);
  const measured = Number(message.match(/are (\d+) tiles apart on foot/)[1]);
  const straightLine = Math.abs(15 - 10) + Math.abs(2 - 8);

  assert.ok(straightLine <= MAX_WALK_TILES, "the straight line is inside the limit");
  assert.ok(
    measured > straightLine,
    `on foot (${measured}) has to be further than the straight line (${straightLine})`
  );
});

// ================================================== map faults, and their scope

test("a ragged map row is reported by row, not by station", () => {
  const problems = brokenContent((bundle) => {
    bundle.mapDef.rows[4] = bundle.mapDef.rows[4].slice(0, -1);
  });
  fires(problems, /map row 4 has 91 characters but row 0 has 92/);
});

test("a map character with no legend entry names the row, the column and the character", () => {
  const problems = brokenContent((bundle) => {
    setTile(bundle, 12, 6, "Z");
  });
  fires(problems, /map row 6, column 12 \(tile x=12, y=6\): character "Z" has no entry in the legend/);
});

test("an overlay sprite used as a terrain tile is rejected, naming the character", () => {
  const problems = brokenContent((bundle) => {
    bundle.legend["."] = { terrain: "chest" };
  });
  fires(problems, /legend entry "\.".*is an overlay sprite and cannot be used as a terrain tile/s);
});

test("a spawn on a solid tile is reported with the legend character", () => {
  const problems = brokenContent((bundle) => {
    bundle.mapDef.spawn = { x: 0, y: 0 };
  });
  fires(problems, /spawn \(0, 0\) is on a solid tile/);
});
