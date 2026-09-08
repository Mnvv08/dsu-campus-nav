export const CATEGORIES = {
  gate:      { label: 'Gates',        color: '#e8b04b' },
  admin:     { label: 'Offices',      color: '#6db8ff' },
  academic:  { label: 'Academic',     color: '#4ee39a' },
  library:   { label: 'Library',      color: '#8be0ff' },
  hostel:    { label: 'Hostels',      color: '#c98bff' },
  food:      { label: 'Food',         color: '#ff9a6b' },
  medical:   { label: 'Medical',      color: '#ff7b7b' },
  sports:    { label: 'Sports',       color: '#7de37d' },
  transport: { label: 'Transport',    color: '#ffd166' },
  parking:   { label: 'Parking',      color: '#a0aeb8' },
  utility:   { label: 'Amenities',    color: '#d0d0d0' },
  landmark:  { label: 'Landmarks',    color: '#ff6fae' }
};

export const colorFor = c => CATEGORIES[c]?.color ?? '#d0d0d0';
export const labelFor = c => CATEGORIES[c]?.label ?? 'Other';

// Metres between two lat/lng pairs, via the haversine formula.
export function distance(a, b) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Campus paths are rarely straight, so pad the straight-line distance
// before converting to time. 1.35 is a common detour factor for
// pedestrian networks; 1.25 m/s is an unhurried walking pace.
export function walkTime(metres) {
  const mins = Math.round((metres * 1.35) / 1.25 / 60);
  return mins < 1 ? 'under a minute' : `${mins} min walk`;
}

export function formatDistance(metres) {
  return metres < 950
    ? `${Math.round(metres / 10) * 10} m`
    : `${(metres / 1000).toFixed(1)} km`;
}
