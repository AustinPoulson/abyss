# abyss

A small, framework-free art site. Open `index.html` to view the piece.
`controls.html` is a browser-only preview panel; its changes are stored locally
and do not change the shared artwork configuration.

## Local authoring panel

Run `npm run controls`, then open `http://127.0.0.1:4173/`. The local authoring
panel edits `config.json` directly and creates a `config.json.bak` before each save.
The server tracks its process ID in `abyss-controls.pid`; use
`npm run controls:stop` if a terminal closes unexpectedly.
