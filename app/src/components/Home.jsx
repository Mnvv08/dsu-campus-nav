import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InstallPrompt from './InstallPrompt';
import { t, categoryLabel } from '../lib/i18n';
import { distance, formatDistance, walkTime, colorFor } from '../lib/categories';
import { buildGraph, route } from '../lib/route';
import { placeIcon } from '../lib/pinIcon';
import campus from '../data/places.json';
import pathData from '../data/paths.json';

gsap.registerPlugin(ScrollTrigger);

const PLACES = campus.places ?? [];
const ORIGIN_ID = 'main-campus';
const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => window.matchMedia('(max-width: 900px)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

// Places more than 1.5 km from the campus centre (the town bus stand) are
// left off the hero so it frames the campus rather than the district.
const onCampus = p => distance(campus.center, p) < 1500;

// Compass bearing in degrees, 0 = north, for pointing the board arrows.
function bearing(from, to) {
  const k = Math.cos((from.lat * Math.PI) / 180);
  const deg = (Math.atan2((to.lng - from.lng) * k, to.lat - from.lat) * 180) / Math.PI;
  return (deg + 360) % 360;
}

// Flat satellite map with pins. Shown instead of the 3D campus when the
// browser has no WebGL.
function FlatMap() {
  const el = useRef(null);
  useEffect(() => {
    const map = L.map(el.current, {
      zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, touchZoom: false, tap: false
    });
    L.tileLayer(IMAGERY, { maxNativeZoom: 18, maxZoom: 18, attribution: 'Imagery &copy; Esri, Maxar' }).addTo(map);
    map.attributionControl.setPrefix(false);
    const shown = PLACES.filter(onCampus);
    map.fitBounds(shown.map(p => [p.lat, p.lng]), { padding: [60, 60], maxZoom: 17 });
    shown.forEach(p => L.marker([p.lat, p.lng], { icon: placeIcon(p), interactive: false, keyboard: false }).addTo(map));
    return () => map.remove();
  }, []);
  return <div ref={el} className="flatmap" aria-hidden="true" />;
}

// The 3D campus. three.js is fetched only when the landing page opens, so
// the map app never downloads it.
function Campus3D({ storyRef, siteRef }) {
  const glRef = useRef(null);
  const labelRef = useRef(null);
  const [failed, setFailed] = useState(() => !webglAvailable());

  useEffect(() => {
    if (failed) return;
    let scene = null;
    let cancelled = false;
    let trigger = null;
    const onMove = e => {
      const r = glRef.current?.getBoundingClientRect();
      if (!r || !scene) return;
      scene.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };

    import('../lib/campus3d.js').then(({ createCampus3D }) => {
      if (cancelled || !glRef.current) return;
      try {
        scene = createCampus3D({
          container: glRef.current,
          labelLayer: labelRef.current,
          places: PLACES,
          center: campus.center,
          originId: ORIGIN_ID,
          colorFor,
          lite: narrow(),
          still: reducedMotion()
        });
      } catch {
        setFailed(true);
        return;
      }
      trigger = ScrollTrigger.create({
        trigger: storyRef.current,
        scroller: siteRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: self => scene.setProgress(self.progress),
        onToggle: self => scene.setActive(self.isActive)
      });
      scene.setProgress(trigger.progress);
      window.addEventListener('pointermove', onMove);
    }).catch(() => setFailed(true));

    return () => {
      cancelled = true;
      trigger?.kill();
      window.removeEventListener('pointermove', onMove);
      scene?.dispose();
    };
  }, [failed, storyRef, siteRef]);

  if (failed) return <FlatMap />;
  return (
    <>
      <div ref={glRef} className="gl" aria-hidden="true" />
      <div ref={labelRef} className="gllabels" aria-hidden="true" />
      <p className="glcredit">Imagery &copy; Esri, Maxar</p>
    </>
  );
}

// Words in their own spans, so headings can rise in word by word.
function Words({ text }) {
  // The space sits between the word boxes, not inside them, or it would
  // collapse and run the words together.
  return text.split(' ').flatMap((w, i) => [
    i > 0 ? ' ' : null,
    <span key={i} className="word"><span className="wordin">{w}</span></span>
  ]);
}

function Arrow({ deg }) {
  return (
    <svg className="boardarrow" viewBox="0 0 24 24" aria-hidden="true"
         style={{ '--deg': `${Math.round(deg)}deg` }}>
      <path d="M12 3 5 11h4.5v10h5V11H19z" />
    </svg>
  );
}

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

// Split-flap text, like a station departure board: each character spins
// through a few others before settling. The real value is always in the
// accessible label.
function Flap({ text }) {
  return (
    <span className="flap" data-flap={text} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} className="flapch" aria-hidden="true">{ch}</span>
      ))}
    </span>
  );
}

