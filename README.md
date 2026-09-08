# DSU Campus Navigator

A wayfinding web app for the Dayananda Sagar University main campus at Devarakaggalahalli, Harohalli, Kanakapura Road, Bengaluru.

**Live:** https://mnvv08.github.io/dsu-campus-nav/

## Why this exists

The campus covers roughly 162 acres and serves over 15,000 students. On Google Maps it is a single pin. There are no markers for individual blocks, hostels, canteens, labs, offices, or gates, and OpenStreetMap coverage of the interior is effectively empty.

The distances are the real problem. One canteen sits around 500 metres from the main engineering and medical building and another roughly 900 metres away, so choosing wrong between classes costs ten minutes. For anyone arriving for the first time — a new student, a parent, a candidate at counselling, a visitor for an event — there is no way to answer "where do I go?" without finding a person to ask.

## What it does

- Satellite map of the campus with every recorded place, coloured by category
- Live location that follows you as you walk, with GPS accuracy shown honestly
- Search that understands tasks, not just names: "where do I pay fees" works as well as "Block 2"
- Walking directions over a hand-traced path network, with an option to avoid stairs
- Departments and labs down to the floor, so "CSE" answers with a building and a floor
- English, ಕನ್ನಡ and हिंदी throughout
- Works offline once visited, which matters where campus signal is weak
- QR posters for gates that open the map already oriented to where the reader is standing

## The dataset is the project

None of this data existed anywhere, so the repository is built around producing and maintaining it rather than around the app code.

Building positions are traced from satellite imagery. Names, floors and departments come from signboards, timetables, the university website, campus tour videos, and students who already know the place. Every entry carries a `confidence` field, and anything not `confirmed` is shown to users as unverified rather than presented as fact.

That last point is deliberate throughout. A wayfinding app that confidently sends a lost fresher to the wrong building is worse than one that admits what it does not know. The same principle governs routing: straight-line fallbacks say they are straight lines, and a route that uses stairs when a step-free one was requested says so.

## Tools

Three standalone HTML pages, no build step. Open them directly in a browser.

| Tool | Purpose |
|---|---|
| `tools/picker.html` | Click rooftops on satellite imagery to record places, names, aliases, translations, and the departments inside each building. |
| `tools/pathmaker.html` | Trace the walkway network. Vertices within 12 m snap together to form junctions. Stretches with steps are tagged and drawn dashed. |
| `tools/signage.html` | Generate printable A5 QR posters, one per gate, that open the map anchored to that spot. |

Each exports JSON that belongs in `app/src/data/`.

## Data shape

```json
{
  "id": "block-2",
  "name": "Block 2",
  "name_kn": "ಬ್ಲಾಕ್ 2",
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

`confidence` is `confirmed`, `likely`, or `guess`.

`category` is one of `academic`, `admin`, `gate`, `hostel`, `food`, `medical`, `sports`, `library`, `transport`, `parking`, `utility`, `landmark`.

Paths are `{ "points": [[lat, lng], ...], "steps": false }`. A bare array of points is also accepted and read as step-free.

## Running it

```bash
cd app
npm install
npm run dev
```

Then open the printed URL including the `/dsu-campus-nav/` path.

Geolocation only works over HTTPS or localhost, and service workers only over HTTPS, so offline support has to be tested against the deployed site rather than locally.

## Stack

Vite, React and Leaflet, deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml`. Satellite imagery from Esri. Routing is Dijkstra over the traced network — a linear scan for the next node, since the campus graph is small enough that a heap would be more code for no measurable gain.

No API keys and no billing account anywhere. All the map data is supplied by the project itself.

## Contributing

Every place in the app has a link that opens a prefilled GitHub issue with its name and current coordinates. If a pin is in the wrong spot, a name is wrong, or something is missing, file one. Corrections are how `guess` entries become `confirmed` ones.

Additions most needed right now: Kannada and Hindi names for buildings, departments and floors from real timetables, and stairs tagged on traced paths.

## Licence

MIT.
