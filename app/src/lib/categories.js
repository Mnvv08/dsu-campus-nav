import { t } from './i18n';
export const CATEGORIES = {
  gate:      { color: '#e8b04b' },
  admin:     { color: '#6db8ff' },
  academic:  { color: '#4ee39a' },
  library:   { color: '#8be0ff' },
  hostel:    { color: '#c98bff' },
  food:      { color: '#ff9a6b' },
  medical:   { color: '#ff7b7b' },
  sports:    { color: '#7de37d' },
  transport: { color: '#ffd166' },
  parking:   { color: '#a0aeb8' },
  utility:   { color: '#d0d0d0' },
  landmark:  { color: '#ff6fae' }
};

export const colorFor = c => CATEGORIES[c]?.color ?? '#d0d0d0';


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
export function walkTime(metres, lang = 'en') {
  const mins = Math.round((metres * 1.35) / 1.25 / 60);
  return mins < 1 ? t('underMinute', lang) : `${mins} ${t('minWalk', lang)}`;
}

export function formatDistance(metres) {
  return metres < 950
    ? `${Math.round(metres / 10) * 10} m`
    : `${(metres / 1000).toFixed(1)} km`;
}
