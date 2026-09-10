import { useEffect } from 'react';
import InstallPrompt from './InstallPrompt';
import Changelog from './Changelog';
import { t } from '../lib/i18n';
import campus from '../data/places.json';

// The plan view is the most characteristic image in this subject's world:
// blocks, a lake, a path, and a pin on the one you want. Drawn rather
// than photographed so it stays legible at any size and costs nothing to
// load on a weak connection.
function PlanView() {
  return (
    <svg className="plan" viewBox="0 0 520 380" role="img"
         aria-label="Schematic plan of a campus with buildings, a lake, and a walking route">
      <defs>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="none" />
          <circle cx="1" cy="1" r=".5" fill="#3a3128" opacity=".5" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="520" height="380" fill="#1a1712" rx="4" />
      <rect x="0" y="0" width="520" height="380" fill="url(#grain)" rx="4" />

      {/* open ground */}
      <path d="M40 300 Q180 250 300 290 T500 260 L500 380 L20 380 Z" fill="#2b2419" />

      {/* lake */}
      <ellipse cx="420" cy="110" rx="62" ry="40" fill="#1e2c30" />
      <ellipse cx="420" cy="110" rx="62" ry="40" fill="none" stroke="#2f4048" strokeWidth="1" />

      {/* buildings */}
      <g fill="#4a3b2c" stroke="#6b5238" strokeWidth="1">
        <rect x="52" y="60" width="96" height="52" />
        <rect x="52" y="128" width="60" height="80" />
        <rect x="126" y="128" width="52" height="46" />
        <rect x="196" y="48" width="74" height="96" />
        <rect x="196" y="164" width="110" height="40" />
        <rect x="292" y="48" width="58" height="58" />
        <rect x="76" y="238" width="82" height="38" />
        <rect x="330" y="196" width="86" height="44" />
      </g>

      {/* traced walkway */}
      <path
        d="M96 292 L96 220 L160 220 L160 176 L232 176 L232 150 L318 150 L318 106 L372 106"
        fill="none" stroke="#4ee39a" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round" opacity=".9"
      />

      {/* start */}
      <circle cx="96" cy="292" r="6" fill="#101413" stroke="#4ee39a" strokeWidth="2.5" />

      {/* destination */}
      <g transform="translate(372 106)">
        <circle r="11" fill="#4ee39a" opacity=".18" />
        <circle r="5.5" fill="#4ee39a" stroke="#101413" strokeWidth="2" />
      </g>

      {/* other places */}
      <g fill="#d99a52" stroke="#1a1712" strokeWidth="1.5">
        <circle cx="100" cy="86" r="4.5" />
        <circle cx="233" cy="96" r="4.5" />
        <circle cx="321" cy="77" r="4.5" />
        <circle cx="117" cy="257" r="4.5" />
        <circle cx="373" cy="218" r="4.5" />
      </g>
    </svg>
  );
}

export default function Home({ onEnter, placeCount, pathCount }) {
  const confirmedCount = (campus.places ?? []).filter(p => p.confidence === 'confirmed').length;
  const totalPlaces = (campus.places ?? []).length;
  const coveragePct = totalPlaces ? Math.round((confirmedCount / totalPlaces) * 100) : 0;
  useEffect(() => {
    document.title = 'DSU Campus Navigator';
  }, []);

  return (
    <div className="site">
      <InstallPrompt lang="en" />
      <nav className="sitenav">
        <span className="mark">DSU Campus Navigator</span>
        <div className="navlinks">
          <a href="#problem">Why</a>
          <a href="#does">Features</a>
          <a href="#data">The data</a>
          <a href="https://github.com/Mnvv08/dsu-campus-nav" target="_blank" rel="noreferrer">
            Source
          </a>
        </div>
      </nav>

      <main>
      <header className="hero">
        <div className="herotext">
          <h1>Nobody should get lost on their first day.</h1>
          <p className="lede">
            The Dayananda Sagar University campus at Harohalli spans about 162 acres.
            On Google Maps it is a single pin. This is the map that was missing.
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
        <PlanView />
      </header>

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
            <p>marker for the entire campus on Google Maps. No blocks, no hostels, no gates.</p>
          </div>
          <div className="fact">
            <b>15,000+</b>
            <p>students, and every one of them was new here once.</p>
          </div>
        </div>
        <p className="aside">
          OpenStreetMap coverage of the interior is effectively empty too. There
          was no dataset to build on, so the first job was making one.
        </p>
      </section>

      <section id="does" className="band">
        <h2>What it does</h2>
        <dl className="does">
          <div>
            <dt>Asks what you need, not where it is</dt>
            <dd>
              Search understands "where do I pay fees" as well as "Block 2", because
              a first-timer knows their task and not the building names.
            </dd>
          </div>
          <div>
            <dt>Walks you there</dt>
            <dd>
              Directions follow real traced footpaths rather than a straight line
              through three buildings, and can be told to avoid stairs.
            </dd>
          </div>
          <div>
            <dt>Goes to the floor</dt>
            <dd>
              Departments and labs are recorded inside buildings, so a search for a
              department answers with a block and a floor.
            </dd>
          </div>
          <div>
            <dt>Answers in your language</dt>
            <dd>
              The interface is in English, Kannada and Hindi. The assistant replies in
              whatever language you write in, including romanised typing.
            </dd>
          </div>
          <div>
            <dt>Keeps working without signal</dt>
            <dd>
              Map imagery is cached after your first visit, which matters in the parts
              of the campus where the network drops.
            </dd>
          </div>
          <div>
            <dt>Admits what it does not know</dt>
            <dd>
              Unverified locations are labelled as unverified. A confident wrong
              answer is worse than an honest gap.
            </dd>
          </div>
        </dl>
      </section>

      <section id="data" className="band">
        <h2>Built from nothing</h2>
        <p className="lede narrow">
          None of this data existed. Three tools in this repository produce and
          maintain it, and the dataset is the part that took the work.
        </p>
        <ol className="pipeline">
          {[
            {
              title: 'Trace the buildings',
              body: 'Rooftops are clicked from satellite imagery to fix their coordinates. Names, aliases and departments come from signboards, timetables and students who already know the place.'
            },
            {
              title: 'Trace the walkways',
              body: 'Footpaths are drawn by hand and snapped into a connected network. Stretches with steps are tagged so routing can avoid them.'
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
        <h2>Something wrong? Say so.</h2>
        <p className="lede narrow">
          Every place in the app has a link that files a correction with its name
          and current coordinates attached. That is how a guess becomes a
          confirmed location, and how this stays accurate after I graduate.
        </p>
        <div className="actions">
          <button className="go" onClick={onEnter}>Open the map</button>
          <a
            className="alt link"
            href="https://github.com/Mnvv08/dsu-campus-nav/issues"
            target="_blank"
            rel="noreferrer"
          >
            Report something
          </a>
        </div>
      </section>

      <section className="band">
        <h2>{t('coverageTitle', 'en')}</h2>
        <div className="coveragebar">
          <div className="coveragefill" style={{ width: `${coveragePct}%` }} />
        </div>
        <p className="lede narrow">
          {t('coverageConfirmed', 'en')(confirmedCount, totalPlaces)}
        </p>
        <p className="aside">{t('coverageHelp', 'en')}</p>
      </section>

      <Changelog lang="en" />

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
