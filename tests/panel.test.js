/**
 * WHAT THE DEMO SECTION PROMISES
 * ==============================
 *
 * There are three states and the difference between two of them is the whole
 * point:
 *
 *   placeholder            "Playable demo coming soon."
 *   external, with links   the links
 *   external, no links     "No demo linked for this one yet."
 *
 * The last one is for a thing that HAS been built and has nowhere public to
 * send anybody. Rendering "coming soon" there promises something nobody has
 * promised, and this game's argument is a difficulty curve made of receipts:
 * an audience that catches one thing overstated stops believing the rest of it.
 *
 * Runs against tests/fake-dom.js, which is a tree builder and not a browser.
 * See the warning at the top of that file about what it will not tell you.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { byClass, installFakeDom } from "./fake-dom.js";

const BASE = {
  id: "example",
  zone: 3,
  flagship: false,
  title: "Example",
  problem: "A problem.",
  build: "A thing.",
  steps: ["One.", "Two.", "Three."],
  prompt: "Build me a thing.",
  receipt: {
    buildTime: "An evening (est.)",
    tool: "Claude web",
    cost: "Free tier (est.)",
    lines: "~100 (est.)",
    dataTouched: "None.",
    skill: "Saying what you want",
    hardestPart: "Stopping",
  },
  demo: { type: "placeholder" },
  links: [],
};

/**
 * Open a station in a real panel built against the fake DOM, and hand back the
 * panel body so the test can read what came out.
 */
async function renderStation(overrides) {
  const dom = installFakeDom();
  try {
    // Imported inside the fake, because createPanel touches document as it runs.
    const { createPanel } = await import("../src/ui/panel.js");
    const root = dom.document.createElement("div");
    dom.body.append(root);
    createPanel(root).open({ ...BASE, ...overrides });
    return byClass(root, "panel-body")[0];
  } finally {
    dom.detach();
  }
}

test('demo.type "placeholder" says a demo is coming', async () => {
  const body = await renderStation({ demo: { type: "placeholder" }, links: [] });
  assert.match(body.textContent, /Playable demo coming soon\./);
  assert.equal(byClass(body, "demo-mount").length, 1, "and leaves the documented mount point");
});

test('demo.type "external" with no links says there is none, not that one is coming', async () => {
  const body = await renderStation({ demo: { type: "external" }, links: [] });

  assert.match(body.textContent, /No demo linked for this one yet\./);
  assert.ok(
    !/coming soon/i.test(body.textContent),
    "a built thing with nowhere to point at must not promise a demo"
  );
  assert.equal(byClass(body, "demo-links").length, 0, "and there is no empty link list");
});

test('demo.type "external" with links renders them', async () => {
  const body = await renderStation({
    demo: { type: "external" },
    links: [{ label: "The thing", href: "https://example.invalid/thing" }],
  });

  const anchors = byClass(body, "demo-links")[0].children;
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].children[0].href, "https://example.invalid/thing");
  assert.equal(anchors[0].textContent, "The thing");
  assert.ok(!/No demo linked|coming soon/i.test(body.textContent));
});