function DestinationBoard({ onOpenPlace }) {
  if (!BOARD_ROWS.length) return null;
  return (
    <section id="board" className="band boardband" aria-labelledby="board-title">
      <div className="boardhead">
        <h2 id="board-title" className="split"><Words text="Where things are" /></h2>
        <p className="reveal">
          Walking distance from DSU Main Campus. Tap a place to open it on the map.
        </p>
      </div>
      <ul className="board">
        {BOARD_ROWS.map(({ place: p, metres, deg }) => (
          <li key={p.id} className="boardli">
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
                <strong><Flap text={formatDistance(metres)} /></strong>
                <span>{walkTime(metres, 'en')}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const GREETINGS = ['Welcome', 'ಸುಸ್ವಾಗತ', 'स्वागत है', 'வரவேற்கிறோம்', 'స్వాగతం', 'സ്വാഗതം', 'સ્વાગત છે'];

function Marquee() {
  const row = [...GREETINGS, ...GREETINGS];
  return (
    <div className="marquee" aria-label="Welcome, in the app's seven languages">
      <div className="marqueetrack" data-dir="1" aria-hidden="true">
        {[...row, ...row].map((g, i) => <span key={i} className="mq">{g}<i className="mqdot" /></span>)}
      </div>
      <div className="marqueetrack alt" data-dir="-1" aria-hidden="true">
        {[...row, ...row].reverse().map((g, i) => <span key={i} className="mq">{g}<i className="mqdot" /></span>)}
      </div>
    </div>
  );
}

const FEATURES = [
  ['Asks what you need, not where it is', 'Search understands "where do I pay fees" as well as "Block 2", because a first-timer knows their task, not the building names.'],
  ['Walks you there', 'Directions follow traced footpaths rather than a straight line through three buildings, and can avoid stairs.'],
  ['Goes to the floor', 'Departments and labs are recorded inside buildings, so a search for a department answers with a block and a floor.'],
  ['Speaks your language', 'The app works in English, Kannada, Hindi, Tamil, Telugu, Malayalam and Gujarati. The assistant replies in whatever language you write in.'],
  ['Works without signal', 'Map imagery is kept on your phone after the first visit, which matters in the parts of campus where the network drops.'],
  ['Says when it isn\'t sure', 'Places nobody has confirmed yet are marked with a question mark. A confident wrong answer is worse than an honest gap.']
];

// One line icon per feature, drawn on a 24px grid.
const FEATURE_ICONS = [
  '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  '<path d="M7 20c-1.5 0-2.5-1-2.5-2.6 0-2 1.2-3.4 2.6-3.4s2.4 1 2.4 2.8C9.5 18.6 8.6 20 7 20z"/><path d="M15.5 11c-1.6 0-2.5-1.2-2.5-3 0-2.1 1.2-4 2.7-4S18 5.2 18 7.2c0 2-1 3.8-2.5 3.8z"/>',
  '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  '<path d="M4 5h9"/><path d="M8.5 3v2"/><path d="M11 5c-1 4-3.5 7-7 9"/><path d="M6 9c1.5 2.5 3.5 4 6 5"/><path d="m13 21 4-9 4 9"/><path d="M14.5 18h5"/>',
  '<path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5.5 12a10 10 0 0 1 13 0"/><path d="M9 15.5a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/><path d="m3 3 18 18"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17.2" r=".6"/>'
];

const STEPS = [
  ['Place the buildings', 'Rooftops are clicked on satellite imagery to fix their position. Names, nicknames and departments come from signboards, timetables and students who already know the place.'],
  ['Trace the walkways', 'Footpaths are drawn by hand and joined into one network. Stretches with steps are tagged so routes can avoid them.'],
  ['Put it on the gates', 'Printable QR posters open the map already centred on the spot where the reader is standing, which is the moment people are most lost.']
];

const CHARS = '0123456789';

// Every scroll effect on the page, set up in one place so they can all be
// switched off together when the visitor prefers reduced motion.
function useScrollEffects(siteRef, storyRef) {
  useEffect(() => {
    const site = siteRef.current;
    if (!site) return;
    const still = reducedMotion();
    const ctx = gsap.context(() => {
      ScrollTrigger.defaults({ scroller: site });

      // Reading progress bar along the top.
      gsap.to('.readbar', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: site.firstElementChild, start: 0, end: 'max', scrub: true }
      });

      // Nav slides away while scrolling down, back when scrolling up.
      ScrollTrigger.create({
        start: 200, end: 'max',
        onUpdate: self => site.classList.toggle('navhidden', self.direction === 1 && self.scroll() > 300)
      });

      if (still) return;

      // The story: four captions take turns over the 3D campus.
      const beats = gsap.utils.toArray('.beat');
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: storyRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.7 }
      });
      tl.to(beats[0], { opacity: 0, y: -80, rotateX: 28, duration: 0.08 }, 0.16);
      [1, 2, 3].forEach(i => {
        const at = [0.27, 0.56, 0.84][i - 1];
        tl.fromTo(beats[i], { opacity: 0, y: 90, rotateX: -30 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.07 }, at);
        if (i < 3) tl.to(beats[i], { opacity: 0, y: -80, rotateX: 28, duration: 0.07 }, at + 0.2);
      });
      tl.to('.scrollhint', { opacity: 0, duration: 0.04 }, 0.02);
      tl.to({}, { duration: 0.01 }, 0.99);

      // Signboard follows the pointer a little, like a hanging board.
      const board = site.querySelector('.signboard');
      const tiltBoard = e => {
        const r = board.getBoundingClientRect();
        gsap.to(board, {
          rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10,
          rotateX: -((e.clientY - r.top) / r.height - 0.5) * 10,
          duration: 0.6, ease: 'power2.out'
        });
      };
      window.addEventListener('pointermove', tiltBoard);

      // Headings rise in word by word.
      gsap.utils.toArray('.split').forEach(h => {
        gsap.from(h.querySelectorAll('.wordin'), {
          yPercent: 110, rotateX: -70, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });

      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.from(el, {
          y: 50, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
        });
      });

      // Marquee: two bands of greetings; scrolling speeds them up.
      const tracks = gsap.utils.toArray('.marqueetrack');
      const loops = tracks.map(tr => {
        const dir = Number(tr.dataset.dir);
        return gsap.fromTo(tr, { xPercent: dir > 0 ? 0 : -50 }, {
          xPercent: dir > 0 ? -50 : 0, duration: 40, ease: 'none', repeat: -1
        });
      });
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onUpdate: self => {
          const boost = 1 + Math.min(6, Math.abs(self.getVelocity()) / 400);
          loops.forEach(l => gsap.to(l, { timeScale: boost, duration: 0.2, overwrite: true }));
          gsap.to(loops, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
        }
      });
      gsap.fromTo('.marquee', { rotate: -3, scale: 1.08 }, {
        rotate: 2, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true }
      });

      // Destination board: rows flip down one by one, then the distances
      // spin like a departure board.
      gsap.from('.boardli', {
        rotateX: -90, opacity: 0, transformOrigin: '50% 0%', stagger: 0.07, duration: 0.7, ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: '.board', start: 'top 80%', toggleActions: 'play none none reverse',
          onEnter: () => spinFlaps(site)
        }
      });
      gsap.from('.boardarrow', {
        rotate: 'random(-540, 540)', duration: 1.4, ease: 'elastic.out(1, 0.5)', stagger: 0.05,
        scrollTrigger: { trigger: '.board', start: 'top 80%', toggleActions: 'play none none reverse' }
      });
      gsap.fromTo('.board', { rotateX: 18, y: 60 }, {
        rotateX: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: '.board', start: 'top bottom', end: 'top 35%', scrub: true }
      });

      // Facts: numbers count up and lean back as they arrive.
      gsap.utils.toArray('.count').forEach(el => {
        const to = Number(el.dataset.to);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to, duration: 1.8, ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-IN'); },
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
      gsap.from('.fact', {
        rotateX: 65, y: 80, opacity: 0, transformOrigin: '50% 100%', stagger: 0.12, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.facts', start: 'top 80%', toggleActions: 'play none none reverse' }
      });
      gsap.to('.fact.big b', {
        scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '.facts', start: 'top 70%', end: 'bottom top', scrub: true }
      });

      // Feature cards swing in from the side like opening doors.
      gsap.from('.card', {
        rotateY: i => (i % 2 ? -75 : 75), z: -200, opacity: 0, stagger: 0.09, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.cards', start: 'top 80%', toggleActions: 'play none none reverse' }
      });
      gsap.fromTo('.cards', { rotateX: 14 }, {
        rotateX: -6, ease: 'none',
        scrollTrigger: { trigger: '.cards', start: 'top bottom', end: 'bottom top', scrub: true }
      });

      // The steps: a line fills down the side as you read.
      gsap.fromTo('.pipefill', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.pipeline', start: 'top 70%', end: 'bottom 60%', scrub: true }
      });
      gsap.utils.toArray('.pipeline li').forEach(li => {
        gsap.from(li.querySelector('.stepnum'), {
          scale: 0, rotate: -180, duration: 0.7, ease: 'back.out(2)',
          scrollTrigger: { trigger: li, start: 'top 72%', toggleActions: 'play none none reverse' }
        });
        gsap.from(li.querySelector('div'), {
          x: 80, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: li, start: 'top 72%', toggleActions: 'play none none reverse' }
        });
      });

      // Coverage bar fills, and its number counts with it.
      gsap.from('.coveragefill', {
        width: 0, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: '.coveragebar', start: 'top 85%', toggleActions: 'play none none reverse' }
      });

      // Parallax: the dark sections' headings drift slower than the page.
      gsap.utils.toArray('.drift').forEach(el => {
        gsap.fromTo(el, { y: 60 }, {
          y: -60, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      return () => window.removeEventListener('pointermove', tiltBoard);
    }, site);

    // Refresh once fonts and layout settle, so trigger positions are right.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    const timer = setTimeout(refresh, 600);

    return () => {
      clearTimeout(timer);
      ctx.revert();
      ScrollTrigger.defaults({ scroller: window });
    };
  }, [siteRef, storyRef]);
}

