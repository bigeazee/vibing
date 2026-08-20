/**
 * The camera has one job and one failure mode: never show past the map edge.
 *
 * Numbers here are the real ones — a 400x240 viewport of 16px tiles, so the
 * player's top-left sits 192px from the left and 112px from the top of the view
 * when they are in the middle of the map. That is the centre tile (12, 7) from
 * the rendering contract.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { cameraTopLeft } from "../src/engine/camera.js";

const VIEW_W = 400;
const VIEW_H = 240;
const MAP_W = 640; // 40 tiles
const MAP_H = 320; // 20 tiles

function camera(playerPxX, playerPxY, mapPxW = MAP_W, mapPxH = MAP_H) {
  return cameraTopLeft({
    playerPxX,
    playerPxY,
    mapPxW,
    mapPxH,
    viewPxW: VIEW_W,
    viewPxH: VIEW_H,
  });
}

test("away from the edges, the player sits on the centre tile", () => {
  const playerPxX = 20 * 16;
  const playerPxY = 10 * 16;
  const result = camera(playerPxX, playerPxY);

  assert.deepEqual(result, { x: 128, y: 48 });
  assert.equal(playerPxX - result.x, 192, "player should be 12 tiles from the left of the view");
  assert.equal(playerPxY - result.y, 112, "player should be 7 tiles from the top of the view");
});

test("the camera clamps at the west and north edges", () => {
  assert.deepEqual(camera(0, 0), { x: 0, y: 0 });
  assert.deepEqual(camera(16, 16), { x: 0, y: 0 }, "still clamped one tile in");
});

test("the camera clamps at the east and south edges", () => {
  const lastTile = camera(39 * 16, 19 * 16);

  assert.deepEqual(lastTile, { x: MAP_W - VIEW_W, y: MAP_H - VIEW_H });
  assert.deepEqual(lastTile, { x: 240, y: 80 });
});

test("clamping starts exactly where the view would otherwise pass the edge", () => {
  // The player's centre is 192px from the left of the view, so the camera leaves
  // x=0 the moment the player's top-left passes 192.
  assert.equal(camera(192, 0).x, 0);
  assert.equal(camera(193, 0).x, 1);

  assert.equal(camera(0, 112).y, 0);
  assert.equal(camera(0, 113).y, 1);
});

test("the camera never shows past the map on either axis", () => {
  for (let px = -64; px <= MAP_W + 64; px += 7) {
    const result = camera(px, px);

    assert.ok(result.x >= 0, `camera.x ${result.x} went west of the map`);
    assert.ok(result.x + VIEW_W <= MAP_W, `camera.x ${result.x} went east of the map`);
    assert.ok(result.y >= 0, `camera.y ${result.y} went north of the map`);
    assert.ok(result.y + VIEW_H <= MAP_H, `camera.y ${result.y} went south of the map`);
  }
});

test("a map narrower than the view is centred on that axis", () => {
  const narrow = camera(32, 160, 160, MAP_H);

  assert.equal(narrow.x, (160 - VIEW_W) / 2);
  assert.equal(narrow.x, -120, "the map sits in the middle of the view, not against the left");
});

test("a map shorter than the view is centred on that axis", () => {
  const short = camera(320, 32, MAP_W, 160);

  assert.equal(short.y, (160 - VIEW_H) / 2);
  assert.equal(short.y, -40);
});

test("a map smaller than the view on both axes is centred on both", () => {
  assert.deepEqual(camera(0, 0, 160, 160), { x: -120, y: -40 });
});

test("a map exactly the size of the view does not scroll", () => {
  assert.deepEqual(camera(300, 100, VIEW_W, VIEW_H), { x: 0, y: 0 });
});
