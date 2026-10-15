import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { colorFor, iconFor, categoryLabel, distance, LABEL_PRIORITY } from '../lib/categories';
import { t } from '../lib/i18n';
import pathData from '../data/paths.json';
import { createVectorLayer } from '../lib/vectorBasemap';

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

// Two basemaps. "map" is a clean vector map (roads, building footprints,
// place names) and is the default, since it stays sharp at any zoom and
// reads like a professional navigation app. "satellite" is kept as an
// option for people who want to match what they see on the ground.
const BASEMAPS = {
  map: { type: 'vector', maxZoom: 20, light: true },
  satellite: {
    type: 'raster',
    url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Imagery &copy; Esri, Maxar',
    maxNativeZoom: 18,
    maxZoom: 18,
    light: false
  }
};

// Drops points sitting much further from the centroid than the rest of
// the set, so one distant place (a bus stand in a neighbouring town) does
// not dictate how zoomed-out the default view is. Uses the median, which
// is not dragged by the very outlier it is meant to detect.
function excludeOutliers(places) {
  const lat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const lng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  const centroid = { lat, lng };

  const dists = places.map(p => distance(centroid, p)).sort((a, b) => a - b);
  const median = dists[Math.floor(dists.length / 2)];

  const kept = places.filter(p => distance(centroid, p) <= median * 4);
  return kept.length >= places.length / 2 ? kept : places;
}

