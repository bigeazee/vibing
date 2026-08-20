/**
 * STATION PANEL
 * =============
 *
 * The overlay that opens when you press E next to a station. An HTML element
 * above the canvas - nothing here is drawn into the canvas.
 *
 * Content is built with createElement and textContent, never innerHTML. Station
 * copy is data, and data never becomes markup.
 *
 * Two things are structural rather than decorative:
 *
 *   1. The four sections come out in CLAUDE.md's order, always: the problem,
 *      what you'd build, get started, the receipt. The receipt is last because
 *      the receipt is the argument.
 *   2. The panel scrolls ITSELF on Up/Down and PageUp/PageDown. input.js calls
 *      preventDefault() on the arrows so the page can never scroll under a
 *      screen share, which also means the browser will not scroll this panel
 *      for us. Weakening that preventDefault to get scrolling back would trade
 *      a working panel for a jumping page. We scroll by hand instead.
 */

import { el, trapTab } from "./overlay.js";

/** The seven receipt fields, in CLAUDE.md's order. Never reorder, never trim. */
const RECEIPT_FIELDS = [
  ["buildTime", "Build time"],
  ["tool", "Tool used"],
  ["cost", "Cost"],
  ["lines", "Lines of code"],
  ["dataTouched", "Data touched"],
  ["skill", "Skill required"],
  ["hardestPart", "Hardest part"],
];

/** How far Up/Down nudge the panel body, in pixels. */
const SCROLL_STEP = 72;

/**
 * @param {HTMLElement} root an empty container element in index.html
 * @returns {{open: (station: object) => void, openPlaque: (plaque: object) => void,
 *            close: () => void, isOpen: () => boolean,
 *            onClose: (handler: Function) => void}}
 */
