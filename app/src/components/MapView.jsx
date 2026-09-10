import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES, colorFor, glyphFor, categoryLabel, distance } from '../lib/categories';

// Drops points sitting much further from the centroid than the rest of
// the set — a simple, robust way to stop one distant place (a bus stand
// in a neighbouring town, say) from dictating how zoomed-out the
// default view is for everything else. Uses the median rather than the
// mean specifically because a median doesn't get dragged by the very
// outlier it's being used to detect.
function excludeOutliers(places) {
  const lat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const lng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  const centroid = { lat, lng };

  const dists = places.map(p => distance(centroid, p)).sort((a, b) => a - b);
  const median = dists[Math.floor(dists.length / 2)];

  // A place beyond 4x the typical distance from centroid is treated as
  // an outlier. Falls back to the full set if that would strip out most
  // of the places, rather than risk hiding real campus buildings.
  const threshold = median * 4;
  const kept = places.filter(p => distance(centroid, p) <= threshold);
  return kept.length >= places.length / 2 ? kept : places;
}

// A drop-shaped pin with a category glyph inside, rather than a plain
// dot. A parent unfamiliar with the app can tell a hostel pin from a
// medical pin at a glance instead of needing to click every marker to
// find out what it is.
const placeIcon = (color, glyph, active) =>
  L.divIcon({
    className: '',
    html: `
      <span class="pin${active ? ' pin-active' : ''}" style="--pin:${color}">
        <svg viewBox="0 0 28 34" width="30" height="36">
          <path d="M14 0C6.3 0 0 6.3 0 14c0 9.8 12.2 18.8 13.2 19.5.5.4 1.1.4 1.6 0C15.8 32.8 28 23.8 28 14 28 6.3 21.7 0 14 0z"
                fill="var(--pin)" stroke="#101413" stroke-width="1.5"/>
          <circle cx="14" cy="13" r="9.5" fill="#101413" opacity=".92"/>
          <text x="14" y="17.5" font-size="12" text-anchor="middle">${glyph}</text>
        </svg>
      </span>`,
    iconSize: [30, 36],
    iconAnchor: [15, 34],
    tooltipAnchor: [0, -30]
  });

