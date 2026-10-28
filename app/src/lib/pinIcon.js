import L from 'leaflet';
import { colorFor, iconFor } from './categories';

// A round badge with a consistent line icon, rather than an emoji. Emoji
// render differently on every phone and are often illegible at pin size.
// Places that are not confirmed get a dashed ring and a "?" so the map
// itself is honest about uncertainty, not only the detail sheet.
// Shared by the map and the landing page hero, so both show the same pins.
export const placeIcon = (p, active = false, extraClass = '') => {
  const unverified = p.confidence && p.confidence !== 'confirmed';
  return L.divIcon({
    className: extraClass,
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