function spinFlaps(site) {
  site.querySelectorAll('.flap').forEach((flap, row) => {
    const target = flap.dataset.flap;
    flap.querySelectorAll('.flapch').forEach((ch, i) => {
      // Only digits spin; units and spaces stay put.
      if (!/[0-9]/.test(target[i])) { ch.textContent = target[i]; return; }
      let n = 0;
      const turns = 6 + i * 2 + row;
      const id = setInterval(() => {
        n++;
        if (n >= turns) {
          ch.textContent = target[i];
          ch.classList.remove('flipping');
          clearInterval(id);
          return;
        }
        ch.textContent = CHARS[Math.floor(Math.random() * 10)];
        ch.classList.toggle('flipping');
      }, 55);
    });
  });
}

// Cards lean towards the pointer, with a light sheen following it.
function tilt(e) {
  if (reducedMotion()) return;
  const c = e.currentTarget, r = c.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
  c.style.setProperty('--rx', `${-(y - 0.5) * 16}deg`);
  c.style.setProperty('--gx', `${x * 100}%`);
  c.style.setProperty('--gy', `${y * 100}%`);
}
function untilt(e) {
  const c = e.currentTarget;
  c.style.setProperty('--ry', '0deg');
  c.style.setProperty('--rx', '0deg');
}

