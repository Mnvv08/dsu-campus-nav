import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { buildTrack, locate, stepAt, splitRoute, headingAt } from '../lib/navProgress';
import { stepText, stepHint, sayIn, navUi } from '../lib/dirText';
import { colorFor, formatDistance } from '../lib/categories';
import { placeName, VOICE_LOCALE } from '../lib/i18n';
import StepIcon from './StepIcon';

const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const FOLLOW_ZOOM = 18;
const WALK_MS = 1.2;          // metres per second, for time left and arrival
const OFF_ROUTE_M = 30;       // further than this from the route is off it
const ARRIVE_M = 15;

function speak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  // Speech is an extra: if a device's voice engine fails, navigation
  // carries on silently rather than breaking.
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE_LOCALE[lang] ?? 'en-IN';
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

// Keeps the screen awake while navigating, where the browser allows it.
function useWakeLock() {
  useEffect(() => {
    let lock = null;
    const grab = () => navigator.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => {});
    grab();
    const again = () => document.visibilityState === 'visible' && grab();
    document.addEventListener('visibilitychange', again);
    return () => {
      document.removeEventListener('visibilitychange', again);
      lock?.release().catch(() => {});
    };
  }, []);
}

/**
 * Full-screen walking navigation, in the manner of Google Maps: the map
 * follows the walker and turns so the way ahead is always up, the next
 * turn is on a banner at the top, time left and arrival at the bottom,
 * turns are spoken, and leaving the route asks for a new one.
 *
 * Without live GPS (starting from a chosen place) it becomes a preview:
 * the same screen, stepped through with Back and Next.
 */
