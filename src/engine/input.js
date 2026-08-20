/**
 * INPUT
 * =====
 *
 * Keyboard only, by design — see CLAUDE.md. Arrows and WASD for movement,
 * KeyE / Enter / Space for interact, Escape for cancel.
 *
 * Two things here exist because of the talk rather than the game:
 *
 *   1. Arrow keys and Space call preventDefault(). If the page scrolls under a
 *      screen share the audience sees the game jump. Non-negotiable.
 *   2. Held directions are tracked as an ordered stack, so pressing Right while
 *      already holding Down turns immediately instead of waiting for a release.
 *      Never diagonal: this is a four-direction grid game.
 */

const DIRECTION_VECTORS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** Physical key code -> action. Two bindings per direction, on purpose. */
const BINDINGS = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  KeyE: "interact",
  Enter: "interact",
  Space: "interact",
  Escape: "cancel",
};

/** Keys whose browser default (scrolling the page) must be suppressed. */
const SUPPRESS_DEFAULT = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

/**
 * @param {EventTarget} target usually window
 * @returns {{
 *   direction: () => ({dx: number, dy: number}|null),
 *   isDown: (action: string) => boolean,
 *   consumePress: (action: string) => boolean,
 *   clearPresses: () => void,
 *   destroy: () => void
 * }}
 */
export function createInput(target = window) {
  /** Codes currently held down. */
  const held = new Set();
  /** Direction actions in the order they were pressed; last entry wins. */
  const directionStack = [];
  /** Edge-triggered flags, set on key-down and cleared by consumePress. */
  const pressed = Object.create(null);
  /** Everything we attached, so destroy() can take all of it back off. */
  const listeners = [];

  function actionIsHeld(action) {
    for (const code of held) {
      if (BINDINGS[code] === action) return true;
    }
    return false;
  }

  function onKeyDown(event) {
    const action = BINDINGS[event.code];
    if (!action) return;

    if (SUPPRESS_DEFAULT.has(event.code)) event.preventDefault();

    // The OS auto-repeat is not a new press, and neither is a duplicate keydown.
    if (event.repeat || held.has(event.code)) return;

    held.add(event.code);
    pressed[action] = true;

    if (DIRECTION_VECTORS[action] && !directionStack.includes(action)) {
      directionStack.push(action);
    }
  }

  function onKeyUp(event) {
    const action = BINDINGS[event.code];
    if (!action) return;
    if (SUPPRESS_DEFAULT.has(event.code)) event.preventDefault();

    held.delete(event.code);

    // "up" stays held while either ArrowUp or KeyW is still down.
    if (DIRECTION_VECTORS[action] && !actionIsHeld(action)) {
      const at = directionStack.indexOf(action);
      if (at !== -1) directionStack.splice(at, 1);
    }
  }

  // Alt-tabbing away mid-stride otherwise leaves a key stuck down and the
  // player walking into a wall when you come back.
  function onBlur() {
    held.clear();
    directionStack.length = 0;
    for (const action of Object.keys(pressed)) pressed[action] = false;
  }

  function listen(type, handler, options) {
    target.addEventListener(type, handler, options);
    listeners.push([type, handler, options]);
  }

  listen("keydown", onKeyDown, { passive: false });
  listen("keyup", onKeyUp, { passive: false });
  listen("blur", onBlur);

  return {
    /** The most recently pressed held direction, or null. Never diagonal. */
    direction() {
      if (directionStack.length === 0) return null;
      return DIRECTION_VECTORS[directionStack[directionStack.length - 1]];
    },

    isDown(action) {
      return actionIsHeld(action);
    },

    /** True once per physical press. A held key does not repeat. */
    consumePress(action) {
      if (!pressed[action]) return false;
      pressed[action] = false;
      return true;
    },

    /**
     * Throw away every pending press flag.
     *
     * A press flag stays set until something consumes it, and while an overlay
     * is open nothing does — the game is paused. Without this, the E that opens
     * a panel is still sitting in the queue when the panel closes and instantly
     * reopens it. Call this on every overlay open and every overlay close.
     */
    clearPresses() {
      for (const action of Object.keys(pressed)) pressed[action] = false;
    },

    destroy() {
      for (const [type, handler, options] of listeners) {
        target.removeEventListener(type, handler, options);
      }
      listeners.length = 0;
      held.clear();
      directionStack.length = 0;
    },
  };
}
