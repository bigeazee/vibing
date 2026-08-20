# Vibing

Vibing is a small top-down browser game that doubles as a talk about
AI-assisted development. You walk a map, bump into things, and each thing you
open describes something a product manager could realistically build themselves.
It runs entirely in your browser — no server, no accounts, no tracking.

**This is a work in progress.** The game is content-complete: three zones, nine
stations, three zone plaques and two gates, on the real 92 x 20 map. What is not
done is deployment and the live-site check, and the two flagship mini-games are
still honest "coming soon" placeholders.

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
| `E`, `Enter` or `Space` | Open whatever you are standing next to |
| `Escape` | Close a panel, or walk away from a gate question |

Inside a station panel, `↑` `↓` and `PageUp` `PageDown` scroll it. At a gate,
`1`–`4` pick an answer outright, or use `↑` `↓` and `Enter`.

You do not have to be facing something to open it — standing next to it is
enough. Facing it just decides which one you get when there are two.

## Gates and progress

Each zone ends at a gate with one question, and the answer is findable in the
zone you are standing in. A wrong answer says so and lets you try again straight
away: there is no score, no timer and no way to lose this game.

Where you have been is saved in your own browser's local storage, under the key
`vibing.v1`, and nowhere else. Nothing is sent anywhere and nothing is measured
— there is no server to send it to. Two buttons under the game:

- **Reset progress** clears it and closes the gates again, after asking.
- **Export progress** shows a few lines you can copy and paste into a chat. It
  contains only which stations you opened and which zones you unlocked.

If that saved data ever gets corrupted, the game quietly starts you again from
scratch rather than showing you an error.

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
`node:test`. Node 22 or newer.

## Contributing

A station is one object in one file, and the guide to adding one — plus a
backlog of ideas nobody has picked up yet — is in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

All sprite art is by [Kenney](https://kenney.nl) and is CC0. See
[CREDITS.md](CREDITS.md).
