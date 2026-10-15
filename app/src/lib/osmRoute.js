import { distance } from './categories';

// Walking directions along real roads and footpaths from OpenStreetMap,
// used when the hand-traced campus network can't give a trustworthy route.
// Without this, a destination the traced paths don't reach was drawn as a
// straight line through buildings. The public FOSSGIS router is free and
// needs no key; it is fine for a small campus app, but it is a shared
// service, so requests are kept to one per destination (see App.jsx).
const ENDPOINT = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

// Turns the router's JSON into { coords: [[lat, lng], ...], metres }.
// Returns null for anything unusable, so callers can fall back.
export function parseFootRoute(data) {
  const r = data?.routes?.[0];
  if (data?.code !== 'Ok' || !r?.geometry?.coordinates?.length) return null;
  if (!Number.isFinite(r.distance)) return null;
  return {
    // GeoJSON is [lng, lat]; the rest of the app uses [lat, lng].
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    metres: r.distance
  };
}

export async function fetchFootRoute(from, to, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url =
      `${ENDPOINT}/${from.lng},${from.lat};${to.lng},${to.lat}` +
      '?overview=full&geometries=geojson';
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const parsed = parseFootRoute(await res.json());
    if (!parsed) return null;

    // A route several times longer than the straight line usually means
    // one end snapped to a faraway road. Better to say nothing than to
    // send someone on a long wrong detour.
    const straight = distance(from, to);
    if (parsed.metres > straight * 5 + 100) return null;
    return parsed;
  } catch {
    // Offline, blocked, or timed out: caller falls back.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
