import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES, colorFor, glyphFor, categoryLabel } from '../lib/categories';

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
    const m = L.map(holder.current, { zoomControl: false, maxZoom: 20 })
      .setView([center.lat, center.lng], 16);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution: 'Imagery &copy; Esri, Maxar'
      }
    ).addTo(m);

    L.control.zoom({ position: 'bottomright' }).addTo(m);

    // Permanent labels help a first-time visitor, but at a zoomed-out
    // view with many pins close together they overlap into noise. Hide
    // them below a threshold rather than showing every name at once.
    const LABEL_ZOOM = 17;
    const syncLabelVisibility = () => {
      holder.current?.classList.toggle('labels-hidden', m.getZoom() < LABEL_ZOOM);
    };
    m.on('zoomend', syncLabelVisibility);
    syncLabelVisibility();

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
        .on('click', () => onSelect(p));
      markers.current.set(p.id, mk);
    });

    // fitBounds throws on an empty set, and on a single point it zooms to
    // maximum, which loses all surrounding context.
    if (places.length > 1) {
      m.fitBounds(places.map(p => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 18 });
    } else if (places.length === 1) {
      m.setView([places[0].lat, places[0].lng], 18);
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

    m.fitBounds(routeLine, { padding: [70, 70], maxZoom: 19 });
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
