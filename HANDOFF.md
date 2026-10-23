# Project handoff: DSU Campus Navigator

Context for continuing this project in a new Claude chat. Paste this file or link the repo and say: "Read HANDOFF.md and the code, then tell me what state the project is in before changing anything."

## Project

Campus wayfinding web app for Dayananda Sagar University (Harohalli, Bengaluru, about 162 acres).

- Repo: https://github.com/Mnvv08/dsu-campus-nav
- Live: https://mnvv08.github.io/dsu-campus-nav/
- Deploys automatically via GitHub Actions on every push to `main`.
- Owner works on a MacBook in the terminal. Local clone: `~/Documents/dsu-campus-nav`. Dev server: `cd app && npm run dev` (often lands on port 5174 because 5173 is taken).
- Instructions to the owner should be full copy-paste commands that say which folder to run them from. Folder mix-ups have happened before.

## Stack

- `app/`: React + Vite + Leaflet PWA. Service worker in `app/public/sw.js`.
- `worker/`: Cloudflare Worker that proxies the AI assistant (Claude Haiku 4.5) and holds the API key.
- `tools/`: `picker.html`, `pathmaker.html`, `signage.html`, `buildmaker.html` for collecting data.
- Data in `app/src/data/`: `places.json` (8 places), `paths.json` (6 footpaths), `buildings.json` (empty until traced).
- Routing: Dijkstra over hand-traced footpaths, with an OpenStreetMap foot-routing fallback.
- Languages: English, Kannada, Hindi, Tamil, Telugu, Malayalam, Gujarati.

## Done and pushed

1. **Map visual upgrade.** Round pins with consistent SVG icons, dashed ring and "?" badge for unverified places, footpath network drawn on the map, route with start and destination markers, basemap/paths/recenter buttons, scale bar, legend.
2. **Basemap.** A vector basemap (OpenFreeMap through maplibre-gl-leaflet, lazy loaded) exists as a toggle, but OpenStreetMap has almost nothing mapped for the DSU campus, so it looks blank. Satellite (Esri imagery) is the default.
3. **Routing fix.** When traced paths don't cover a trip, the app asks `routing.openstreetmap.de` for foot directions instead of drawing a straight line (`app/src/lib/osmRoute.js`, `App.jsx`). Tested only with mocked responses. Not yet confirmed on a real phone.
4. **Pin and label clean-up.** Pins scale down when zoomed out. Labels try below, right, left, above, and hide if no free spot, with importance priority (commit `ae8f330`).

## Built but check whether applied and deployed

5. **Building outline tool.** `tools/buildmaker.html` (click roof corners, snap shared corners, link to a place, export `buildings.json`) plus `MapView.jsx` drawing outlines from `app/src/data/buildings.json` at zoom 16 and above.
6. **Worker hardening.** The Worker now builds the AI's instructions from the bundled `places.json` rather than from places sent by the browser (the old code let anyone inject instructions). Also: 16 KB body cap, message validation, Cloudflare rate limiter `CHAT_LIMITER` (12 per IP per minute), 20 s upstream timeout, a rule limiting the assistant to campus directions, localhost 5174 and 4173 allowed. It needs `wrangler deploy`, and must be redeployed whenever `places.json` changes. A monthly spend limit should also be set in the Anthropic console.

## Important caveat

The previous assistant could not open a browser, so none of the visual work was ever seen rendering. Treat rendering as unverified until the owner sends screenshots. The Worker logic was tested with simulated requests, not against the live Anthropic API.

## Known gaps and next steps

- **Data is the main gap.** Only 8 places and 6 paths. Target: 15 to 20 places (gates, admin and fees, canteens, library, bus stop, hostels, medical), every place connected to the main gate, stairs tagged, no remaining `guess` entries, 3 or more routes tested on foot.
- Offer: a data validator script (connected graph, duplicate IDs, missing translations) and a field checklist.
- Trace building outlines with `buildmaker.html`.
- New UI strings are English only (map button tooltips, "Walking path", "via OpenStreetMap footpaths").
- "Avoid stairs" does not apply to OpenStreetMap routes.
- Add unit tests for routing and turn-instruction logic.
- Portfolio polish: README screenshots, architecture diagram, short case study.
- Option: add DSU's buildings to OpenStreetMap so the vector basemap becomes useful.
