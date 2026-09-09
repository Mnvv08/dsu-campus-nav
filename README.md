# DSU Campus Navigator

A wayfinding web app for the Dayananda Sagar University main campus at Devarakaggalahalli, Harohalli, Kanakapura Road, Bengaluru.

**Live app:** https://mnvv08.github.io/dsu-campus-nav/

---

## The problem

The campus covers roughly 162 acres and serves over 15,000 students. On Google Maps it is a single pin — no blocks, no hostels, no gates, no canteens. OpenStreetMap coverage of the interior is effectively empty too.

The distances make this a real problem rather than a cosmetic one. One canteen sits roughly 500 metres from the main academic building; another closer to 900 metres. A wrong guess between classes costs real time. For a first-time student, a visiting parent, or anyone at counselling day, there has been no way to answer "where do I go?" without finding a person to ask.

This project is that missing map, built from the ground up because no usable dataset of the campus existed anywhere to start from.

---

## What it does

- **Satellite map** of the campus with every mapped place shown as a category-coded pin, plus a legend
- **Task-aware search** — "where do I pay fees" resolves as well as "Block 2," because a newcomer knows their task, not the building names
- **Turn-by-turn walking directions** over a hand-traced footpath network, with live GPS tracking, spoken directions, and an option to avoid stairs
- **Floor-level detail** — departments and offices are recorded inside buildings, so a search for a department answers with a building *and* a floor
- **An AI assistant** that answers questions about the mapped campus only — in English, Kannada, Hindi, and effectively any language a person types or speaks into it, including romanised input
- **Voice input** for the assistant, and voice output during navigation
- **Works offline** once visited — map tiles and place data are cached, which matters in the parts of campus where signal drops
- **Saved places and shareable links** — star a place for one-tap access later, or share a direct link that opens the map centred on it
- **QR-ready arrival flow** — a link like `?at=main-gate` opens the map already oriented to wherever the reader is standing, built for printed signage at the gates
- **Installable as a home-screen app** — a prompt guides first-time visitors (most often arriving via a QR scan) to add it to their home screen for a full-screen, no-browser-chrome experience on their next visit
- **A persistent emergency button** with real national emergency numbers, the university's listed phone line, and one tap to the nearest hospital
- **Honest about uncertainty** — every place carries a confidence level, and anything not personally verified is shown to the user as unverified rather than presented as fact

---

## Why the data is the real project

None of this data existed. Three purpose-built tools in this repository create and maintain it, because the dataset — not the code — is what makes this useful.

Building positions come from two sources: real, verified coordinates pulled from Google's own location data where a listing exists, and careful satellite tracing where it doesn't. Names, floors, and departments come from signboards, timetables, and students who already know the place. Every entry is marked `confirmed`, `likely`, or `guess`, and the app never blurs that line for the user.

As it stands: **12 places mapped, 6 of them confirmed against real Google-verified coordinates**, connected by **10 traced walking paths**.

| Tool | Purpose |
|---|---|
| `tools/picker.html` | Click rooftops on satellite imagery to record places — names, translations, aliases, category, and the departments inside each building. |
| `tools/pathmaker.html` | Trace the walkway network by hand. Nearby points snap together into junctions. Stretches with stairs are tagged so routing can avoid them. |
| `tools/signage.html` | Generate printable A5 QR posters, one per place, that open the map oriented to that exact spot. |

Each tool exports JSON directly into `app/src/data/`.

---

## Architecture

```
dsu-campus-nav/
├── app/                  Vite + React app, deployed to GitHub Pages
│   ├── src/
│   │   ├── components/   Map, Chat, Navigate, EmergencyButton, InstallPrompt, Home
│   │   ├── lib/          search, routing, navigation instructions, i18n, saved places
│   │   └── data/         places.json, paths.json, tasks.json — the actual dataset
│   └── public/           manifest, icons, service worker, social preview image
├── worker/                Cloudflare Worker — holds the Anthropic API key server-side
├── tools/                  picker.html, pathmaker.html, signage.html
└── .github/workflows/      Automated build + deploy on every push to main
```

**No API keys ever touch the browser bundle.** The AI assistant calls a small Cloudflare Worker, which holds the actual Anthropic API key as a server-side secret. A static site cannot keep a secret — anything shipped to the client is readable in devtools — so the key lives in infrastructure the browser never sees.

Routing runs Dijkstra's algorithm over the traced path graph. Turn-by-turn instructions are generated by measuring compass bearing changes along the route and collapsing same-direction segments into single "head north" / "turn left" style steps — not by calling any external directions API, since none of them know this campus exists either.

---

## Stack

Vite, React, Leaflet with Esri satellite tiles. Claude Haiku via a Cloudflare Worker for the assistant. No API keys, no billing account, and no map-data licensing anywhere in the client — every dependency here is either free or something the project itself supplies.

---

## Running it locally

```bash
cd app
npm install
npm run dev
```

Open the printed URL, including the `/dsu-campus-nav/` path segment. Geolocation requires HTTPS or `localhost`, and service workers require HTTPS — so offline support and the install prompt can only be fully tested against the deployed site, not locally.

To enable the AI assistant locally, deploy `worker/` with Wrangler and set `VITE_CHAT_URL` in `app/.env` (see `worker/README.md`). For the deployed site, the same URL is stored as a `VITE_CHAT_URL` repository secret and injected at build time by the GitHub Actions workflow.

---

## Data shape

```json
{
  "id": "block-2",
  "name": "Block 2",
  "name_kn": "ಬ್ಲಾಕ್ 2",
  "name_hi": "ब्लॉक 2",
  "aliases": ["CS block"],
  "category": "academic",
  "confidence": "confirmed",
  "notes": "Fee payment and document submission for new students.",
  "lat": 12.660669,
  "lng": 77.450840,
  "units": [
    { "name": "Computer Science Department", "aliases": ["CSE"], "floor": 3 }
  ]
}
```

`confidence` is one of `confirmed`, `likely`, `guess`.
`category` is one of `academic`, `admin`, `gate`, `hostel`, `food`, `medical`, `sports`, `library`, `transport`, `parking`, `utility`, `landmark`.

Paths are `{ "points": [[lat, lng], ...], "steps": false }`. A bare array of points is also accepted and treated as step-free, so older exports keep working without modification.

---

## Contributing

Every place in the app has a "Something wrong here? Tell us" link that opens a pre-filled GitHub issue with the place's name and current coordinates attached. That's the whole correction pipeline — no login, no moderation queue. If a pin is wrong, a name is missing, or a building isn't mapped yet, file one.

What's most needed right now:

- The six remaining `guess`/`likely` places verified and corrected from the ground
- Departments and floor numbers added from real timetables
- Stairs tagged on the traced paths so step-free routing has more to work with
- Kannada and Hindi names filled in for buildings that don't have them yet

---

## License

MIT.
