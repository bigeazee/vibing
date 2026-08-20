/**
 * PROGRESS
 * ========
 *
 * What the player has seen, and which zones they have earned.
 *
 * Pure apart from the storage object handed in. There is no `localStorage` in
 * this file on purpose: it is injected, so the tests run in plain Node against a
 * fake, and so a browser profile that has banned storage is just another fake
 * that happens to do nothing.
 *
 * THE RULE THAT MATTERS: nothing in here throws because of storage. A missing
 * key, unparseable JSON, valid JSON of the wrong shape, a null storage object,
 * and a setItem that throws (Safari private mode does exactly this) all end up
 * at the same place - a working progress object that starts from scratch and
 * keeps the game playable in memory. A player with a broken browser profile gets
 * a fresh game, not an error screen in the middle of a talk.
 */

export const STORAGE_KEY = "vibing.v1";

/**
 * @param {{getItem: Function, setItem: Function, removeItem: Function}|null} storage
 *   anything shaped like localStorage. null is fine and means "play in memory".
 * @returns {{
 *   hasVisited: (stationId: string) => boolean,
 *   visit: (stationId: string) => void,
 *   visitedIds: () => string[],
 *   isZoneUnlocked: (zoneId: number) => boolean,
 *   unlockZone: (zoneId: number) => void,
 *   highestZone: () => number,
 *   reset: () => void,
 *   summary: (stations?: object[]) => string
 * }}
 */
export function createProgress(storage) {
  /** Visited station ids in the order they were first seen. */
  const visited = [];
  const visitedSet = new Set();
  /** Unlocked zone ids. Zone 1 is where the player starts, so it is never absent. */
  const unlocked = new Set([1]);

  load();

  /** Read whatever is in storage and take from it only what makes sense. */
  function load() {
    const raw = read();
    if (typeof raw !== "string") return;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // "{{{" and friends. Start fresh.
    }
    // A saved array, number or null all parse fine and are all the wrong shape.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

    if (Array.isArray(parsed.visited)) {
      for (const id of parsed.visited) addVisited(id);
    }
    if (Array.isArray(parsed.zones)) {
      for (const zoneId of parsed.zones) addZone(zoneId);
    }
  }

  function read() {
    try {
      if (!storage || typeof storage.getItem !== "function") return null;
      return storage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function save() {
    try {
      if (!storage || typeof storage.setItem !== "function") return;
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ visited, zones: [...unlocked].sort((a, b) => a - b) })
      );
    } catch {
      // Storage full, or a profile that refuses to write. The in-memory game
      // carries on exactly as it was; only the reload survives it.
    }
  }

  function addVisited(id) {
    if (typeof id !== "string" || id === "" || visitedSet.has(id)) return false;
    visitedSet.add(id);
    visited.push(id);
    return true;
  }

  function addZone(zoneId) {
    if (!Number.isInteger(zoneId) || zoneId < 1 || unlocked.has(zoneId)) return false;
    unlocked.add(zoneId);
    return true;
  }

  return {
    hasVisited(stationId) {
      return visitedSet.has(stationId);
    },

    /** Idempotent, and on disk before it returns. */
    visit(stationId) {
      if (addVisited(stationId)) save();
    },

    /** A copy, in first-seen order. Callers must not be able to edit our state. */
    visitedIds() {
      return visited.slice();
    },

    isZoneUnlocked(zoneId) {
      return zoneId === 1 || unlocked.has(zoneId);
    },

    /**
     * Idempotent, and on disk before it returns. A zone id that is not a whole
     * number at or above 1 is ignored rather than thrown: this runs live during
     * a talk, and a content typo should not end the session.
     */
    unlockZone(zoneId) {
      if (addZone(zoneId)) save();
    },

    highestZone() {
      let highest = 1;
      for (const zoneId of unlocked) if (zoneId > highest) highest = zoneId;
      return highest;
    },

    /** Back to a brand new game, in memory and on disk, with no reload. */
    reset() {
      visited.length = 0;
      visitedSet.clear();
      unlocked.clear();
      unlocked.add(1);
      try {
        if (storage && typeof storage.removeItem === "function") {
          storage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Same deal as save(). Memory is already clean, which is what the
        // player asked for.
      }
    },

    /**
     * A short block the player can paste into a chat.
     *
     * Deliberately four lines and deliberately dull: no URLs, no timestamps, no
     * identifiers, nothing that says anything about who is playing. The site is
     * public and this text is meant to be pasted somewhere else.
     *
     * @param {{id: string, title: string}[]} [stations]
     */
    summary(stations) {
      const known = Array.isArray(stations) ? stations : null;
      const titles = known
        ? known.filter((s) => s && visitedSet.has(s.id)).map((s) => s.title || s.id)
        : visited.slice();
      const total = known ? known.length : visited.length;
      const zones = [...unlocked].sort((a, b) => a - b).join(", ");

      return [
        "Vibing - progress",
        `Stations: ${titles.length} of ${total} visited`,
        `Zones unlocked: ${zones}`,
        `Visited: ${titles.length ? titles.join(", ") : "nothing yet"}`,
      ].join("\n");
    },
  };
}
