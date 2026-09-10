const KEY = 'dsu-named-trips';

// A saved trip stores place IDs, not full place objects — the dataset
// is the single source of truth, so if a place's name or position gets
// corrected later, a saved trip picks up that correction automatically
// instead of holding a stale copy from whenever it was saved.
export function getSavedTrips() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(trips) {
  try {
    localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    // Private browsing or full storage — the save silently no-ops
    // rather than throwing and breaking the trip planner around it.
  }
}

export function saveTrip(name, placeIds) {
  const trips = getSavedTrips();
  const trip = { id: `trip-${Date.now()}`, name: name.trim() || 'Untitled trip', placeIds };
  const next = [...trips, trip];
  persist(next);
  return next;
}

export function deleteTrip(id) {
  const next = getSavedTrips().filter(t => t.id !== id);
  persist(next);
  return next;
}

// Turns a saved trip's place IDs back into real place objects, using
// whatever is in the current dataset. A place removed since the trip
// was saved just quietly drops out rather than crashing the reload —
// `missing` reports how many were dropped so the UI can say so.
export function resolveTrip(trip, places) {
  const byId = new Map(places.map(p => [p.id, p]));
  const resolved = trip.placeIds.map(id => byId.get(id)).filter(Boolean);
  return { stops: resolved, missing: trip.placeIds.length - resolved.length };
}
