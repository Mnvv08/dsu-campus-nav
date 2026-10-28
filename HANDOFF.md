# Project handoff: DSU Campus Navigator

Context for continuing this project in a new Claude chat. Link the repo and say: "Read HANDOFF.md and the code, then tell me what state the project is in before changing anything."

Last updated: 28 October 2026.

## Project

Campus wayfinding web app for Dayananda Sagar University (Harohalli, Bengaluru, about 162 acres).

- Repo: https://github.com/Mnvv08/dsu-campus-nav
- Live: https://mnvv08.github.io/dsu-campus-nav/
- Deploys automatically via GitHub Actions on every push to `main` (also runnable by hand: Actions tab → Deploy → Run workflow).
- Owner works on a MacBook in the terminal. Local clone: `~/Documents/dsu-campus-nav`. Run `npm run dev`, `npm run build` and `npm run validate` from `app/`; run git commands from the project root. Dev server often lands on port 5174.
- Instructions to the owner should be full copy-paste commands that say which folder to run them from. Folder mix-ups have happened before.
- The owner's browser sometimes saves downloads into the project folder. Zip files are gitignored, but check `git status` before committing.

## Stack

- `app/`: React + Vite + Leaflet PWA. Service worker in `app/public/sw.js`.
- `worker/`: Cloudflare Worker that proxies the AI assistant (Claude Haiku 4.5) and holds the API key.
- `tools/`: `picker.html`, `pathmaker.html`, `signage.html`, `buildmaker.html` for collecting data.
- Data in `app/src/data/`: `places.json`, `paths.json`, `buildings.json`.
- Routing: Dijkstra over hand-traced footpaths (`app/src/lib/route.js`), with an OpenStreetMap foot-routing fallback (`app/src/lib/osmRoute.js`).
- Languages: English, Kannada, Hindi, Tamil, Telugu, Malayalam, Gujarati.

## Current data state (`npm run validate`)

- 10 places (target 15 to 20). 2 are guesses: `ai-building`, `hostel-girls-2sharing`. `hostel-mess` is marked confirmed but its coordinates are rounded (12.6576, 77.4462), so re-check it in the field.
- 24 named footpaths, 102 points, one connected network, traced on 29 October 2026 from satellite imagery along the visible roads (not yet walked). All 36 on-campus trips route; the 9 that don't all involve the off-campus bus stand.
- 0 building outlines.
- Only warning: `harohalli-bus-stand` is 2.6 km from any path (it is off campus, so that is expected).
- Each path has a `name` ("the road along the lake"). Directions use these names, so a newly traced path should get one: edit `paths.json` after exporting from `tools/pathmaker.html`, which keeps existing names but does not ask for new ones.
- The "likely real gate" at the gatehouse by the highway (where `front-drive`, `avenue` and `gate-to-plaza` meet) is a guess from imagery; confirm on campus.

## AI assistant (Worker)

- **Deployed** on 24 October 2026 at `https://dsu-campus-chat.dsu-nav.workers.dev` (Cloudflare account of manavsocial2008@gmail.com, workers.dev subdomain `dsu-nav`).
- `ANTHROPIC_API_KEY` secret is set on the Worker.
- GitHub repo secret `VITE_CHAT_URL` is set to that URL and the live site was rebuilt with it.
- **Not answering yet:** test requests return 502 "The assistant is unavailable right now", most likely because the Anthropic console account has no credits. Add credits (about $5, auto-reload off; prepaid credits act as the spend cap). Make sure the key comes from the owner's own console account; one console session seen was "Lakshya's Individual Org".
- Hardening in place: the Worker builds the assistant's instructions from its own bundled `places.json` and ignores anything the browser sends; origin allow-list; 16 KB body cap; message validation; Cloudflare rate limiter `CHAT_LIMITER` (12 per IP per minute); 20 s upstream timeout; rule limiting the assistant to campus directions. The app no longer sends the place list at all.
- **Redeploy the Worker whenever `places.json` changes**, or the assistant keeps describing the old places.

### How to deploy the Worker

`wrangler login` fails on the owner's Mac (localhost:8976 callback error). Use an API token instead:

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template. Copy the token (or use ⋯ → Roll on an existing one to get a new value).
2. In Terminal, from `worker/`: paste the line below **first**, then copy the token in the browser, then press Enter in Terminal (the order matters, because it reads the clipboard):

```
export CLOUDFLARE_API_TOKEN="$(pbpaste | tr -d '[:space:]')"; echo "length: ${#CLOUDFLARE_API_TOKEN}, starts with: ${CLOUDFLARE_API_TOKEN:0:4}..."
```