export default function NavScreen({ steps, places, destination, position, accuracy, live, lang, onReroute, onExit }) {
  const track = useMemo(() => buildTrack(steps), [steps]);
  const [voice, setVoice] = useState(true);
  const [overview, setOverview] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const mapEl = useRef(null);
  const rotEl = useRef(null);
  const mapRef = useRef(null);
  const layers = useRef({});
  const along = useRef(0);
  const offCount = useRef(0);
  const lastReroute = useRef(0);
  const spoken = useRef(new Set());
  const rot = useRef(0);

  useWakeLock();

  // Where the walker is on the route. Progress only moves forward, apart
  // from small GPS wobble, and a new set of steps (a reroute) starts it
  // afresh.
  const [fix, setFix] = useState({ at: null, along: null, track: null });
  const lastTrack = useRef(track);
  useEffect(() => {
    if (lastTrack.current !== track) {
      lastTrack.current = track;
      along.current = 0;
      offCount.current = 0;
      spoken.current = new Set();
      setPreviewIdx(0);
    }
    if (!live || !position) { setFix({ at: null, along: null, track }); return; }
    const hit = locate(track, position, along.current);
    if (hit && hit.off < OFF_ROUTE_M + 15) along.current = Math.max(along.current, hit.along);
    setFix({ at: hit, along: along.current, track });
  }, [live, position, track]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onExit();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  // A fix measured against an older route (just after a reroute) is not
  // used: it would put the walker at the wrong point of the new one.
  const fresh = fix.track === track;
  const at = fresh ? fix.at : null;
  const progress = live && at ? fix.along : null;

  const idx = live
    ? (progress === null ? 0 : stepAt(track, progress, steps.length))
    : previewIdx;
  const arriveIdx = steps.length - 1;
  const remaining = live
    ? Math.max(0, track.total - (progress ?? 0))
    : track.total - (idx > 0 ? track.stepEnd[idx - 1] : 0);
  const toTurn = live ? Math.max(0, track.stepEnd[idx] - (progress ?? 0)) : steps[idx]?.metres ?? 0;
  const arrived = live && progress !== null && remaining < ARRIVE_M;

  // In live mode the banner shows the next manoeuvre; in preview, the step
  // being looked at.
  const bannerStep = live ? steps[Math.min(idx + 1, arriveIdx)] : steps[idx];
  const thenStep = live && idx + 2 <= arriveIdx && steps[idx + 1].metres < 60 ? steps[idx + 2] : null;
  const current = steps[idx];

  // ---- Leaving the route -------------------------------------------------
  useEffect(() => {
    if (!live || !at || arrived) return;
    const limit = Math.max(OFF_ROUTE_M, (accuracy ?? 0) + 10);
    offCount.current = at.off > limit ? offCount.current + 1 : 0;
    if (offCount.current >= 2 && Date.now() - lastReroute.current > 8000) {
      lastReroute.current = Date.now();
      offCount.current = 0;
      setToast(navUi('rerouting', lang));
      if (voice) speak(navUi('rerouting', lang), lang);
      setTimeout(() => setToast(null), 3500);
      onReroute();
    }
  }, [at, live, accuracy, arrived, lang, voice, onReroute]);

  // ---- Spoken turns --------------------------------------------------------
  useEffect(() => {
    if (!voice) return;
    const said = spoken.current;
    const once = (key, text) => { if (!said.has(key)) { said.add(key); speak(text, lang); } };
    if (!live) {
      once(`p${idx}`, [stepText(steps[idx], lang), stepHint(steps[idx], lang)].filter(Boolean).join('. '));
      return;
    }
    if (progress === null) return;
    if (arrived) { once('arrived', navUi('arrived', lang)(placeName(destination, lang))); return; }
    const next = steps[idx + 1];
    if (!next) return;
    if (idx === 0 && !said.has('start')) {
      said.add('start');
      said.add(`${idx + 1}:far`);
      speak(`${stepText(steps[0], lang)}. ${sayIn(toTurn, next, lang)}`, lang);
      return;
    }
    if (toTurn >= 90) once(`${idx + 1}:far`, sayIn(toTurn, next, lang));
    else if (toTurn > 14 && toTurn <= 45) once(`${idx + 1}:near`, sayIn(toTurn, next, lang));
    else if (toTurn <= 14 && next.kind !== 'arrive') once(`${idx + 1}:now`, stepText(next, lang));
  }, [voice, live, idx, toTurn, progress, arrived, steps, lang, destination]);

  // ---- The map ---------------------------------------------------------------
  useEffect(() => {
    const m = L.map(mapEl.current, {
      zoomControl: false, attributionControl: true, dragging: false, touchZoom: false,
      scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
      maxZoom: 19, minZoom: 14, zoomSnap: 0.25
    });
    L.tileLayer(IMAGERY, { maxNativeZoom: 18, maxZoom: 19, attribution: 'Imagery &copy; Esri, Maxar' }).addTo(m);
    m.attributionControl.setPrefix(false);
    m.setView([steps[0].start.lat, steps[0].start.lng], FOLLOW_ZOOM);

    // Nearby campus places as small upright labels, for orientation.
    places.forEach(p => {
      if (p.id === destination?.id) return;
      L.marker([p.lat, p.lng], {
        interactive: false, keyboard: false,
        icon: L.divIcon({
          className: '', iconSize: [0, 0],
          html: `<span class="navpoi"><i style="background:${colorFor(p.category)}"></i>${placeName(p, lang)}</span>`
        })
      }).addTo(m);
    });
    if (destination) {
      L.marker([destination.lat, destination.lng], {
        interactive: false, keyboard: false, zIndexOffset: 700,
        icon: L.divIcon({
          className: '', iconSize: [0, 0],
          html: `<span class="navdest"><svg viewBox="0 0 24 24"><path d="M6 3v18h2v-7h9l-2-4 2-4H8V3z"/></svg><b>${placeName(destination, lang)}</b></span>`
        })
      }).addTo(m);
    }
    mapRef.current = m;
    return () => { m.remove(); mapRef.current = null; layers.current = {}; };
  }, [places, destination, lang, steps]);

  // Route, turn points and the walker, redrawn as they change.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const old = layers.current.route;
    if (old) m.removeLayer(old);
    const { done, left } = splitRoute(track, at && at.off < OFF_ROUTE_M + 15 ? at : null);
    const turns = steps.slice(1, -1).map((s, i) => L.circleMarker([s.start.lat, s.start.lng], {
      radius: i + 1 === idx + 1 - (live ? 0 : 1) ? 7 : 5,
      color: '#0a1b33', weight: 2, fillColor: '#ffffff', fillOpacity: 1, interactive: false
    }));
    layers.current.route = L.layerGroup([
      ...(done.length > 1 ? [L.polyline(done, { color: '#9fb2cb', weight: 7, opacity: .8, lineCap: 'round', lineJoin: 'round', interactive: false })] : []),
      L.polyline(left, { color: '#0a1b33', weight: 13, opacity: .75, lineCap: 'round', lineJoin: 'round', interactive: false }),
      L.polyline(left, { color: '#ffc72c', weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false }),
      ...turns
    ]).addTo(m);
  }, [track, at, steps, idx, live]);

  // Which way is "up", and where the camera sits.
  const heading = useMemo(() => {
    if (live && at && at.off < OFF_ROUTE_M + 15) return headingAt(track, progress ?? 0);
    if (live) return headingAt(track, 0);
    return headingAt(track, (idx > 0 ? track.stepEnd[idx - 1] : 0) + 1);
  }, [live, at, track, progress, idx]);

  const here = live && position
    ? (at && at.off < 20 ? at.point : position)
    : (steps[idx]?.start ?? steps[0].start);

  const frame = useCallback(() => {
    const m = mapRef.current, rotNode = rotEl.current;
    if (!m || !rotNode) return;
    if (overview) {
      rot.current = Math.round(rot.current / 360) * 360;
      rotNode.style.setProperty('--maprot', `${rot.current}deg`);
      const pts = track.pts.map(p => [p.lat, p.lng]);
      // The rotated square is bigger than the screen; pad by the overhang.
      const W = window.innerWidth, H = window.innerHeight, S = rotNode.offsetWidth;
      const ox = (S - W) / 2, oy = (S - H) / 2;
      m.fitBounds(pts, { paddingTopLeft: [ox + 40, oy + 190], paddingBottomRight: [ox + 40, oy + 130], maxZoom: 18, animate: true });
      return;
    }
    // Turn the map the short way round.
    let target = -heading;
    while (target - rot.current > 180) target -= 360;
    while (target - rot.current < -180) target += 360;
    rot.current = target;
    rotNode.style.setProperty('--maprot', `${target}deg`);
    // Put the walker in the lower third: centre the map a little ahead.
    const H = window.innerHeight;
    const ahead = H * 0.2;
    const p = m.project([here.lat, here.lng], FOLLOW_ZOOM);
    const r = (heading * Math.PI) / 180;
    const c = m.unproject(p.add([Math.sin(r) * ahead, -Math.cos(r) * ahead]), FOLLOW_ZOOM);
    m.setView(c, FOLLOW_ZOOM, { animate: true, duration: 0.8 });
  }, [overview, heading, here, track]);

  useEffect(() => { frame(); }, [frame]);

  // Overview lets the walker look around; following does not.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const on = overview;
    ['dragging', 'touchZoom', 'scrollWheelZoom', 'doubleClickZoom'].forEach(h => (on ? m[h].enable() : m[h].disable()));
  }, [overview]);

  // The walker's arrow.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (layers.current.me) m.removeLayer(layers.current.me);
    if (live && !position) return;
    layers.current.me = L.marker([here.lat, here.lng], {
      interactive: false, keyboard: false, zIndexOffset: 1000,
      icon: L.divIcon({
        className: '', iconSize: [0, 0],
        html: `<span class="navme" style="--h:${heading}deg"><svg viewBox="0 0 24 24"><path d="M12 2 4.5 20.5 12 16.5l7.5 4z"/></svg></span>`
      })
    }).addTo(m);
  }, [here, heading, live, position]);

  // ---- Screen ------------------------------------------------------------
  const mins = Math.max(1, Math.round(remaining / WALK_MS / 60));
  const eta = new Date(now + (remaining / WALK_MS) * 1000).toLocaleTimeString(lang === 'en' ? 'en-IN' : VOICE_LOCALE[lang], { hour: 'numeric', minute: '2-digit' });
  const hint = live ? stepHint(current, lang) : stepHint(steps[idx], lang);

  return (
    <div className="navscreen" role="dialog" aria-label={navUi('start', lang)}>
      <div className="navstage">
        <div className="navrot" ref={rotEl}>
          <div className="navmap" ref={mapEl} />
        </div>
      </div>

      {arrived ? (
        <div className="navbanner navbanner-done">
          <StepIcon step={steps[arriveIdx]} size="lg" />
          <div className="navbannertext">
            <strong>{navUi('arrived', lang)(placeName(destination, lang))}</strong>
            <span>{stepText(steps[arriveIdx], lang)}</span>
          </div>
        </div>
      ) : (
        <div className="navbanner" aria-live="polite">
          <StepIcon step={bannerStep} size="lg" />
          <div className="navbannertext">
            {bannerStep.kind !== 'arrive' || live ? <b className="navbannerdist">{formatDistance(toTurn)}</b> : null}
            <strong>{stepText(bannerStep, lang)}</strong>
            {live && progress === null && <span>{navUi('waiting', lang)}</span>}
            {hint && <span>{hint}</span>}
          </div>
          {thenStep && (
            <div className="navthen">
              {navUi('then', lang)} <StepIcon step={thenStep} size="sm" />
            </div>
          )}
        </div>
      )}

      {toast && <p className="navtoast" role="status">{toast}</p>}

      <div className="navside">
        <button
          className={voice ? 'navround on' : 'navround'}
          onClick={() => { setVoice(v => !v); window.speechSynthesis?.cancel(); }}
          aria-label="Spoken directions" aria-pressed={voice}
        >
          {voice ? '🔊' : '🔇'}
        </button>
        <button className="navround" onClick={() => setOverview(o => !o)} aria-pressed={overview}
                aria-label={overview ? navUi('recentre', lang) : navUi('overview', lang)}
                title={overview ? navUi('recentre', lang) : navUi('overview', lang)}>
          {overview
            ? <svg viewBox="0 0 24 24"><path d="M12 2 4.5 20.5 12 16.5l7.5 4z" /></svg>
            : <svg viewBox="0 0 24 24"><path d="M4 18 9 6l5 9 2-4 4 7z" /></svg>}
        </button>
      </div>

      <div className="navbottom">
        {arrived ? (
          <button className="primary navbig" onClick={onExit}>{navUi('done', lang)}</button>
        ) : (
          <>
            <div className="navtime">
              <strong>{mins} {navUi('min', lang)}</strong>
              <span>{formatDistance(remaining)} · {eta} {navUi('arrival', lang)}</span>
            </div>
            {!live && (
              <div className="navstepper">
                <button className="ghost" onClick={() => setPreviewIdx(i => Math.max(0, i - 1))} disabled={idx === 0} aria-label="Previous step">‹</button>
                <span>{idx + 1}/{steps.length}</span>
                <button className="ghost" onClick={() => setPreviewIdx(i => Math.min(arriveIdx, i + 1))} disabled={idx === arriveIdx} aria-label="Next step">›</button>
              </div>
            )}
            <button className="navexit" onClick={onExit}>{navUi('exit', lang)}</button>
          </>
        )}
      </div>
    </div>
  );
}
