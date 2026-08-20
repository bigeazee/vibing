/**
 * THE SMALLEST DOM src/ui/panel.js WILL RUN AGAINST
 * =================================================
 *
 * Not a browser, and not trying to be. `node --test` has to run with nothing
 * installed - CLAUDE.md is explicit that a test framework you have to `npm
 * install` is not allowed here - so testing that the panel renders the right
 * words means handing it enough of a document to build a tree in.
 *
 * WHAT IT DOES: createElement, append, replaceChildren, textContent, class
 * names, dataset, attributes, focus, and enough of `window` for a module to
 * register a keydown listener at construction.
 *
 * WHAT IT DOES NOT DO, and what a test must therefore not rely on: layout,
 * scrolling, selectors, events actually firing, or anything about how a real
 * browser lays a dialog out. querySelectorAll throws rather than quietly
 * returning nothing, so a test that drifts into needing a real DOM fails loudly
 * instead of passing for the wrong reason. Walk the tree with findAll() below.
 */

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.className = "";
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.hidden = false;
    this.disabled = false;
    this.id = "";
    this.type = "";
    this.href = "";
    this.rel = "";
    this.target = "";
    this.tabIndex = -1;
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.clientHeight = 0;
    this.ownText = "";
  }

  get textContent() {
    return this.ownText + this.children.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this.children = [];
    this.ownText = value === undefined || value === null ? "" : String(value);
  }

  get classList() {
    return {
      add: (name) => {
        const names = this.className.split(" ").filter(Boolean);
        if (!names.includes(name)) names.push(name);
        this.className = names.join(" ");
      },
      contains: (name) => this.className.split(" ").includes(name),
    };
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this;
      this.children.push(node);
    }
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.ownText = "";
    this.append(...nodes);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    const has = Object.prototype.hasOwnProperty.call(this.attributes, name);
    return has ? this.attributes[name] : null;
  }

  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }

  focus() {
    fakeDocument.activeElement = this;
  }

  querySelectorAll() {
    throw new Error(
      "tests/fake-dom.js does not do selectors. Use findAll() from this module, or move the " +
        "test to something that runs in a real browser."
    );
  }
}

class FakeComment extends FakeNode {
  constructor(text) {
    super("#comment");
    this.ownText = String(text);
  }

  get textContent() {
    return "";
  }
}

const fakeDocument = {
  activeElement: null,
  body: null,
  createElement: (tag) => new FakeNode(tag),
  createComment: (text) => new FakeComment(text),
  createRange: () => ({ selectNodeContents() {} }),
  contains(node) {
    let here = node;
    while (here) {
      if (here === fakeDocument.body) return true;
      here = here.parentNode;
    }
    return false;
  },
};

const fakeWindow = {
  addEventListener() {},
  removeEventListener() {},
  getSelection: () => null,
};

/**
 * Install the fake as globalThis.document and globalThis.window, and hand back a
 * detach function. Call detach in a test's finally, so one test's globals never
 * leak into the next file.
 *
 * @returns {{document: object, window: object, body: FakeNode, detach: () => void}}
 */
export function installFakeDom() {
  const before = { document: globalThis.document, window: globalThis.window };
  fakeDocument.body = new FakeNode("body");
  fakeDocument.activeElement = fakeDocument.body;

  globalThis.document = fakeDocument;
  globalThis.window = fakeWindow;
  // globalThis.navigator is left alone: it is getter-only in Node, and Node's
  // own navigator has no clipboard, which is the same thing an insecure origin
  // looks like. Nothing here clicks the copy button, so that path never runs.

  return {
    document: fakeDocument,
    window: fakeWindow,
    body: fakeDocument.body,
    detach() {
      globalThis.document = before.document;
      globalThis.window = before.window;
    },
  };
}

/** Every node under `root`, including `root`, that `match` says yes to. */
export function findAll(root, match) {
  const found = [];
  const walk = (node) => {
    if (match(node)) found.push(node);
    for (const child of node.children) walk(child);
  };
  walk(root);
  return found;
}

/** Every node under `root` carrying `className`. */
export function byClass(root, className) {
  return findAll(root, (node) => node.className.split(" ").includes(className));
}
