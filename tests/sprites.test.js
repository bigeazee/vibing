/**
 * The sprite contract is load-bearing: every map tile and every station in this
 * project names a sprite from it. These tests are the thing that turns a typo
 * into a red build instead of a hole in the live site.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  ATLASES,
  OVERLAY_SPRITES,
  SPRITES,
  TILE_SIZE,
  spriteExists,
  spriteNames,
  spriteRect,
} from "../src/content/sprites.js";

test("every name in SPRITES resolves through spriteRect() without throwing", () => {
  const names = Object.keys(SPRITES);
  assert.ok(names.length > 0, "SPRITES should not be empty");

  for (const name of names) {
    assert.doesNotThrow(() => spriteRect(name), `spriteRect("${name}") threw`);
  }
});

test("every sprite index is inside its atlas", () => {
  for (const [name, [atlasKey, index]] of Object.entries(SPRITES)) {
    const atlas = ATLASES[atlasKey];
    assert.ok(atlas, `sprite "${name}" names unknown atlas "${atlasKey}"`);
    assert.ok(
      Number.isInteger(index) && index >= 0 && index < atlas.count,
      `sprite "${name}" has index ${index}, outside 0..${atlas.count - 1} of atlas "${atlasKey}"`
    );
  }
});

test("spriteRect() returns a source rectangle inside the atlas image", () => {
  for (const name of spriteNames()) {
    const rect = spriteRect(name);
    const atlas = ATLASES[rect.atlas];

    assert.equal(rect.w, TILE_SIZE);
    assert.equal(rect.h, TILE_SIZE);
    assert.ok(rect.sx >= 0 && rect.sx + rect.w <= atlas.cols * TILE_SIZE, `${name} sx out of range`);
    assert.ok(rect.sy >= 0 && rect.sy + rect.h <= atlas.rows * TILE_SIZE, `${name} sy out of range`);
    assert.equal(rect.src, atlas.src);
  }
});

test("atlas paths are relative, because the site is served from a subpath", () => {
  for (const [key, atlas] of Object.entries(ATLASES)) {
    assert.ok(
      !atlas.src.startsWith("/") && !atlas.src.includes("://"),
      `atlas "${key}" has src "${atlas.src}", which is not a relative path`
    );
  }
});

test("spriteRect() throws on an unknown name", () => {
  assert.throws(
    () => spriteRect("definitely_not_a_sprite"),
    /Unknown sprite "definitely_not_a_sprite"/
  );
});

test("every member of OVERLAY_SPRITES is a key of SPRITES", () => {
  for (const name of OVERLAY_SPRITES) {
    assert.ok(spriteExists(name), `OVERLAY_SPRITES lists "${name}", which is not in SPRITES`);
  }
});

test("spriteExists() agrees with SPRITES", () => {
  assert.equal(spriteExists("grass"), true);
  assert.equal(spriteExists("nope"), false);
  assert.equal(spriteExists("toString"), false, "must not inherit from Object.prototype");
});