export function createPanel(root) {
  if (!root) throw new Error("createPanel: needs a container element from index.html.");

  const closeHandlers = [];
  let open = false;
  let returnFocusTo = null;
  let flashTimer = null;

  root.classList.add("overlay");
  root.hidden = true;

  const backdrop = el("div", "overlay-backdrop");
  const dialog = el("div", "panel");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "panel-title");

  const eyebrow = el("p", "panel-eyebrow");
  const title = el("h2", "panel-title");
  title.id = "panel-title";

  const closeButton = el("button", "button panel-close", "Close");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close this panel (Escape)");

  const head = el("header", "panel-head");
  const headText = el("div", "panel-head-text");
  headText.append(eyebrow, title);
  head.append(headText, closeButton);

  // tabindex makes the scroll container focusable, so the keys below have
  // somewhere sensible to land the moment the panel opens.
  const body = el("div", "panel-body");
  body.tabIndex = 0;

  dialog.append(head, body);
  root.append(backdrop, dialog);

  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);
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
    // Never steal the arrows from a text field, if one ever ends up in here.
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

    const page = Math.max(SCROLL_STEP, body.clientHeight - 48);
    if (event.key === "ArrowDown") scrollBy(SCROLL_STEP);
    else if (event.key === "ArrowUp") scrollBy(-SCROLL_STEP);
    else if (event.key === "PageDown") scrollBy(page);
    else if (event.key === "PageUp") scrollBy(-page);
    else if (event.key === "Home") body.scrollTop = 0;
    else if (event.key === "End") body.scrollTop = body.scrollHeight;
    else return;

    event.preventDefault();
  }

  function scrollBy(amount) {
    body.scrollTop += amount;
  }

  /**
   * @param {object} station one object from src/content/stations.js
   * @throws {Error} on demo.type "embedded", which is not implemented. Better a
   *   loud failure than a panel that quietly implies a demo exists.
   */
  function openPanel(station) {
    if (!station) throw new Error("panel.open: needs a station object.");

    // Built before anything is shown, so a station that throws leaves the game
    // running rather than stranding the player behind a half-drawn overlay.
    const content = buildContent(station);

    eyebrow.textContent = station.flagship
      ? `Zone ${station.zone} · Flagship`
      : `Zone ${station.zone}`;
    title.textContent = station.title || station.id;

    body.replaceChildren(...content);
    body.scrollTop = 0;

    returnFocusTo = document.activeElement;
    root.hidden = false;
    open = true;
    body.focus();
  }

  /**
   * A plaque uses the panel's chrome and none of its structure.
   *
   * No four sections and NO RECEIPT: a zone plaque has no build time, no cost
   * and no line count, and a receipt card carrying seven invented figures would
   * cost more trust than the plaque is worth. See src/content/plaques.js.
   *
   * @param {object} plaque one object from src/content/plaques.js
   */
  function openPlaquePanel(plaque) {
    if (!plaque) throw new Error("panel.openPlaque: needs a plaque object.");

    const nodes = [];
    if (plaque.level) nodes.push(el("p", "plaque-level", String(plaque.level)));
    nodes.push(...paragraphs(plaque.body));

    eyebrow.textContent = "The way this zone works";
    title.textContent = plaque.title || `Zone ${plaque.zone}`;

    body.replaceChildren(...nodes);
    body.scrollTop = 0;

    returnFocusTo = document.activeElement;
    root.hidden = false;
    open = true;
    body.focus();
  }

  function close() {
    if (!open) return;
    open = false;
    root.hidden = true;
    if (flashTimer !== null) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
    if (returnFocusTo && typeof returnFocusTo.focus === "function" && document.contains(returnFocusTo)) {
      returnFocusTo.focus();
    }
    returnFocusTo = null;
    for (const handler of closeHandlers) handler();
  }

  // ---------------------------------------------------------------- content

  function buildContent(station) {
    const nodes = [];

    nodes.push(section("The problem", paragraphs(station.problem)));
    nodes.push(section("What you'd build", paragraphs(station.build)));
    nodes.push(demoSection(station));
    nodes.push(section("Get started", [steps(station.steps), promptBlock(station.prompt)]));
    nodes.push(section("The receipt", [receipt(station.receipt)]));

    return nodes.filter(Boolean);
  }

  function section(heading, children) {
    const node = el("section", "panel-section");
    node.append(el("h3", "panel-heading", heading), ...children);
    return node;
  }

  /** Blank lines in station copy are paragraph breaks, because prose has them. */
  function paragraphs(text) {
    return String(text ?? "")
      .split(/\n\s*\n/)
      .filter((part) => part.trim() !== "")
      .map((part) => el("p", "panel-text", part.trim()));
  }

  function steps(list) {
    const ordered = el("ol", "panel-steps");
    for (const step of Array.isArray(list) ? list : []) {
      ordered.append(el("li", null, String(step)));
    }
    return ordered;
  }

  function promptBlock(text) {
    const block = el("div", "prompt-block");
    const bar = el("div", "prompt-bar");
    const label = el("span", "prompt-label", "Copy this into Claude to start");
    const copyButton = el("button", "button prompt-copy", "Copy");
    copyButton.type = "button";

    const pre = el("pre", "prompt-text", String(text ?? ""));
    pre.tabIndex = 0;

    copyButton.addEventListener("click", () => copyPrompt(pre, copyButton));
    bar.append(label, copyButton);
    block.append(bar, pre);
    return block;
  }

  /**
   * Clipboard where it exists, selection where it does not. navigator.clipboard
   * is missing on an insecure origin and can reject without warning, so both
   * paths end somewhere useful for the reader rather than in a dead button.
   */
  async function copyPrompt(pre, button) {
    const text = pre.textContent;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        flash(button, "Copied");
        return;
      }
    } catch {
      // Fall through to selecting it.
    }
    selectAll(pre);
    flash(button, "Selected — press Ctrl+C");
  }

  function flash(button, message) {
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = message;
    if (flashTimer !== null) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      button.textContent = button.dataset.label || original;
      flashTimer = null;
    }, 2000);
  }

  function receipt(fields) {
    const card = el("div", "receipt");
    const grid = el("dl", "receipt-grid");
    const values = fields && typeof fields === "object" ? fields : {};

    for (const [key, label] of RECEIPT_FIELDS) {
      const row = el("div", "receipt-row");
      const value = values[key];
      row.append(
        el("dt", null, label),
        el("dd", value === undefined || value === null || value === "" ? "receipt-missing" : null,
          value === undefined || value === null || value === "" ? "(not stated)" : String(value))
      );
      grid.append(row);
    }
    card.append(grid);

    // The estimate note is derived from the values rather than from an eighth
    // receipt field, because there are seven fields and there will only ever be
    // seven fields.
    const estimated = RECEIPT_FIELDS.some(([key]) => /\(est\.\)/.test(String(values[key] ?? "")));
    if (estimated) {
      card.append(
        el(
          "p",
          "receipt-note",
          "Anything marked (est.) is an estimate rather than a measurement. Those get " +
            "replaced with the real figure the moment there is one."
        )
      );
    }
    return card;
  }

  function demoSection(station) {
    const demo = station.demo || { type: "placeholder" };

    if (demo.type === "embedded") {
      throw new Error(
        `Station "${station.id}": demo.type "embedded" is not implemented yet. ` +
          `Use "placeholder" until an embedded demo module exists.`
      );
    }

    if (demo.type === "external") {
      const links = Array.isArray(station.links) ? station.links : [];
      if (links.length === 0) {
        return section("The demo", [el("p", "demo-note", "No demo linked for this one yet.")]);
      }
      const list = el("ul", "demo-links");
      for (const link of links) {
        const item = el("li");
        const anchor = el("a", null, link.label || link.href);
        anchor.href = link.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        item.append(anchor);
        list.append(item);
      }
      return section("The demo", [list]);
    }

    // placeholder, and anything unrecognised, gets the honest coming-soon state.
    const mount = el("div", "demo-mount");
    mount.dataset.demoMount = station.id;
    mount.append(el("p", "demo-note", "Playable demo coming soon."));
    // MOUNT POINT. A future embedded demo module renders into this element:
    // find it with panelRoot.querySelector('[data-demo-mount="<station id>"]')
    // and replace its children. Nothing else in the panel needs to change.
    mount.append(document.createComment(" embedded demo module mounts here "));
    return section("The demo", [mount]);
  }

  return {
    open: openPanel,
    openPlaque: openPlaquePanel,
    close,
    isOpen() {
      return open;
    },
    onClose(handler) {
      if (typeof handler === "function") closeHandlers.push(handler);
    },
  };
}

// -------------------------------------------------------------------- shared

function selectAll(node) {
  const selection = window.getSelection && window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
  node.focus();
}
