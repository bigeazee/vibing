/**
 * HUD
 * ===
 *
 * The three things that have to be true on screen at all times: which zone you
 * are in, how much you have seen, and whether there is something in front of you
 * to open. An HTML layer over the canvas, not drawn into it.
 *
 * Every setter is called once a frame, so each one compares before it writes.
 * Assigning the same textContent sixty times a second is not free, and a HUD
 * that thrashes layout is exactly the sort of thing that stutters on the machine
 * driving the projector.
 *
 * The prompt sits low and centre, in a pill with its own solid background, so it
 * stays readable whatever tile happens to be under it.
 */

/**
 * @param {HTMLElement} root an empty container element in index.html
 * @returns {{showPrompt: (text: string) => void, hidePrompt: () => void,
 *            setZone: (zoneId: number) => void,
 *            setProgress: (visited: number, total: number) => void}}
 */
export function createHud(root) {
  if (!root) throw new Error("createHud: needs a container element from index.html.");

  root.classList.add("hud");

  const zone = el("span", "hud-zone", "Zone 1");
  const progress = el("span", "hud-progress", "");
  const meta = el("div", "hud-meta");
  meta.append(zone, progress);

  const promptText = el("span", "hud-prompt-text", "");
  const prompt = el("div", "hud-prompt");
  prompt.append(el("span", "hud-key", "E"), promptText);
  prompt.hidden = true;

  root.append(meta, prompt);

  let lastPrompt = null;
  let lastZone = null;
  let lastProgress = null;

  return {
    showPrompt(text) {
      const next = String(text ?? "");
      if (next !== lastPrompt) {
        promptText.textContent = next;
        lastPrompt = next;
      }
      if (prompt.hidden) prompt.hidden = false;
    },

    hidePrompt() {
      if (!prompt.hidden) prompt.hidden = true;
    },

    /** Zone 0 means "between the named ranges"; leave the last real zone up. */
    setZone(zoneId) {
      if (!Number.isInteger(zoneId) || zoneId < 1 || zoneId === lastZone) return;
      lastZone = zoneId;
      zone.textContent = `Zone ${zoneId}`;
    },

    setProgress(visited, total) {
      const next = `${visited} / ${total} stations`;
      if (next === lastProgress) return;
      lastProgress = next;
      progress.textContent = next;
    },
  };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
