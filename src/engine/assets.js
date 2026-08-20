/**
 * ASSET LOADING
 * =============
 *
 * Loads the tile atlases named in the sprite contract.
 *
 * The whole point of this module is the failure path. A missing atlas must
 * produce an error naming the exact file that failed, which index.html then
 * shows on screen in large type. A blank canvas with something in the console is
 * a failure of this package: nobody watching a talk opens devtools.
 */

/**
 * @param {object} atlases ATLASES from src/content/sprites.js
 * @returns {Promise<Record<string, HTMLImageElement>>} same keys, loaded images
 */
export async function loadAtlases(atlases) {
  const keys = Object.keys(atlases);
  if (keys.length === 0) {
    throw new Error("loadAtlases: no atlases defined in the sprite contract.");
  }

  const images = await Promise.all(keys.map((key) => loadImage(atlases[key].src)));

  const loaded = {};
  keys.forEach((key, i) => {
    loaded[key] = images[i];
  });
  return loaded;
}

/**
 * @param {string} src path relative to index.html — never absolute, because the
 *   site is served from a subpath on GitHub Pages
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () =>
        reject(
          new Error(
            `Could not load the image "${src}". Check that the file exists and that ` +
              `the path is relative to index.html.`
          )
        ),
      { once: true }
    );
    image.src = src;
  });
}
