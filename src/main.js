/**
 * BOOT
 * ====
 *
 * The seam. The only place the engine, the content, the UI and saved progress
 * meet each other.
 *
 * The engine deliberately cannot see content: startGame() takes the map as a
 * parameter so src/engine/ never imports src/content/. Something has to marry
 * the two, and this is it - not the engine, and not a script tag in index.html.
 *
 * Keep it thin. Everything here is code nobody can unit test, so anything with
 * real logic in it belongs somewhere else: interaction lives in
 * engine/interaction.js, gate and station collision in engine/zones.js, saving
 * in state/progress.js, and all three are tested in plain Node. What is left
 * here is wiring, and wiring is all it should ever be.
 *
 * Every path in this file is relative. The site is served from a subpath on
 * GitHub Pages, where a leading slash works locally and 404s in production.
 */

import { startGame } from "./engine/game.js";
import { interactableFor } from "./engine/interaction.js";
import { lockGates, markSolid } from "./engine/zones.js";
import { TILE_SIZE } from "./content/sprites.js";
import { gates } from "./content/gates.js";
import { legend, mapDef } from "./content/map.js";
import { plaques } from "./content/plaques.js";
import { FLAGSHIP_MARKER_SPRITE, stations } from "./content/stations.js";
import { createProgress } from "./state/progress.js";
import { createGateQuiz } from "./ui/gate.js";
import { createHud } from "./ui/hud.js";
import { createPanel } from "./ui/panel.js";

const canvas = document.getElementById("game");
const stage = document.getElementById("stage");
const errorBox = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const notice = document.getElementById("notice");
const hint = document.getElementById("hint");

// The logical resolution from the rendering contract. The canvas backing store
// is never resized; only its CSS size changes.
const LOGICAL_W = canvas.width;
const LOGICAL_H = canvas.height;

/**
 * Blow the canvas up by the largest whole number that still fits.
 *
 * clientWidth/clientHeight rather than getBoundingClientRect(), because the
 * rect is the BORDER box: measure that and any padding on #stage is counted as
 * space the canvas can use, so the canvas is chosen a step too large and then
 * silently clipped by the stage's overflow: hidden. #stage carries no padding
 * for exactly this reason - every pixel of vertical chrome is a scale step at
 * the smaller laptop sizes - but measuring the content box keeps that true if
 * somebody ever puts padding back.
 */
function rescale() {
  const byWidth = Math.floor(stage.clientWidth / LOGICAL_W);
  const byHeight = Math.floor(stage.clientHeight / LOGICAL_H);
  const scale = Math.max(1, Math.min(byWidth, byHeight));

  canvas.style.width = LOGICAL_W * scale + "px";
  canvas.style.height = LOGICAL_H * scale + "px";
}

function showError(error) {
  canvas.hidden = true;
  hint.hidden = true;
  errorMessage.textContent = error && error.message ? error.message : String(error);
  errorBox.hidden = false;
}

// A touchscreen laptop reports a coarse pointer but still has a keyboard, so
// the test is whether there is no fine pointer at all.
if (window.matchMedia) {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia("(any-pointer: fine)").matches;
  if (coarse && !fine) notice.hidden = false;
}

rescale();
window.addEventListener("resize", rescale);

// ---------------------------------------------------------------- progress

/**
 * Reading window.localStorage can itself throw on a locked-down profile, before
 * anyone calls a method on it. createProgress copes with null, so this is the
 * whole of the defence.
 */
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const progress = createProgress(browserStorage());

// ---------------------------------------------------------------- entities
//
// Stations and gates are drawn from their content files, never from the map's
// ASCII grid. That is what keeps "add a station" to one object in one file: if
// the sprite lived in the grid you would have to edit two.

const gateEntities = new Map();
const entities = [];

for (const gate of gates) {
  const entity = {
    sprite: gate.sprite,
    pxX: gate.tile.x * TILE_SIZE,
    pxY: gate.tile.y * TILE_SIZE,
  };
  gateEntities.set(gate.id, entity);
  entities.push(entity);
}

for (const item of [...stations, ...plaques]) {
  entities.push({
    sprite: item.sprite,
    pxX: item.tile.x * TILE_SIZE,
    pxY: item.tile.y * TILE_SIZE,
  });
}

// Flagship markers go on the tile directly above the station, so a content
// author never has to remember to make a flagship look like one.
for (const station of stations) {
  if (!station.flagship) continue;
  entities.push({
    sprite: FLAGSHIP_MARKER_SPRITE,
    pxX: station.tile.x * TILE_SIZE,
    pxY: (station.tile.y - 1) * TILE_SIZE,
  });
}

// ---------------------------------------------------------------------- ui

const hud = createHud(document.getElementById("hud"));
const panel = createPanel(document.getElementById("panel-root"));
const quiz = createGateQuiz(document.getElementById("quiz-root"));

/** Identity, not id: a station and a gate could legitimately share an id. */
const gateSet = new Set(gates);
const plaqueSet = new Set(plaques);

/** Stations plus any still-locked gate. Rebuilt by syncGates. */
const interactables = [];

let game = null;

// --------------------------------------------------------------------- boot

