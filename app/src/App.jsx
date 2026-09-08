import { useState, useMemo, useCallback, useEffect } from 'react';
import MapView from './components/MapView';
import campus from './data/places.json';
import tasks from './data/tasks.json';
import pathData from './data/paths.json';
import { searchPlaces } from './lib/search';
import { buildGraph, route } from './lib/route';
import { CATEGORIES, colorFor, distance, walkTime, formatDistance } from './lib/categories';
import { LANGUAGES, t, categoryLabel, placeName, placeNotes, taskText, detectLanguage } from './lib/i18n';

const REPO = 'https://github.com/Mnvv08/dsu-campus-nav';

// Corrections go to GitHub Issues. No backend, no moderation queue, and
// every report is public and attributable — which is what keeps a
// crowdsourced dataset honest.
function reportUrl(place) {
  const body = [
    `**Place:** ${place.name}`,
    `**Currently marked:** ${place.lat}, ${place.lng}`,
    '',
    'What is wrong? (pin in the wrong spot, wrong name, closed, missing detail)',
    '',
    ''
  ].join('\n');
  return `${REPO}/issues/new?title=${encodeURIComponent('Correction: ' + place.name)}&body=${encodeURIComponent(body)}`;
}

// A QR code at a gate can say where it is: ?at=main-gate. That gives a
// newcomer an origin before GPS has locked on, which on arrival is
// exactly when the fix is slowest and the person is most lost.
function anchorFromUrl(places) {
  const id = new URLSearchParams(window.location.search).get('at');
  return id ? places.find(p => p.id === id) ?? null : null;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(null);
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const [tiles, setTiles] = useState(null);
  const [lang, setLang] = useState(detectLanguage);

  useEffect(() => {
    localStorage.setItem('dsu-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const places = campus.places ?? [];

  // The graph never changes at runtime, so build it once.
  const graph = useMemo(() => buildGraph(pathData.paths ?? []), []);
  const [anchor, setAnchor] = useState(() => anchorFromUrl(campus.places ?? []));

  // A live GPS fix always beats a scanned sign, but until one arrives the
  // anchor stands in for it.
  const origin = position ?? anchor;
  const [routing, setRouting] = useState(false);

  const present = useMemo(() => {
    const seen = new Set(places.map(p => p.category));
    return Object.keys(CATEGORIES).filter(c => seen.has(c));
  }, [places]);

  const search = useMemo(
    () => searchPlaces(query, places, tasks, lang),
    [query, places, lang]
  );

  const searching = query.trim().length > 0;

  const visible = useMemo(() => {
    if (searching) return search.results;
    return filter ? places.filter(p => p.category === filter) : places;
  }, [searching, search.results, places, filter]);

  const listed = useMemo(() => {
    if (!origin) return visible;
    return [...visible].sort((a, b) => distance(origin, a) - distance(origin, b));
  }, [visible, origin]);

  // Only offer prompts we can actually answer from the current dataset.
  const suggestions = useMemo(() => {
    const seen = new Set(places.map(p => p.category));
    return tasks.filter(t => seen.has(t.category)).slice(0, 4);
  }, [places]);

  const select = useCallback(p => setSelected(p), []);

  // Ask the service worker how much imagery is stored offline.
  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const onMsg = e => {
      if (typeof e.data?.tiles === 'number') setTiles(e.data.tiles);
    };
    sw.addEventListener('message', onMsg);
    sw.ready.then(reg => reg.active?.postMessage('tile-count')).catch(() => {});
    return () => sw.removeEventListener('message', onMsg);
  }, []);

  // Watch position rather than fetching once: someone using this is walking.
  useEffect(() => {
    if (!locating) return;

    if (!('geolocation' in navigator)) {
      setLocError(t('noGeo', lang));
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
            ? t('denied', lang)
            : t('weakSignal', lang)
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [locating]);

  const offCampus = position ? distance(position, campus.center) > 3000 : false;

  const walk = useMemo(() => {
    if (!routing || !origin || !selected) return null;
    const r = route(graph, origin, selected);
    if (r) return r;
    // No usable network here — fall back to a straight line, but say so.
    return {
      coords: [[origin.lat, origin.lng], [selected.lat, selected.lng]],
      metres: distance(origin, selected),
      direct: true
    };
  }, [routing, origin, selected, graph]);

  // Directions are about one destination; changing it should reset them.
  useEffect(() => { setRouting(false); }, [selected]);

  return (
    <div className="shell">
      <MapView
        center={campus.center}
        places={visible}
        selected={selected}
        onSelect={select}
        position={position}
        accuracy={accuracy}
        routeLine={walk?.coords}
      />

      <aside className="panel">
        <header>
          <h1>{t('title', lang)}</h1>
          <p>{campus.campus}</p>
          <div className="langs" role="group" aria-label="Language">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={lang === l.code ? 'lang on' : 'lang'}
                onClick={() => setLang(l.code)}
                lang={l.code}
              >
                {l.label}
              </button>
            ))}
          </div>
        </header>

        {anchor && !position && (
          <div className="anchor">
            <p>
              {t('youAreAt', lang)} <strong>{placeName(anchor, lang)}</strong>
            </p>
            <button onClick={() => setAnchor(null)}>{t('notHere', lang)}</button>
          </div>
        )}

        <div className="locate">
          <button
            className={locating ? 'ghost' : 'primary'}
            onClick={() => setLocating(!locating)}
          >
            {locating ? t('stopLocate', lang) : t('locate', lang)}
          </button>
          {locError && <p className="error">{locError}</p>}
          {tiles > 0 && (
            <p className="note">
              {tiles} map tiles saved on this device. The area you have already
              viewed will load without signal.
            </p>
          )}
          {offCampus && (
            <p className="note">{t('offCampus', lang)}</p>
          )}
        </div>

        <div className="searchbox">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchHint', lang)}
            aria-label="Search the campus"
          />
          {searching && (
            <button className="clear" onClick={() => setQuery('')} aria-label="Clear search">
              &times;
            </button>
          )}
        </div>

        {searching && search.task && (
          <p className="taskanswer">{taskText(search.task, 'answer', lang)}</p>
        )}

        {!searching && (
          <div className="prompts">
            {suggestions.map(tk => (
              <button key={tk.id} className="prompt" onClick={() => setQuery(taskText(tk, 'question', lang))}>
                {taskText(tk, 'question', lang)}
              </button>
            ))}
          </div>
        )}

        {!searching && present.length > 1 && (
          <div className="filters">
            <button
              className={filter === null ? 'chip on' : 'chip'}
              onClick={() => setFilter(null)}
            >
              {t('all', lang)}
            </button>
            {present.map(c => (
              <button
                key={c}
                className={filter === c ? 'chip on' : 'chip'}
                style={{ '--chip': CATEGORIES[c].color }}
                onClick={() => setFilter(filter === c ? null : c)}
              >
                {categoryLabel(c, lang)}
              </button>
            ))}
          </div>
        )}

        <div className="list">
          {listed.length === 0 ? (
            searching ? (
              <div className="empty">
                <p>{t('noMatch', lang)}</p>
                <p>{search.task ? t('taskNotMapped', lang) : t('noMatchHelp', lang)}</p>
              </div>
            ) : (
              <div className="empty">
                <p>No places recorded yet.</p>
                <p>
                  Open <code>tools/picker.html</code>, mark some buildings, then
                  replace <code>src/data/places.json</code> with the export.
                </p>
              </div>
            )
          ) : (
            listed.map(p => {
              const away = origin ? distance(origin, p) : null;
              return (
                <button
                  key={p.id}
                  className={selected?.id === p.id ? 'row on' : 'row'}
                  onClick={() => select(p)}
                >
                  <span className="swatch" style={{ background: colorFor(p.category) }} />
                  <span className="rowtext">
                    <strong>{placeName(p, lang)}</strong>
                    <em>
                      {categoryLabel(p.category, lang)}
                      {away !== null && ` · ${formatDistance(away)}`}
                      {p.confidence !== 'confirmed' && ` · ${t('unverified', lang)}`}
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
          <h2>{placeName(selected, lang)}</h2>
          <p className="meta">
            {categoryLabel(selected.category, lang)}
            {origin && ` · ${walkTime(distance(origin, selected), lang)}`}
          </p>
          {placeNotes(selected, lang) && <p className="notes">{placeNotes(selected, lang)}</p>}
          {selected.aliases?.length > 0 && (
            <p className="aliases">{t('alsoCalled', lang)} {selected.aliases.join(', ')}</p>
          )}
          {origin ? (
            <button
              className={routing ? 'ghost route' : 'primary route'}
              onClick={() => setRouting(!routing)}
            >
              {routing ? t('hideRoute', lang) : t('walkThere', lang)}
            </button>
          ) : (
            <p className="hintline">{t('needLocation', lang)}</p>
          )}

          {walk && (
            <p className="routeinfo">
              {formatDistance(walk.metres)} · {walkTime(walk.metres, lang)}
              {walk.direct && ` · ${t('straightLine', lang)}`}
              {!walk.direct && walk.offNetwork > 60 &&
                ` · roughly ${walk.offNetwork} m of this is off the traced paths`}
            </p>
          )}

          {selected.confidence !== 'confirmed' && (
            <p className="warn">{t('unverifiedWarn', lang)}</p>
          )}

          <a className="fix" href={reportUrl(selected)} target="_blank" rel="noreferrer">
            {t('report', lang)}
          </a>
        </div>
      )}
    </div>
  );
}
