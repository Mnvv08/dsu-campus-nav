import { t, categoryLabel } from './i18n';
export { categoryLabel };
// Each category gets a color and a short glyph. The glyph is what makes
// a marker readable at a glance on satellite imagery — a plain colored
// dot looks identical to a dozen other dots until you click it, which is
// no help to someone standing outside not knowing which pin is theirs.
export const CATEGORIES = {
  gate:      { color: '#e8b04b', glyph: '⛩' },
  admin:     { color: '#6db8ff', glyph: '🏛' },
  academic:  { color: '#4ee39a', glyph: '🎓' },
  library:   { color: '#8be0ff', glyph: '📖' },
  hostel:    { color: '#c98bff', glyph: '🛏' },
  food:      { color: '#ff9a6b', glyph: '🍴' },
  medical:   { color: '#ff7b7b', glyph: '✚' },
  sports:    { color: '#7de37d', glyph: '⚽' },
  transport: { color: '#ffd166', glyph: '🚌' },
  parking:   { color: '#a0aeb8', glyph: '🅿' },
  utility:   { color: '#d0d0d0', glyph: '⚡' },
  landmark:  { color: '#ff6fae', glyph: '★' }
};


// Consistent line icons (24x24, stroke-based) so every category looks the
// same on every phone. Emoji glyphs render differently per OS and are
// often illegible at pin size.
export const ICONS = {
  gate:      '<path d="M4 21V9a8 8 0 0 1 16 0v12"/><path d="M4 21h16"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/>',
  admin:     '<path d="M3 21h18"/><path d="M5 21V10"/><path d="M19 21V10"/><path d="M9 21V10"/><path d="M15 21V10"/><path d="M2 10l10-6 10 6z"/>',
  academic:  '<path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
  library:   '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
  hostel:    '<path d="M3 18V7"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
  food:      '<path d="M7 3v8"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M7 11v10"/><path d="M17 21V3c-2.5 1.5-3.5 4-3.5 7.5H17"/>',
  medical:   '<path d="M12 5v14"/><path d="M5 12h14"/>',
  sports:    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3 12h18"/>',
  transport: '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><circle cx="8" cy="20" r="1"/><circle cx="16" cy="20" r="1"/><path d="M8 17v2"/><path d="M16 17v2"/>',
  parking:   '<path d="M9 18V6h4.5a3.5 3.5 0 0 1 0 7H9"/>',
  utility:   '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  landmark:  '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'
};

export const iconFor = c => ICONS[c] ?? '<circle cx="12" cy="12" r="4"/>';

// Higher number wins when two labels would overlap on screen.
export const LABEL_PRIORITY = {
  gate: 9, admin: 8, academic: 7, library: 7, medical: 7, food: 6,
  hostel: 5, transport: 5, sports: 4, landmark: 4, parking: 2, utility: 1
};

export const glyphFor = c => CATEGORIES[c]?.glyph ?? '📍';

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