// Buttons drift towards the pointer when it comes close.
function magnet(e) {
  if (reducedMotion()) return;
  const b = e.currentTarget, r = b.getBoundingClientRect();
  gsap.to(b, {
    x: (e.clientX - r.left - r.width / 2) * 0.3,
    y: (e.clientY - r.top - r.height / 2) * 0.4,
    duration: 0.4, ease: 'power3.out'
  });
}
function unmagnet(e) {
  gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
}

function Go({ onEnter }) {
  return (
    <button className="go" onClick={onEnter} onPointerMove={magnet} onPointerLeave={unmagnet}>
      Open the map
    </button>
  );
}

export default function Home({ onEnter, onOpenPlace, placeCount, pathCount }) {
  const siteRef = useRef(null);
  const storyRef = useRef(null);
  const confirmedCount = PLACES.filter(p => p.confidence === 'confirmed').length;
  const totalPlaces = PLACES.length;
  const coveragePct = totalPlaces ? Math.round((confirmedCount / totalPlaces) * 100) : 0;

  useEffect(() => {
    document.title = 'DSU Campus Navigator';
  }, []);

  useScrollEffects(siteRef, storyRef);

  return (
    <div className="site" ref={siteRef}>
      <div className="readbar" aria-hidden="true" />
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
        <section className="story" ref={storyRef}>
          <div className="stage">
            <Campus3D storyRef={storyRef} siteRef={siteRef} />
            <div className="stageshade" aria-hidden="true" />

            <div className="beats">
              <div className="beat beat0">
                <div className="signboard">
                  <h1>Nobody should get lost on their first day.</h1>
                  <p className="signlede">
                    Dayananda Sagar University at Harohalli covers 162 acres, and Google
                    Maps shows it as a single pin. This map shows the gates, blocks,
                    hostels and the walk between them.
                  </p>
                  <div className="actions"><Go onEnter={onEnter} /></div>
                  {placeCount > 0 && (
                    <p className="counts">
                      {placeCount} places mapped
                      {pathCount > 0 && `, ${pathCount} walkways traced`}
                    </p>
                  )}
                </div>
              </div>
              <div className="beat beatcap">
                <p className="capbig">162 acres.</p>
                <p className="capsmall">One pin on Google Maps. A wrong turn here costs ten minutes.</p>
              </div>
              <div className="beat beatcap beatright">
                <p className="capbig">Every place, marked.</p>
                <p className="capsmall">Gates, blocks, hostels, the mess and the hospital, each where it really stands.</p>
              </div>
              <div className="beat beatcap beatend">
                <p className="capbig">Find it before you arrive.</p>
                <div className="actions"><Go onEnter={onEnter} /></div>
              </div>
            </div>

            <div className="scrollhint" aria-hidden="true">
              <span className="mouse"><span /></span>
              Scroll to fly in
            </div>
          </div>
        </section>

        <Marquee />

        <DestinationBoard onOpenPlace={onOpenPlace} />

        <section id="problem" className="band">
          <h2 className="split drift"><Words text="Being big is the problem" /></h2>
          <div className="facts">
            <div className="fact big">
              <b><span className="count" data-to="900">900</span> m</b>
              <p>
                between the furthest canteen and the main engineering and medical
                building. A wrong guess between classes costs you ten minutes.
              </p>
            </div>
            <div className="fact">
              <b><span className="count" data-to="1">1</span></b>
              <p>pin for the entire campus on Google Maps. No blocks, no hostels, no gates.</p>
            </div>
            <div className="fact">
              <b><span className="count" data-to="15000">15,000</span>+</b>
              <p>students, and every one of them was new here once.</p>
            </div>
          </div>
          <p className="aside reveal">
            OpenStreetMap has almost nothing inside the campus either. There was no
            dataset to build on, so the first job was making one.
          </p>
        </section>

        <section id="does" className="paperband">
          <div className="paperinner">
            <h2 className="split"><Words text="What it does" /></h2>
            <div className="cards">
              {FEATURES.map(([title, body], i) => (
                <article key={title} className="card">
                  {/* GSAP animates the card itself; the pointer tilt goes
                      on this inner layer so the two never fight. */}
                  <div className="cardin" onPointerMove={tilt} onPointerLeave={untilt}>
                    <svg className="cardicon" viewBox="0 0 24 24" aria-hidden="true"
                         dangerouslySetInnerHTML={{ __html: FEATURE_ICONS[i] }} />
                    <h3>{title}</h3>
                    <p>{body}</p>
                    <span className="sheen" aria-hidden="true" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="data" className="band">
          <h2 className="split drift"><Words text="Built from nothing" /></h2>
          <p className="lede reveal">
            None of this data existed. It is made by hand with three small tools,
            and the dataset is the part that took the work.
          </p>
          <div className="pipewrap">
          <span className="pipeline-rail" aria-hidden="true"><span className="pipefill" /></span>
          <ol className="pipeline">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <span className="stepnum">{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
          </div>
        </section>

        <section className="band closing">
          <div className="closegrid">
            <div className="reveal">
              <h2>{t('coverageTitle', 'en')}</h2>
              <div className="coveragebar" role="img"
                   aria-label={`${coveragePct}% of places confirmed`}>
                <div className="coveragefill" style={{ width: `${coveragePct}%` }} />
              </div>
              <p className="lede">{t('coverageConfirmed', 'en')(confirmedCount, totalPlaces)}</p>
              <p className="aside">{t('coverageHelp', 'en')}</p>
            </div>
            <div className="reveal">
              <h2>Something wrong? Say so.</h2>
              <p className="lede">
                Every place in the app has a link that reports a correction with its
                name and position attached. That is how a guess becomes a confirmed
                location, and how the map stays right after I graduate.
              </p>
              <div className="actions">
                <Go onEnter={onEnter} />
                <a
                  className="alt"
                  href="https://github.com/Mnvv08/dsu-campus-nav/issues"
                  target="_blank"
                  rel="noreferrer"
                  onPointerMove={magnet}
                  onPointerLeave={unmagnet}
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
