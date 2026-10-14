// Vector basemap (roads, building footprints, labels) drawn by MapLibre GL
// inside the existing Leaflet map, so every marker, route and control keeps
// working unchanged. Loaded on demand: the ~800 KB renderer is only fetched
// when the vector map is actually shown, not on every page load.
//
// Data: OpenFreeMap (free, no API key) built from OpenStreetMap.
export const VECTOR_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

export async function createVectorLayer(style = VECTOR_STYLE) {
  const [{ maplibreGL }] = await Promise.all([
    import('@maplibre/maplibre-gl-leaflet'),
    import('maplibre-gl/dist/maplibre-gl.css')
  ]);

  const layer = maplibreGL({
    style,
    attributionControl: { customAttribution: ATTRIBUTION }
  });

  // The default style draws its own shop/restaurant icons, which would
  // compete with this app's own pins and mislabel campus buildings. Hide
  // every point-of-interest layer; keep roads, buildings, water, parks and
  // place names.
  const hidePois = () => {
    try {
      const gl = layer.getMaplibreMap();
      const layers = gl.getStyle()?.layers ?? [];
      layers.forEach(l => {
        if (l['source-layer'] === 'poi' || /^poi/.test(l.id)) {
          gl.setLayoutProperty(l.id, 'visibility', 'none');
        }
      });
    } catch {
      // Cosmetic only; the map works fine with POIs showing.
    }
  };

  layer.on('add', () => {
    const gl = layer.getMaplibreMap();
    if (!gl) return;
    if (gl.isStyleLoaded()) hidePois();
    else gl.once('load', hidePois);
  });

  return layer;
}
