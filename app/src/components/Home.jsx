import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import InstallPrompt from './InstallPrompt';
import { t, categoryLabel } from '../lib/i18n';
import { distance, formatDistance, walkTime } from '../lib/categories';
import { buildGraph, route } from '../lib/route';
import { placeIcon } from '../lib/pinIcon';
import campus from '../data/places.json';
import pathData from '../data/paths.json';

const PLACES = campus.places ?? [];
const ORIGIN_ID = 'main-campus';
const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Places more than 1.5 km from the campus centre (the town bus stand) are
// left off the hero map so it frames the campus rather than the district.
const onCampus = p => distance(campus.center, p) < 1500;

// Compass bearing in degrees, 0 = north, for pointing the board arrows.
function bearing(from, to) {
  const k = Math.cos((from.lat * Math.PI) / 180);
  const deg = (Math.atan2((to.lng - from.lng) * k, to.lat - from.lat) * 180) / Math.PI;
  return (deg + 360) % 360;
}

// The real campus from above, with the real pins on it. Not interactive:
// it is a picture of the place, and the map behind "Open the map" is the
// thing to use. The pins arrive one after another, the page's only
// unprompted motion.
function HeroMap() {
  const el = useRef(null);

  useEffect(() => {
    const map = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      tap: false
    });
    L.tileLayer(IMAGERY, { maxNativeZoom: 18, maxZoom: 18, attribution: 'Imagery &copy; Esri, Maxar' }).addTo(map);
    map.attributionControl.setPrefix(false);

    const shown = PLACES.filter(onCampus);
    const wide = window.matchMedia('(min-width: 901px)').matches;
    map.fitBounds(shown.map(p => [p.lat, p.lng]), {
      // On wide screens the signboard covers the left half, so frame the
      // campus in the right half.
      paddingTopLeft: wide ? [Math.min(620, window.innerWidth * 0.48), 90] : [30, 40],
      paddingBottomRight: wide ? [70, 70] : [30, 30],
      maxZoom: 17
    });

    shown.forEach((p, i) => {
      const mk = L.marker([p.lat, p.lng], {
        icon: placeIcon(p, false, 'heropin'),
        interactive: false,
        keyboard: false
      }).addTo(map);
      const node = mk.getElement();
      if (node) node.style.setProperty('--delay', `${300 + i * 110}ms`);
    });

    return () => map.remove();
  }, []);

  return <div ref={el} className="heromap" aria-hidden="true" />;
}

function Arrow({ deg }) {
  return (
    <svg className="boardarrow" viewBox="0 0 24 24" aria-hidden="true"
         style={{ transform: `rotate(${Math.round(deg)}deg)` }}>
      <path d="M12 3 5 11h4.5v10h5V11H19z" />
    </svg>
  );
}

// A direction board, the way campus signs work: where it is, which way,
// how far. Distances follow the traced footpaths where they reach.
// Worked out once, since the data is bundled and never changes at runtime.
function boardRows() {
  const origin = PLACES.find(p => p.id === ORIGIN_ID);
  if (!origin) return [];
  const graph = buildGraph(pathData.paths ?? []);
  return PLACES
    .filter(p => p.id !== ORIGIN_ID)
    .map(p => {
      const r = route(graph, origin, p);
      const metres = r && r.offNetwork <= 120 ? r.metres : distance(origin, p);
      return { place: p, metres, deg: bearing(origin, p) };
    })
    .sort((a, b) => a.metres - b.metres);
}
const BOARD_ROWS = boardRows();