try {
  game = await startGame(canvas, { mapDef, legend, entities, onUpdate: tick });

  // After startGame, because both need the parsed grid it returns.
  markSolid(game.grid, stations, "station");
  markSolid(game.grid, plaques, "plaque");
  syncGates();

  refreshProgress();
  hud.setZone(game.grid.zoneAt(game.player.tileX, game.player.tileY));
  wireControls();

  // Both overlays report a close the same way: registered once, fires on every
  // close for the life of the overlay.
  panel.onClose(onOverlayClosed);
  quiz.onClose(onOverlayClosed);
  focusCanvas();

  // Exposed so pause(), resume() and destroy() can be tried from the browser
  // console. Nothing is sent anywhere; there is no tracking here.
  window.vibing = game;
} catch (error) {
  showError(error);
}

/** Called once a frame by the engine, paused or not. */
function tick() {
  if (!game) return;

  // Both overlays report their own close through onClose, so nothing here has
  // to watch for one.
  if (quiz.isOpen() || panel.isOpen()) return;

  hud.setZone(game.grid.zoneAt(game.player.tileX, game.player.tileY));

  const target = interactableFor(interactables, game.player);
  // Consumed whether or not there is a target. An E pressed in an empty field
  // must not sit in the queue and fire the moment you walk up to something.
  const pressed = game.input.consumePress("interact");

  if (target) hud.showPrompt(promptFor(target));
  else hud.hidePrompt();

  if (target && pressed) openFor(target);
}

function promptFor(item) {
  if (gateSet.has(item)) return "Answer the question";
  if (plaqueSet.has(item)) return `Read ${item.title}`;
  return `Open ${item.title}`;
}

function openFor(item) {
  if (gateSet.has(item)) openGate(item);
  else if (plaqueSet.has(item)) openPlaque(item);
  else openStation(item);
}

/** A plaque is not a station: it opens, but it does not count as visited. */
function openPlaque(plaque) {
  panel.openPlaque(plaque);
  pauseForOverlay();
}

function openStation(station) {
  try {
    panel.open(station);
  } catch (error) {
    // Only reachable from demo.type "embedded", which is not implemented. Say
    // so loudly, but never wedge the game in front of an audience.
    console.error(error);
    return;
  }
  pauseForOverlay();
  progress.visit(station.id);
  refreshProgress();
}

function openGate(gate) {
  quiz.open(gate, {
    onPass() {
      progress.unlockZone(gate.toZone);
      syncGates();
    },
  });
  pauseForOverlay();
}

function pauseForOverlay() {
  game.input.clearPresses();
  game.pause();
  hud.hidePrompt();
}

function onOverlayClosed() {
  game.input.clearPresses();
  game.resume();
  focusCanvas();
}

/**
 * Push the current unlock state into the collision layer, the door sprites and
 * the list of things worth pressing E at. Safe to call as often as you like.
 */
function syncGates() {
  lockGates(game.grid, gates, (zoneId) => progress.isZoneUnlocked(zoneId));

  interactables.length = 0;
  for (const station of stations) interactables.push(station);
  for (const plaque of plaques) interactables.push(plaque);

  for (const gate of gates) {
    const unlocked = progress.isZoneUnlocked(gate.toZone);
    const entity = gateEntities.get(gate.id);
    if (entity) entity.sprite = unlocked ? gate.spriteUnlocked : gate.sprite;
    // An open door has nothing left to ask you.
    if (!unlocked) interactables.push(gate);
  }
}

function refreshProgress() {
  const visited = stations.filter((station) => progress.hasVisited(station.id)).length;
  hud.setProgress(visited, stations.length);
}

function focusCanvas() {
  if (typeof canvas.focus === "function") canvas.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- controls

function wireControls() {
  const resetButton = document.getElementById("reset-button");
  const resetConfirm = document.getElementById("reset-confirm");
  const resetYes = document.getElementById("reset-yes");
  const resetNo = document.getElementById("reset-no");

  const exportButton = document.getElementById("export-button");
  const exportBox = document.getElementById("export-box");
  const exportText = document.getElementById("export-text");
  const exportCopy = document.getElementById("export-copy");
  const exportClose = document.getElementById("export-close");

  // Inline confirmation, never window.confirm. A native dialog on a shared
  // screen looks like the browser has broken rather than like part of the game.
  resetButton.addEventListener("click", () => {
    exportBox.hidden = true;
    resetConfirm.hidden = false;
    resetYes.focus();
  });

  resetNo.addEventListener("click", () => {
    resetConfirm.hidden = true;
    focusCanvas();
  });

  resetYes.addEventListener("click", () => {
    progress.reset();
    syncGates();
    refreshProgress();
    // Re-locking a gate the player has already walked through would seal them
    // into a zone with no way back, so a reset starts them over properly.
    game.respawn();
    hud.setZone(game.grid.zoneAt(game.player.tileX, game.player.tileY));
    resetConfirm.hidden = true;
    focusCanvas();
  });

  exportButton.addEventListener("click", () => {
    resetConfirm.hidden = true;
    exportText.textContent = progress.summary(stations);
    exportBox.hidden = false;
    exportText.focus();
  });

  exportClose.addEventListener("click", () => {
    exportBox.hidden = true;
    focusCanvas();
  });

  exportCopy.addEventListener("click", async () => {
    const text = exportText.textContent;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        flashButton(exportCopy, "Copied");
        return;
      }
    } catch {
      // Fall through to selecting it instead.
    }
    const selection = window.getSelection && window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(exportText);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    flashButton(exportCopy, "Selected — press Ctrl+C");
  });
}

function flashButton(button, message) {
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;
  button.textContent = message;
  setTimeout(() => {
    button.textContent = button.dataset.label || original;
  }, 2000);
}
