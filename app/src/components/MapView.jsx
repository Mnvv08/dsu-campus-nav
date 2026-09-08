import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { colorFor } from '../lib/categories';

const placeIcon = color =>
  L.divIcon({
    className: '',
    html: `<span class="pin" style="--pin:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

const youIcon = L.divIcon({
  className: '',
  html: '<span class="you"><span class="you-pulse"></span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export default function MapView({ center, places, selected, onSelect, position, accuracy, routeLine }) {
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
      const mk = L.marker([p.lat, p.lng], { icon: placeIcon(colorFor(p.category)) })
        .addTo(m)
        .bindTooltip(p.name, { direction: 'top', offset: [0, -10] })
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
    if (!selected || !map.current) return;
    map.current.setView([selected.lat, selected.lng], 19, { animate: true });
    markers.current.get(selected.id)?.openTooltip();
  }, [selected]);

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

  return <div ref={holder} className="map" />;
}
