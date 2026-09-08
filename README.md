# DSU Campus Navigator

A wayfinding web app for the Dayananda Sagar University main campus at Devarakaggalahalli, Harohalli, Kanakapura Road, Bengaluru.

## The problem

The campus covers roughly 162 acres and serves over 15,000 students. On Google Maps it is a single pin. There are no markers for individual blocks, hostels, canteens, labs, offices, or gates, and OpenStreetMap coverage of the interior is effectively empty.

For anyone arriving for the first time — a new student, a parent, a candidate at an admission counselling session, a visitor for an event — there is no way to answer "where do I go?" without asking a person.

This project builds that missing map.

## Approach

The code is the easy part. The dataset does not exist anywhere and has to be created, so the project is organised around producing it.

Building outlines are traced from satellite imagery. Names and purposes are sourced separately from the university website, prospectus material, campus tour videos, Google Maps photos, and confirmation from students already on campus. Every place carries a `confidence` field so unverified entries stay visible as unverified.

## Roadmap

| Step | Scope | Status |
|---|---|---|
| 1 | Data collection tool + repo setup | In progress |
| 2 | Build the campus dataset | Not started |
| 3 | Map app shell with live location | Not started |
| 4 | Search, including "what happens here" queries | Not started |
| 5 | Walking directions between points | Not started |
| 6 | First-timer guided flows | Not started |
| 7 | Deploy and open to student contributions | Not started |

## Step 1 — the mapper

`tools/picker.html` is a standalone page with no build step. Open it directly in a browser.

1. Zoom to a building on the satellite view.
2. Click its rooftop to drop a point.
3. Fill in the name, what it is also called, category, and what happens there.
4. Save, and repeat.
5. Export to `places.json` and commit it to `data/`.

Existing files can be loaded back in to keep working, and saved markers can be dragged to correct their position.

Aliases matter more than they look. Students search for what they say out loud — "B block", "the AI building", "boys mess" — not the official name on the signboard. Every alias recorded is a search that will succeed later.

## Data shape

```json
{
  "id": "engineering-block",
  "name": "Engineering Block",
  "aliases": ["Main block", "Admissions building"],
  "category": "academic",
  "confidence": "confirmed",
  "notes": "Fee payment, ID cards, and document submission for new students.",
  "lat": 12.660669,
  "lng": 77.450840
}
```

`confidence` is one of `confirmed`, `likely`, or `guess`.

`category` is one of `academic`, `admin`, `gate`, `hostel`, `food`, `medical`, `sports`, `library`, `transport`, `parking`, `utility`, `landmark`.

## Stack

Vite, React, Leaflet, and Tailwind, deployed on GitHub Pages. Leaflet with Esri satellite tiles needs no API key and no billing account, which matters for a project whose map data is supplied entirely by the project itself.

## Licence

MIT.