// A round badge with a consistent line icon, rather than an emoji. Emoji
// render differently on every phone and are often illegible at pin size.
// Places that are not confirmed get a dashed ring and a "?" so the map
// itself is honest about uncertainty, not only the detail sheet.
const placeIcon = (p, active) => {
  const unverified = p.confidence && p.confidence !== 'confirmed';
  return L.divIcon({
    className: '',
    html: `
      <span class="pin2${active ? ' pin2-active' : ''}${unverified ? ' pin2-unverified' : ''}"
            style="--pin:${colorFor(p.category)}">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff"
             stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${iconFor(p.category)}</svg>
        ${unverified ? '<i class="pin2-q">?</i>' : ''}
      </span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const youIcon = L.divIcon({
  className: '',
  html: '<span class="you"><span class="you-pulse"></span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const startIcon = L.divIcon({
  className: '',
  html: '<span class="routedot routedot-start"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const endIcon = L.divIcon({
  className: '',
  html: `<span class="routedot routedot-end">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="#06170f">
             <path d="M6 3v18h2v-7h9l-2-4 2-4H8V3z"/>
           </svg>
         </span>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// Pins shrink as the map zooms out, so neighbouring buildings (the
// hostels sit within a few metres of each other) stay separate dots
// instead of piling into one blob. Full size from zoom 18 up.
const pinScale = z => (z <= 14 ? 0.6 : z === 15 ? 0.68 : z === 16 ? 0.78 : z === 17 ? 0.9 : 1);

const overlaps = (a, b, pad = 0) =>
  !(a.right + pad < b.left || a.left - pad > b.right ||
    a.bottom + pad < b.top || a.top - pad > b.bottom);

// Where a label may sit relative to its pin, tried in this order.
const LABEL_DIRS = ['bottom', 'right', 'left', 'top'];

// Normalises both accepted path formats (bare array, or { points, steps }).
const normalisePath = raw => (Array.isArray(raw) ? { points: raw, steps: false } : raw);

export default function MapView({ center, places, selected, onSelect, position, accuracy, routeLine, lang = 'en' }) {
  const holder = useRef(null);
  const map = useRef(null);
  const base = useRef(null);
  const markers = useRef(new Map());
  const placeById = useRef(new Map());
  const you = useRef(null);
  const halo = useRef(null);
  const line = useRef(null);
  const network = useRef(null);
  const frameRef = useRef(() => {});

  const [basemap, setBasemap] = useState('satellite');
  const [showPaths, setShowPaths] = useState(true);

  // Set the map up once.
  useEffect(() => {
    // Capped below Esri's nominal max: this is a rural area, and past a
    // certain zoom Esri has no photography for parts of it. Capping the
    // zoom keeps users from scrolling into that gap.
    const m = L.map(holder.current, { zoomControl: false, maxZoom: 18, minZoom: 13 })
      .setView([center.lat, center.lng], 16);

    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 110 }).addTo(m);

    // Label placement. For each place, most important first (selected,
    // then gates/admin/academic), try the label below, right, left, then
    // above its pin, and keep the first spot that overlaps neither an
    // already-placed label nor another place's pin. If no spot is free the
    // label is hidden (the pin stays; zooming in reveals it). The selected
    // place's label is always shown.
    const declutterLabels = () => {
      const scale = pinScale(m.getZoom());
      m.getContainer().style.setProperty('--ps', String(scale));

      const box = m.getContainer().getBoundingClientRect();
      const r = 17 * scale + 2; // pin radius incl. ring

      const items = [];
      const pinRects = new Map();
      markers.current.forEach((mk, id) => {
        // Pin boxes come from map coordinates, not the DOM: a pin that is
        // mid-resize animation would otherwise be measured at the wrong size.
        const pt = m.latLngToContainerPoint(mk.getLatLng());
        const x = box.left + pt.x;
        const y = box.top + pt.y;
        pinRects.set(id, { left: x - r, right: x + r, top: y - r, bottom: y + r });

        const tt = mk.getTooltip();
        const el = tt?.getElement();
        if (el) items.push({ tt, el, id });
      });

      // Clear earlier hides first so every label is measured from real layout.
      items.forEach(({ el }) => el.classList.remove('label-collision'));

      const prio = id => {
        const p = placeById.current.get(id);
        if (!p) return 0;
        if (m._selectedId === id) return 100;
        return (LABEL_PRIORITY[p.category] ?? 3) + (p.confidence === 'confirmed' ? 0.5 : 0);
      };
      items.sort((a, b) => prio(b.id) - prio(a.id));

      const offsets = {
        bottom: [0, r + 3],
        right: [r + 5, 0],
        left: [-(r + 5), 0],
        top: [0, -(r + 3)]
      };

      const place = (tt, dir) => {
        tt.options.direction = dir;
        tt.options.offset = offsets[dir];
        tt.update();
      };

      const placed = [];
      items.forEach(({ tt, el, id }) => {
        for (const dir of LABEL_DIRS) {
          place(tt, dir);
          const lr = el.getBoundingClientRect();
          const hitsLabel = placed.some(o => overlaps(lr, o, 3));
          const hitsPin = [...pinRects].some(([pid, pr]) => pid !== id && overlaps(lr, pr));
          if (!hitsLabel && !hitsPin) {
            placed.push(lr);
            return;
          }
        }
        // No free spot.
        place(tt, 'bottom');
        if (m._selectedId === id) placed.push(el.getBoundingClientRect());
        else el.classList.add('label-collision');
      });
    };

    m.on('resize', declutterLabels);
    m.on('zoomend moveend', declutterLabels);
    m._declutter = declutterLabels;

    map.current = m;
    return () => m.remove();
  }, [center.lat, center.lng]);

  // Basemap switching. The vector renderer loads on demand, so this is
  // async; the cancelled flag stops a slow load from landing after the
  // person has already switched back.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const cfg = BASEMAPS[basemap];
    let cancelled = false;

    const install = layer => {
      if (cancelled) return;
      if (base.current) m.removeLayer(base.current);
      base.current = layer.addTo(m);
      base.current.bringToBack?.();
      m.setMaxZoom(cfg.maxZoom);
      m.getContainer().classList.toggle('map-light', cfg.light);
    };

    if (cfg.type === 'raster') {
      install(L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        maxNativeZoom: cfg.maxNativeZoom,
        attribution: cfg.attribution
      }));
    } else {
      createVectorLayer().then(install).catch(() => {
        // Offline or blocked: fall back to satellite rather than a blank map.
        if (!cancelled) setBasemap('satellite');
      });
    }

    return () => { cancelled = true; };
  }, [basemap, center.lat, center.lng]);

  // Draw the traced footpath network. Showing it explains why a route goes
  // where it does, and shows at a glance how much of campus is traced.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (network.current) { m.removeLayer(network.current); network.current = null; }
    if (!showPaths) return;

    const light = BASEMAPS[basemap].light;
    const layers = [];
    (pathData.paths ?? []).forEach(raw => {
      const { points, steps } = normalisePath(raw);
      if (!points || points.length < 2) return;
      // On a light map: blue dashes with a white halo. On satellite:
      // white dashes with a dark halo.
      layers.push(L.polyline(points, {
        color: light ? '#ffffff' : '#06170f',
        weight: 6, opacity: light ? .9 : .35, interactive: false
      }));
      layers.push(L.polyline(points, {
        color: steps ? '#e8890b' : (light ? '#1a73e8' : '#ffffff'),
        weight: 2.5,
        opacity: .95,
        dashArray: steps ? '2 6' : '6 6',
        lineCap: 'round',
        interactive: false
      }));
    });
    network.current = L.layerGroup(layers).addTo(m);
  }, [showPaths, basemap, center.lat, center.lng]);

  // Redraw markers whenever the dataset changes.
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    markers.current.forEach(mk => m.removeLayer(mk));
    markers.current.clear();
    placeById.current = new Map(places.map(p => [p.id, p]));

    places.forEach(p => {
      const mk = L.marker([p.lat, p.lng], {
        icon: placeIcon(p),
        riseOnHover: true,
        zIndexOffset: (LABEL_PRIORITY[p.category] ?? 3) * 10
      })
        .addTo(m)
        // Always-visible name, below the pin so it never covers the icon.
        .bindTooltip(p.name, {
          direction: 'bottom', offset: [0, 14],
          permanent: true, className: 'placelabel'
        })
        .on('click', () => onSelect(p))
        .on('keypress', e => {
          if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') onSelect(p);
        });

      // divIcon markers have no accessible name unless set on the element.
      mk.getElement()?.setAttribute('aria-label', p.name);

      markers.current.set(p.id, mk);
    });

    // A single distant outlier would otherwise zoom the default view out
    // so far that the real cluster of buildings squeezes together. It is
    // still on the map and searchable, just ignored when framing.
    const framePlaces = places.length > 3 ? excludeOutliers(places) : places;

    const frame = () => {
      if (framePlaces.length > 1) {
        m.fitBounds(framePlaces.map(p => [p.lat, p.lng]), { padding: [60, 60], maxZoom: 17 });
      } else if (framePlaces.length === 1) {
        m.setView([framePlaces[0].lat, framePlaces[0].lng], 18);
      }
    };
    frameRef.current = frame;
    frame();

    setTimeout(() => m._declutter?.(), 0);
  }, [places, onSelect]);

  // Highlight and pan to whatever is selected.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m._selectedId = selected?.id ?? null;

    markers.current.forEach((mk, id) => {
      const p = placeById.current.get(id);
      if (!p) return;
      mk.setIcon(placeIcon(p, id === selected?.id));
      mk.getElement()?.setAttribute('aria-label', p.name);
      mk.setZIndexOffset(id === selected?.id ? 1000 : (LABEL_PRIORITY[p.category] ?? 3) * 10);
    });

    if (selected) m.setView([selected.lat, selected.lng], 19, { animate: true });
    setTimeout(() => m._declutter?.(), 0);
  }, [selected, places]);

  // Draw the walking route: dark casing, bright core, a slow moving dash
  // to show direction, plus start and destination markers.
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    if (line.current) { m.removeLayer(line.current); line.current = null; }
    if (!routeLine || routeLine.length < 2) return;

    const first = routeLine[0];
    const last = routeLine[routeLine.length - 1];

    line.current = L.layerGroup([
      L.polyline(routeLine, { color: '#06170f', weight: 10, opacity: .6, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(routeLine, { color: '#4ee39a', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(routeLine, {
        color: '#ffffff', weight: 2, opacity: .85, dashArray: '1 14',
        lineCap: 'round', className: 'route-flow'
      }),
      L.marker(first, { icon: startIcon, interactive: false, zIndexOffset: 800 }),
      L.marker(last, { icon: endIcon, interactive: false, zIndexOffset: 850 })
    ]).addTo(m);

    m.fitBounds(routeLine, { padding: [80, 80], maxZoom: 18 });
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

  const recenter = useCallback(() => frameRef.current(), []);

  const present = useMemo(() => [...new Set(places.map(p => p.category))], [places]);
  const hasUnverified = places.some(p => p.confidence && p.confidence !== 'confirmed');
  const navigating = Boolean(routeLine && routeLine.length > 1);

  return (
    <div className="mapwrap">
      <div ref={holder} className="map" />

      <div className={`mapctl${navigating ? ' mapctl-nav' : ''}`}>
        <button
          type="button"
          className="mapctl-btn"
          aria-pressed={basemap === 'satellite'}
          aria-label={basemap === 'map' ? 'Switch to satellite view' : 'Switch to street map'}
          title={basemap === 'map' ? 'Satellite' : 'Map'}
          onClick={() => setBasemap(b => (b === 'map' ? 'satellite' : 'map'))}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" />
          </svg>
        </button>
        <button
          type="button"
          className="mapctl-btn"
          aria-pressed={showPaths}
          aria-label={showPaths ? 'Hide walking paths' : 'Show walking paths'}
          title="Walking paths"
          onClick={() => setShowPaths(v => !v)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" />
            <path d="M8 19h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h5" strokeDasharray="1 4" />
          </svg>
        </button>
        <button
          type="button"
          className="mapctl-btn"
          aria-label="Recenter on campus"
          title="Recenter"
          onClick={recenter}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>

      {present.length > 0 && (
        <details className="legend">
          <summary>Legend</summary>
          {present.map(c => (
            <div key={c} className="legenditem">
              <span className="legendbadge" style={{ background: colorFor(c) }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff"
                     strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                     aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconFor(c) }} />
              </span>
              {categoryLabel(c, lang)}
            </div>
          ))}
          {hasUnverified && (
            <div className="legenditem legendnote">
              <span className="legendbadge legendbadge-unv">?</span>
              {t('unverified', lang)}
            </div>
          )}
          {showPaths && (
            <div className="legenditem legendnote">
              <span className="legendline" />
              Walking path
            </div>
          )}
        </details>
      )}
    </div>
  );
}
