# Vibing

Vibing is a small top-down browser game that doubles as a talk about
AI-assisted development. You walk a map, bump into things, and each thing you
open describes something a product manager could realistically build themselves.
It runs entirely in your browser — no server, no accounts, no tracking.

**This is a work in progress.** Right now the repository contains the engine and
a throwaway demo map. The three real zones, the station panels and the quiz
gates are not built yet.

## Run it locally

Vibing uses native ES modules, which browsers refuse to load over the `file://`
protocol. **Opening `index.html` by double-clicking it will not work** — you will
get a blank page and a CORS error in the console. Serve the folder instead:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Any static file server will do — `npx serve`, `php -S localhost:8000`, whatever
you already have. There is no build step and nothing to install.

## Controls

| Key | Action |
|---|---|
| Arrow keys or `W` `A` `S` `D` | Move |
| `E`, `Enter` or `Space` | Interact *(nothing to interact with yet)* |
| `Escape` | Cancel |

## Desktop and keyboard only

Vibing needs a physical keyboard. There are no touch controls, and none are
planned for the first version — phone and tablet visitors get a short note
saying so rather than a canvas they cannot play. It targets current Chrome,
Edge and Firefox.

## Tests

```
node --test
```

No test framework and nothing to install: the tests use Node's built-in
`node:test`. Node 20 or newer.

On Node 20 you can also point the runner at the folder with `node --test tests/`.
Node 22 changed how the runner treats a bare directory argument, so on newer
versions use `node --test` on its own, or `node --test tests/*.test.js`.

## Credits

All sprite art is by [Kenney](https://kenney.nl) and is CC0. See
[CREDITS.md](CREDITS.md).