const youIcon = L.divIcon({
  className: '',
  html: '<span class="you"><span class="you-pulse"></span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export default function MapView({ center, places, selected, onSelect, position, accuracy, routeLine, lang = 'en' }) {
  const holder = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());
  const you = useRef(null);
  const halo = useRef(null);
  const line = useRef(null);

  // Set the map up once.
  useEffect(() => {
    // Capped lower than Esri's nominal max. This is a rural area, and
    // past a certain zoom Esri simply has no photography for parts of
    // it — not a slow load, an actual gap that renders as a "Map data
    // not yet available" placeholder tile. Capping the app's zoom keeps
    // users from ever scrolling into that gap rather than trying to
    // detect and explain it after the fact.
    const m = L.map(holder.current, { zoomControl: false, maxZoom: 18 })
      .setView([center.lat, center.lng], 16);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        maxNativeZoom: 18,
        attribution: 'Imagery &copy; Esri, Maxar'
      }
    ).addTo(m);

    L.control.zoom({ position: 'bottomright' }).addTo(m);

    // Permanent labels help a first-time visitor, but two pins close
    // together on screen produce overlapping, unreadable text. A single
    // fixed zoom cutoff doesn't actually solve this: campus places are
    // spread over 162 acres, so fitting them all in view often lands at
    // a zoom level well below any fixed threshold — hiding every label
    // on the very first screen someone sees, defeating the entire point
    // of permanent labels. Checking actual on-screen collisions instead
    // means an isolated pin stays labelled at any zoom, and only pins
    // that would genuinely overlap get hidden — and it keeps working
    // correctly as more places are added and the map's natural default
    // zoom keeps shifting, rather than needing the threshold re-tuned
    // by hand every time the dataset grows.
    const declutterLabels = () => {
      const tooltips = Array.from(
        holder.current?.querySelectorAll('.placelabel') ?? []
      );

      // A label already hidden by a previous run reports a zero-size
      // rect at (0,0) from getBoundingClientRect — and two zero-size
      // rects at the same origin register as "overlapping" each other,
      // which would hide more labels on every subsequent check until
      // everything collapses to hidden. Clearing every hide first
      // forces real layout before measuring, so each check starts from
      // accurate positions rather than compounding the last one's.
      tooltips.forEach(el => el.classList.remove('label-collision'));

      const rects = tooltips.map(el => el.getBoundingClientRect());
      const overlaps = new Set();

      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          const overlapping = !(
            a.right < b.left || a.left > b.right ||
            a.bottom < b.top || a.top > b.bottom
          );
          if (overlapping) { overlaps.add(i); overlaps.add(j); }
        }
      }

      tooltips.forEach((el, i) => el.classList.toggle('label-collision', overlaps.has(i)));
    };

    // Labels move with the map on every frame during a zoom, so their
    // final screen position — and thus whether they collide — is only
    // settled once the zoom/pan animation actually finishes.
    m.on('zoomend moveend', declutterLabels);

    map.current = m;

    return () => m.remove();
  }, [center.lat, center.lng]);

  // Redraw markers whenever the dataset changes.
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    markers.current.forEach(mk => m.removeLayer(mk));
    markers.current.clear();

    places.forEach(p => {
      const mk = L.marker([p.lat, p.lng], {
        icon: placeIcon(colorFor(p.category), glyphFor(p.category))
      })
        .addTo(m)
        // permanent: the name is always visible, not hidden behind a
        // hover a first-time visitor has no reason to try.
        .bindTooltip(p.name, {
          direction: 'top', offset: [0, -32],
          permanent: true, className: 'placelabel'
        })
        .on('click', () => onSelect(p))
        .on('keypress', e => {
          if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') onSelect(p);
        });

      // Leaflet marks every marker role="button" tabindex="0" — genuinely
      // keyboard-focusable — but never gives it an accessible name of its
      // own. The `alt` icon option only reaches Leaflet's default <img>
      // icon; this app's pins are L.divIcon (a plain <div> with inline
      // SVG), which `alt` silently does nothing for. The only way to
      // label a divIcon marker is setting aria-label on its real DOM
      // element directly, once Leaflet has actually created it.
      mk.getElement()?.setAttribute('aria-label', p.name);

      markers.current.set(p.id, mk);
    });

    // fitBounds throws on an empty set, and on a single point it zooms to
    // maximum, which loses all surrounding context.
    //
    // A single distant outlier — a town bus stand 3km away while every
    // real campus building sits within 750m of the centroid — otherwise
    // drags the default zoom out so far that the actual cluster of
    // buildings squeezes into a small area and their labels collide
    // with each other. That point is still fully on the map and fully
    // findable through search; it's just excluded from deciding where
    // the camera starts, since including it serves nobody's first look
    // at the campus.
    const framePlaces = places.length > 3 ? excludeOutliers(places) : places;

    if (framePlaces.length > 1) {
      m.fitBounds(framePlaces.map(p => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 17 });
    } else if (framePlaces.length === 1) {
      m.setView([framePlaces[0].lat, framePlaces[0].lng], 18);
    }
  }, [places, onSelect]);

  // Pan to whatever is selected.
  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((mk, id) => {
      const p = places.find(x => x.id === id);
      if (!p) return;
      mk.setIcon(placeIcon(colorFor(p.category), glyphFor(p.category), id === selected?.id));
    });
    if (!selected) return;
    map.current.setView([selected.lat, selected.lng], 19, { animate: true });
  }, [selected, places]);

  // Draw the walking route. Two overlaid polylines: a dark casing under a
  // bright core, so the line stays readable over satellite imagery.
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    if (line.current) { m.removeLayer(line.current); line.current = null; }
    if (!routeLine || routeLine.length < 2) return;

    line.current = L.layerGroup([
      L.polyline(routeLine, { color: '#06170f', weight: 9, opacity: .55 }),
      L.polyline(routeLine, { color: '#4ee39a', weight: 4, opacity: .95 })
    ]).addTo(m);

    m.fitBounds(routeLine, { padding: [70, 70], maxZoom: 18 });
  }, [routeLine]);

  // Track the user.
  useEffect(() => {
    const m = map.current;
    if (!m || !position) return;

    const ll = [position.lat, position.lng];

    if (!you.current) {
      halo.current = L.circle(ll, {
        radius: accuracy ?? 0,
        color: '#4ee39a',
        weight: 1,
        fillColor: '#4ee39a',
        fillOpacity: 0.1
      }).addTo(m);
      you.current = L.marker(ll, { icon: youIcon, zIndexOffset: 900 }).addTo(m);
      you.current.getElement()?.setAttribute('aria-label', 'Your current location');
    } else {
      you.current.setLatLng(ll);
      halo.current.setLatLng(ll).setRadius(accuracy ?? 0);
    }
  }, [position, accuracy]);

  const present = [...new Set(places.map(p => p.category))];

  return (
    <div className="mapwrap">
      <div ref={holder} className="map" />
      {present.length > 0 && (
        <details className="legend">
          <summary>Legend</summary>
          {present.map(c => (
            <div key={c} className="legenditem">
              <span className="legendswatch" style={{ background: colorFor(c) }} />
              {categoryLabel(c, lang)}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
