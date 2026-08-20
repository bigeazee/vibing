/**
 * GATE QUIZ
 * =========
 *
 * The one question between two zones. An HTML overlay above the canvas.
 *
 * THERE IS NO FAIL STATE HERE AND THERE MUST NEVER BE ONE. A wrong answer shows
 * the gate's nudge and leaves everything exactly as it was: nothing is disabled,
 * nothing is counted, nothing turns red, and the player can answer again
 * immediately, as many times as they like. Escape walks away without answering -
 * they simply have not passed yet. CLAUDE.md is explicit that this game has no
 * way to lose, and a quiz is the easiest place to break that by accident.
 *
 * Answering is deliberately over-served: 1-4 pick an option outright, Up and
 * Down move the selection, Enter takes it, and every option is also a real
 * button you can click. This gets driven live in front of an audience.
 */

import { el, trapTab } from "./overlay.js";

/** How long the confirmation stays up before the quiz closes itself. */
const PASS_LINGER_MS = 1100;

/**
 * @param {HTMLElement} root an empty container element in index.html
 * @returns {{open: (gate: object, handlers?: {onPass?: Function, onClose?: Function}) => void,
 *            close: () => void, isOpen: () => boolean}}
 */
export function createGateQuiz(root) {
  if (!root) throw new Error("createGateQuiz: needs a container element from index.html.");

  let open = false;
  let passed = false;
  let onPass = null;
  let onClose = null;
  let closeTimer = null;
  let returnFocusTo = null;
  let buttons = [];

  root.classList.add("overlay");
  root.hidden = true;

  const backdrop = el("div", "overlay-backdrop");
  const dialog = el("div", "quiz");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "quiz-question");

  const eyebrow = el("p", "quiz-eyebrow", "The way ahead");
  const question = el("h2", "quiz-question");
  question.id = "quiz-question";

  const options = el("ul", "quiz-options");

  // aria-live so the nudge is announced rather than only seen.
  const note = el("p", "quiz-note");
  note.setAttribute("role", "status");
  note.setAttribute("aria-live", "polite");

  const help = el(
    "p",
    "quiz-help",
    "Press 1 to 4, or use the up and down arrows and Enter. Escape to walk away — you can come back."
  );

  dialog.append(eyebrow, question, options, note, help);
  root.append(backdrop, dialog);

  backdrop.addEventListener("click", close);
  window.addEventListener("keydown", onKeyDown, { passive: false });

  function onKeyDown(event) {
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      trapTab(dialog, event);
      return;
    }
    if (passed) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= buttons.length) {
      event.preventDefault();
      buttons[digit - 1].focus();
      buttons[digit - 1].click();
    }
  }

  /** Selection IS focus, so Enter needs no special handling: the button takes it. */
  function move(step) {
    if (buttons.length === 0) return;
    const current = buttons.indexOf(document.activeElement);
    const next = current === -1 ? 0 : (current + step + buttons.length) % buttons.length;
    buttons[next].focus();
  }

  /**
   * @param {object} gate one object from src/content/gates.js
   * @param {{onPass?: Function, onClose?: Function}} [handlers]
   *   onPass fires once, on a correct answer, before the quiz closes.
   *   onClose fires on EVERY way out - Escape, the backdrop, and the timer that
   *   closes the quiz after a correct answer - so the caller never has to poll
   *   isOpen() to notice.
   */
  function openQuiz(gate, handlers = {}) {
    if (!gate) throw new Error("gateQuiz.open: needs a gate object.");
    if (!Array.isArray(gate.options) || gate.options.length === 0) {
      throw new Error(`gateQuiz.open: gate "${gate.id}" has no options to answer.`);
    }

    cancelCloseTimer();
    passed = false;
    onPass = typeof handlers.onPass === "function" ? handlers.onPass : null;
    onClose = typeof handlers.onClose === "function" ? handlers.onClose : null;

    question.textContent = gate.question || "";
    note.textContent = "";
    note.className = "quiz-note";

    buttons = gate.options.map((option, i) => {
      const button = el("button", "quiz-option");
      button.type = "button";
      button.append(el("span", "quiz-key", String(i + 1)), el("span", "quiz-label", option.text));
      button.addEventListener("click", () => answer(gate, option));
      return button;
    });

    options.replaceChildren(
      ...buttons.map((button) => {
        const item = el("li");
        item.append(button);
        return item;
      })
    );

    returnFocusTo = document.activeElement;
    root.hidden = false;
    open = true;
    buttons[0].focus();
  }

  function answer(gate, option) {
    if (passed) return; // The confirmation is already up; ignore the extra keys.

    if (!option.correct) {
      // Everything stays live. No counter, no disabled option, no red.
      note.textContent = gate.nudge || "Not quite — the answer is somewhere in this zone.";
      note.className = "quiz-note is-nudge";
      return;
    }

    passed = true;
    note.textContent = "That is the one. The way ahead is open.";
    note.className = "quiz-note is-pass";
    for (const button of buttons) button.disabled = true;

    if (onPass) {
      const fire = onPass;
      onPass = null; // Fires once, whatever happens next.
      fire();
    }

    // Left up for a beat so the player sees the door open behind the overlay.
    closeTimer = setTimeout(close, PASS_LINGER_MS);
  }

  function close() {
    if (!open) return;
    open = false;
    passed = false;
    onPass = null;
    cancelCloseTimer();
    root.hidden = true;
    if (returnFocusTo && typeof returnFocusTo.focus === "function" && document.contains(returnFocusTo)) {
      returnFocusTo.focus();
    }
    returnFocusTo = null;
    // Cleared before it fires, so a handler that reopens the quiz is not then
    // holding a stale closer.
    const closed = onClose;
    onClose = null;
    if (closed) closed();
  }

  function cancelCloseTimer() {
    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  return {
    open: openQuiz,
    close,
    isOpen() {
      return open;
    },
  };
}
