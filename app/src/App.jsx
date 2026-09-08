import { useState, useMemo, useCallback, useEffect } from 'react';
import MapView from './components/MapView';
import campus from './data/places.json';
import { CATEGORIES, colorFor, labelFor, distance, walkTime, formatDistance } from './lib/categories';

export default function App() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(null);
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);

  const places = campus.places ?? [];

  const present = useMemo(() => {
    const seen = new Set(places.map(p => p.category));
    return Object.keys(CATEGORIES).filter(c => seen.has(c));
  }, [places]);

  const visible = useMemo(
    () => (filter ? places.filter(p => p.category === filter) : places),
    [places, filter]
  );

  const listed = useMemo(() => {
    if (!position) return visible;
    return [...visible].sort((a, b) => distance(position, a) - distance(position, b));
  }, [visible, position]);

  const select = useCallback(p => setSelected(p), []);

  // Watch position rather than fetching once: someone using this is walking.
  useEffect(() => {
    if (!locating) return;

    if (!('geolocation' in navigator)) {
      setLocError('This browser cannot share your location.');
      setLocating(false);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setLocError(null);
      },
      err => {
        setLocError(
          err.code === 1
            ? 'Location permission was denied. Enable it in your browser settings to see where you are.'
            : 'Your location could not be found. Signal is weak in parts of the campus.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [locating]);

  const offCampus = position ? distance(position, campus.center) > 3000 : false;

  return (
    <div className="shell">
      <MapView
        center={campus.center}
        places={visible}
        selected={selected}
        onSelect={select}
        position={position}
        accuracy={accuracy}
      />

      <aside className="panel">
        <header>
          <h1>Find your way around DSU</h1>
          <p>{campus.campus}</p>
        </header>

        <div className="locate">
          <button
            className={locating ? 'ghost' : 'primary'}
            onClick={() => setLocating(!locating)}
          >
            {locating ? 'Stop tracking' : 'Show where I am'}
          </button>
          {locError && <p className="error">{locError}</p>}
          {offCampus && (
            <p className="note">
              You are outside the campus right now. Distances below are measured
              from where you are.
            </p>
          )}
        </div>

        {present.length > 1 && (
          <div className="filters">
            <button
              className={filter === null ? 'chip on' : 'chip'}
              onClick={() => setFilter(null)}
            >
              All
            </button>
            {present.map(c => (
              <button
                key={c}
                className={filter === c ? 'chip on' : 'chip'}
                style={{ '--chip': CATEGORIES[c].color }}
                onClick={() => setFilter(filter === c ? null : c)}
              >
                {CATEGORIES[c].label}
              </button>
            ))}
          </div>
        )}

        <div className="list">
          {listed.length === 0 ? (
            <div className="empty">
              <p>No places recorded yet.</p>
              <p>
                Open <code>tools/picker.html</code>, mark some buildings, then
                replace <code>src/data/places.json</code> with the export.
              </p>
            </div>
          ) : (
            listed.map(p => {
              const away = position ? distance(position, p) : null;
              return (
                <button
                  key={p.id}
                  className={selected?.id === p.id ? 'row on' : 'row'}
                  onClick={() => select(p)}
                >
                  <span className="swatch" style={{ background: colorFor(p.category) }} />
                  <span className="rowtext">
                    <strong>{p.name}</strong>
                    <em>
                      {labelFor(p.category)}
                      {away !== null && ` · ${formatDistance(away)}`}
                      {p.confidence !== 'confirmed' && ' · unverified'}
                    </em>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {selected && (
        <div className="sheet">
          <button className="close" onClick={() => setSelected(null)} aria-label="Close">
            &times;
          </button>
          <h2>{selected.name}</h2>
          <p className="meta">
            {labelFor(selected.category)}
            {position && ` · ${walkTime(distance(position, selected))}`}
          </p>
          {selected.notes && <p className="notes">{selected.notes}</p>}
          {selected.aliases?.length > 0 && (
            <p className="aliases">Also called {selected.aliases.join(', ')}</p>
          )}
          {selected.confidence !== 'confirmed' && (
            <p className="warn">
              This location has not been verified yet. Ask someone nearby if it
              does not look right.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
