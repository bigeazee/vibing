/**
 * The interesting half of this module is not saving and loading. It is what
 * happens when storage is broken, because a broken browser profile in the
 * middle of a live talk must produce a fresh game and never an error screen.
 * Every hostile shape a real localStorage can hand back is covered below.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createProgress, STORAGE_KEY } from "../src/state/progress.js";

/** A localStorage stand-in. Values are strings, exactly as the real one stores. */
function fakeStorage(seed) {
  const data = new Map(seed ? Object.entries(seed) : []);
  return {
    data,
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

const stations = [
  { id: "cyoa", title: "Choose Your Own Adventure" },
  { id: "ambiguity-roulette", title: "Ambiguity Roulette" },
  { id: "meeting-cost-meter", title: "Meeting Cost Meter" },
];

test("visits and unlocks survive a round trip through storage", () => {
  const storage = fakeStorage();

  const first = createProgress(storage);
  first.visit("cyoa");
  first.visit("meeting-cost-meter");
  first.unlockZone(2);

  // A new object over the same storage is what a page reload looks like.
  const second = createProgress(storage);
  assert.equal(second.hasVisited("cyoa"), true);
  assert.equal(second.hasVisited("meeting-cost-meter"), true);
  assert.equal(second.hasVisited("ambiguity-roulette"), false);
  assert.deepEqual(second.visitedIds(), ["cyoa", "meeting-cost-meter"]);
  assert.equal(second.isZoneUnlocked(2), true);
  assert.equal(second.isZoneUnlocked(3), false);
  assert.equal(second.highestZone(), 2);
});

test("visit and unlockZone are idempotent and keep insertion order", () => {
  const progress = createProgress(fakeStorage());
  progress.visit("b");
  progress.visit("a");
  progress.visit("b");
  progress.unlockZone(2);
  progress.unlockZone(2);

  assert.deepEqual(progress.visitedIds(), ["b", "a"]);
  assert.equal(progress.highestZone(), 2);
});

test("visitedIds hands back a copy, not the internal array", () => {
  const progress = createProgress(fakeStorage());
  progress.visit("a");
  progress.visitedIds().push("not-real");
  assert.deepEqual(progress.visitedIds(), ["a"]);
});

test("zone 1 is always unlocked, even with nothing saved anywhere", () => {
  assert.equal(createProgress(fakeStorage()).isZoneUnlocked(1), true);
  assert.equal(createProgress(null).isZoneUnlocked(1), true);
  assert.equal(createProgress(fakeStorage()).highestZone(), 1);
});

test("an absent key starts a fresh game", () => {
  const progress = createProgress(fakeStorage());
  assert.deepEqual(progress.visitedIds(), []);
  assert.equal(progress.highestZone(), 1);
});

test("unparseable JSON starts a fresh game rather than throwing", () => {
  // Exactly what section 10 of the work package asks to be tried by hand.
  const progress = createProgress(fakeStorage({ [STORAGE_KEY]: "{{{" }));
  assert.deepEqual(progress.visitedIds(), []);
  assert.equal(progress.isZoneUnlocked(2), false);

  // And it is still a working object, not a husk.
  progress.visit("cyoa");
  assert.equal(progress.hasVisited("cyoa"), true);
});

test("valid JSON of the wrong shape starts a fresh game", () => {
  const shapes = [
    "null",
    "42",
    '"a string"',
    "[1, 2, 3]",
    '{"visited": "not an array"}',
    '{"zones": {"1": true}}',
    '{"visited": [1, 2, null], "zones": ["two", 2.5, 0, -1]}',
  ];
  for (const raw of shapes) {
    const progress = createProgress(fakeStorage({ [STORAGE_KEY]: raw }));
    assert.deepEqual(progress.visitedIds(), [], `visited should be empty for ${raw}`);
    assert.equal(progress.highestZone(), 1, `no zones should unlock for ${raw}`);
    assert.equal(progress.isZoneUnlocked(1), true);
  }
});

test("a storage whose setItem throws still plays, just without saving", () => {
  // Safari in private mode does exactly this.
  const storage = fakeStorage();
  storage.setItem = () => {
    throw new DOMException("QuotaExceededError");
  };

  const progress = createProgress(storage);
  progress.visit("cyoa");
  progress.unlockZone(2);

  assert.equal(progress.hasVisited("cyoa"), true, "the session carries on in memory");
  assert.equal(progress.isZoneUnlocked(2), true);
  assert.equal(storage.data.size, 0, "nothing was written");
});

test("a storage whose getItem throws starts a fresh game", () => {
  const storage = fakeStorage();
  storage.getItem = () => {
    throw new Error("storage is blocked by policy");
  };
  const progress = createProgress(storage);
  assert.deepEqual(progress.visitedIds(), []);
});

test("a null storage object is a perfectly good in-memory game", () => {
  const progress = createProgress(null);
  progress.visit("cyoa");
  progress.unlockZone(3);
  assert.equal(progress.hasVisited("cyoa"), true);
  assert.equal(progress.highestZone(), 3);
  progress.reset();
  assert.deepEqual(progress.visitedIds(), []);
});

test("a storage missing the methods entirely is treated as no storage", () => {
  const progress = createProgress({});
  progress.visit("cyoa");
  assert.equal(progress.hasVisited("cyoa"), true);
});

test("reset clears memory and storage together", () => {
  const storage = fakeStorage();
  const progress = createProgress(storage);
  progress.visit("cyoa");
  progress.unlockZone(2);
  assert.equal(storage.data.has(STORAGE_KEY), true);

  progress.reset();

  assert.deepEqual(progress.visitedIds(), []);
  assert.equal(progress.hasVisited("cyoa"), false);
  assert.equal(progress.isZoneUnlocked(2), false, "the gates close again");
  assert.equal(progress.isZoneUnlocked(1), true, "but you are never locked out of zone 1");
  assert.equal(storage.data.has(STORAGE_KEY), false);

  // And a reload after a reset really is a fresh game.
  assert.deepEqual(createProgress(storage).visitedIds(), []);
});

test("reset survives a storage whose removeItem throws", () => {
  const storage = fakeStorage();
  storage.removeItem = () => {
    throw new Error("no");
  };
  const progress = createProgress(storage);
  progress.visit("cyoa");
  progress.reset();
  assert.equal(progress.hasVisited("cyoa"), false);
});

test("summary is short, pasteable and says nothing about anybody", () => {
  const storage = fakeStorage();
  const progress = createProgress(storage);
  progress.visit("cyoa");
  progress.unlockZone(2);

  const summary = progress.summary(stations);
  const lines = summary.split("\n");

  assert.ok(lines.length <= 6, `summary should be short, got ${lines.length} lines`);
  assert.match(summary, /1 of 3/);
  assert.match(summary, /Zones unlocked: 1, 2/);
  assert.match(summary, /Choose Your Own Adventure/);
  assert.ok(!summary.includes("Ambiguity Roulette"), "unvisited stations are not listed");

  // Nothing identifying, no URLs, no timestamps: this gets pasted into a chat.
  assert.ok(!/https?:|\/\/|@/.test(summary), "no URLs or addresses");
  assert.ok(!/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}/.test(summary), "no timestamps");
});

test("summary copes with nothing visited and with no stations passed in", () => {
  const progress = createProgress(fakeStorage());

  const empty = progress.summary(stations);
  assert.match(empty, /0 of 3/);
  assert.match(empty, /nothing yet/);

  progress.visit("cyoa");
  const noStations = progress.summary();
  assert.match(noStations, /1 of 1/);
  assert.match(noStations, /cyoa/);
});