Length should be around 40 to 55 and must not start with `expo`. Then:

```
npx wrangler whoami
npx wrangler deploy
```

The token lasts only for that Terminal window.

## Done

1. Map visual upgrade: round SVG pins, "?" badge for unverified places, footpath network drawn, route start and end markers, map controls, scale bar, legend.
2. Satellite (Esri) default basemap, with an OpenStreetMap vector toggle (looks blank because OSM has almost nothing mapped on campus).
3. OpenStreetMap foot-routing fallback when traced paths don't cover a trip. Tested against the real service on 24 October: it returns routes for some trips (Engineering to Mess, AI building to Boys Hostel 1, main gate to bus stand) and nothing for the east side (cricket stadium), where the app falls back to a straight line.
4. Zoom-scaled pins and label collision handling.
5. Building outline tool (`tools/buildmaker.html`) and outline drawing in the map at zoom 16+ (`buildings.json` still empty).
6. Data validator (`npm run validate` in `app/`).
7. Worker hardened and deployed (see above).
11. Full-screen navigation like Google Maps (29 October 2026): `components/NavScreen.jsx`. Press Start (with My location) for a live view: the map follows the walker and turns so the way ahead is up (a rotated 150vmax square holding its own Leaflet map; labels counter-rotate via `--maprot`), the next turn and distance on a banner, time left and arrival clock at the bottom, spoken turns on by default ("In 40 metres, turn left onto ..."), automatic reroute after two GPS fixes more than 30 m off the route, arrival screen, screen kept awake. Progress is measured by projecting each fix onto the route (`lib/navProgress.js`), not by reaching turn points. Starting from a chosen place gives Preview route: the same screen stepped with ‹ ›. Tested with a scripted GPS walk, not yet on a real phone outdoors.
10. Step-by-step directions (29 October 2026): `lib/navigate.js` `buildSteps` turns a route into steps with the path name, turn, a landmark at the turn, places passed on either side, and which side the destination is on. Words for every language are in `lib/dirText.js` (English uses path names; other languages use turns and landmarks; translations need a native check). The place card has a "Start from" picker (any place or My location), a numbered step list (tap to zoom the map to that step), and a Step by step card with Back/Next that also moves on by itself with GPS. Routing (`lib/route.js`) now chooses the best of several nearby join points instead of the single nearest one.
8. Visual redesign (28 October 2026): a direction-board look shared by the landing page and the map app. Tokens in `app/src/index.css` (`:root`): signboard blue `--board`, signal yellow `--live`, night navy `--ink`; Barlow and Barlow Condensed, self-hosted through `@fontsource`. The landing hero is a live, non-interactive satellite map with the real pins; a "Where things are" board lists places with direction arrows and walking distances, and each row opens `#/map/<place-id>`. The Help and trip buttons now sit on the map, not over the panel.
9. 3D landing page (28 October 2026): the hero is a scroll-driven 3D flight over the campus (`app/src/lib/campus3d.js`, three.js, loaded only on the landing page). Satellite tiles are stitched into ground textures (zoom 17 over campus, zoom 14 around it), each place gets a rising beam and label, and arcs run from DSU Main Campus to every place. Scroll effects use GSAP ScrollTrigger in `Home.jsx` (`useScrollEffects`): word-by-word headings, split-flap distances, greeting marquee, counters, 3D feature cards, pipeline progress line, reading bar. Reduced motion gives one still 3D view; no WebGL falls back to a flat Leaflet map. The camera path is the `WIDE_SHOTS` / `TALL_SHOTS` lists in `campus3d.js`.

## Unverified

- Nothing visual has been seen by an assistant with browser access. Treat rendering as unverified until screenshots confirm it.
- Not tested on a real phone on campus.

## Next steps

1. Add Anthropic credits, then confirm the assistant answers on the live site.
2. Walk 3 or more routes on campus with Step by step open and fix any path that doesn't match the ground.
3. Desk session B: trace about 10 building outlines in `tools/buildmaker.html`.
4. Field session: confirm `ai-building`, `hostel-girls-2sharing` and `hostel-mess`; add library, admin/fees, canteen, medical and parking. Then validate and redeploy the Worker.

Other gaps: new UI strings are English only (map button tooltips, "Walking path", "via OpenStreetMap footpaths"); "avoid stairs" does not apply to OSM routes; no unit tests for routing; 14 minor lint warnings; portfolio polish (README screenshots, architecture diagram).
