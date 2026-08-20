/**
 * OVERLAY HELPERS
 * ===============
 *
 * The two functions every overlay in this project needs and neither of them is
 * worth writing twice.
 *
 * `el` is here because content copy is DATA and data never becomes markup:
 * everything in the panel and the quiz is built with createElement and
 * textContent, never innerHTML, so a station author cannot accidentally - or
 * deliberately - put a script tag on the live site.
 *
 * `trapTab` is here because an overlay that lets Tab wander out into the page
 * behind it is not really modal. Both the panel and the gate quiz are dialogs
 * over a canvas that still has focus behaviour of its own.
 */

/**
 * @param {string} tag
 * @param {string|null} [className]
 * @param {string} [text] set with textContent - never parsed as HTML
 * @returns {HTMLElement}
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/**
 * Keep Tab inside `container`. Call it from a keydown handler on Tab.
 *
 * @param {HTMLElement} container the dialog element
 * @param {KeyboardEvent} event
 */
export function trapTab(container, event) {
  const focusable = container.querySelectorAll(
    'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