function DestinationBoard({ onOpenPlace }) {
  const rows = BOARD_ROWS;

  if (!rows.length) return null;

  return (
    <section id="board" className="band boardband" aria-labelledby="board-title">
      <div className="boardhead">
        <h2 id="board-title">Where things are</h2>
        <p>
          Walking distance from DSU Main Campus. Tap a place to open it on the map.
        </p>
      </div>
      <ul className="board">
        {rows.map(({ place: p, metres, deg }) => (
          <li key={p.id}>
            <button className="boardrow" onClick={() => onOpenPlace(p.id)}>
              <Arrow deg={deg} />
              <span className="boardname">
                <strong>{p.name}</strong>
                <span>
                  {categoryLabel(p.category, 'en')}
                  {p.confidence !== 'confirmed' && (
                    <em className="boardunv">location not yet confirmed</em>
                  )}
                </span>
              </span>
              <span className="boarddist">
                <strong>{formatDistance(metres)}</strong>
                <span>{walkTime(metres, 'en')}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home({ onEnter, onOpenPlace, placeCount, pathCount }) {
  const confirmedCount = PLACES.filter(p => p.confidence === 'confirmed').length;
  const totalPlaces = PLACES.length;
  const coveragePct = totalPlaces ? Math.round((confirmedCount / totalPlaces) * 100) : 0;

  useEffect(() => {
    document.title = 'DSU Campus Navigator';
  }, []);

  return (
    <div className="site">
      <InstallPrompt lang="en" />
      <nav className="sitenav">
        <span className="mark">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 20l8-4 8 4z" /></svg>
          DSU Campus Navigator
        </span>
        <div className="navlinks">
          <a href="#board">Places</a>
          <a href="#does">Features</a>
          <a href="#data">The data</a>
          <a href="https://github.com/Mnvv08/dsu-campus-nav" target="_blank" rel="noreferrer">
            Source
          </a>
        </div>
      </nav>

      <main>
        <header className="hero">
          <HeroMap />
          <div className="signboard">
            <h1>Nobody should get lost on their first day.</h1>
            <p className="signlede">
              Dayananda Sagar University at Harohalli covers 162 acres, and Google
              Maps shows it as a single pin. This map shows the gates, blocks,
              hostels and the walk between them.
            </p>
            <div className="actions">
              <button className="go" onClick={onEnter}>Open the map</button>
            </div>
            {placeCount > 0 && (
              <p className="counts">
                {placeCount} places mapped
                {pathCount > 0 && `, ${pathCount} walkways traced`}
              </p>
            )}
          </div>
        </header>

        <DestinationBoard onOpenPlace={onOpenPlace} />

        <section id="problem" className="band">
          <h2>Being big is the problem</h2>
          <div className="facts">
            <div className="fact big">
              <b>900 m</b>
              <p>
                between the furthest canteen and the main engineering and medical
                building. A wrong guess between classes costs you ten minutes.
              </p>
            </div>
            <div className="fact">
              <b>1</b>
              <p>pin for the entire campus on Google Maps. No blocks, no hostels, no gates.</p>
            </div>
            <div className="fact">
              <b>15,000+</b>
              <p>students, and every one of them was new here once.</p>
            </div>
          </div>
          <p className="aside">
            OpenStreetMap has almost nothing inside the campus either. There was no
            dataset to build on, so the first job was making one.
          </p>
        </section>

        <section id="does" className="paperband">
          <div className="paperinner">
            <h2>What it does</h2>
            <dl className="does">
              <div>
                <dt>Asks what you need, not where it is</dt>
                <dd>
                  Search understands "where do I pay fees" as well as "Block 2",
                  because a first-timer knows their task, not the building names.
                </dd>
              </div>
              <div>
                <dt>Walks you there</dt>
                <dd>
                  Directions follow traced footpaths rather than a straight line
                  through three buildings, and can avoid stairs.
                </dd>
              </div>
              <div>
                <dt>Goes to the floor</dt>
                <dd>
                  Departments and labs are recorded inside buildings, so a search
                  for a department answers with a block and a floor.
                </dd>
              </div>
              <div>
                <dt>Speaks your language</dt>
                <dd>
                  The app works in English, Kannada, Hindi, Tamil, Telugu, Malayalam
                  and Gujarati. The assistant replies in whatever language you write in.
                </dd>
              </div>
              <div>
                <dt>Works without signal</dt>
                <dd>
                  Map imagery is kept on your phone after the first visit, which
                  matters in the parts of campus where the network drops.
                </dd>
              </div>
              <div>
                <dt>Says when it isn't sure</dt>
                <dd>
                  Places nobody has confirmed yet are marked with a question mark.
                  A confident wrong answer is worse than an honest gap.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="data" className="band">
          <h2>Built from nothing</h2>
          <p className="lede">
            None of this data existed. It is made by hand with three small tools,
            and the dataset is the part that took the work.
          </p>
          <ol className="pipeline">
            {[
              {
                title: 'Place the buildings',
                body: 'Rooftops are clicked on satellite imagery to fix their position. Names, nicknames and departments come from signboards, timetables and students who already know the place.'
              },
              {
                title: 'Trace the walkways',
                body: 'Footpaths are drawn by hand and joined into one network. Stretches with steps are tagged so routes can avoid them.'
              },
              {
                title: 'Put it on the gates',
                body: 'Printable QR posters open the map already centred on the spot where the reader is standing, which is the moment people are most lost.'
              }
            ].map((step, i) => (
              <li key={step.title}>
                <span className="stepnum">{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="band closing">
          <div className="closegrid">
            <div>
              <h2>{t('coverageTitle', 'en')}</h2>
              <div className="coveragebar" role="img"
                   aria-label={`${coveragePct}% of places confirmed`}>
                <div className="coveragefill" style={{ width: `${coveragePct}%` }} />
              </div>
              <p className="lede">{t('coverageConfirmed', 'en')(confirmedCount, totalPlaces)}</p>
              <p className="aside">{t('coverageHelp', 'en')}</p>
            </div>
            <div>
              <h2>Something wrong? Say so.</h2>
              <p className="lede">
                Every place in the app has a link that reports a correction with its
                name and position attached. That is how a guess becomes a confirmed
                location, and how the map stays right after I graduate.
              </p>
              <div className="actions">
                <button className="go" onClick={onEnter}>Open the map</button>
                <a
                  className="alt"
                  href="https://github.com/Mnvv08/dsu-campus-nav/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  Report a problem
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="sitefoot">
        <p>
          An independent student project mapping the DSU campus at Devarakaggalahalli,
          Harohalli, Kanakapura Road, Bengaluru. Not an official university service.
        </p>
        <p>Satellite imagery by Esri and Maxar. Source available on GitHub under MIT.</p>
      </footer>
    </div>
  );
}
