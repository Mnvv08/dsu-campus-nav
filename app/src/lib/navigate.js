import { distance } from './categories';

const toRad = d => (d * Math.PI) / 180;
const toDeg = r => (r * 180) / Math.PI;

// Compass bearing from a to b, in degrees, 0 = north.
function bearing(a, b) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Signed turn angle between two headings, -180..180. Negative is left,
// positive is right, matching how people actually describe a turn.
function turnAngle(inBearing, outBearing) {
  let d = outBearing - inBearing;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function classify(angle) {
  const a = Math.abs(angle);
  if (a < 20) return 'straight';
  if (a < 130) return angle < 0 ? 'left' : 'right';
  if (a < 165) return angle < 0 ? 'sharp-left' : 'sharp-right';
  return 'u-turn';
}

function compassWord(deg) {
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Turns a raw coordinate path (as produced by route.js: [[lat,lng], ...])
 * into a list of walking instructions. Consecutive points heading the
 * same way collapse into one leg; a leg only ends where the path
 * actually bends enough to matter, which is what makes this read like
 * directions rather than "go 4m, go 6m, go 3m" for every traced vertex.
 */
// route.js stitches [origin, ...snapped graph nodes..., destination].
// Origin/destination usually land a few centimetres from their nearest
// graph node, not exactly on it, so consecutive points can be almost
// duplicates. Bearing between two points that close is numerical noise,
// not a real direction, and was showing up as a phantom "turn right"
// with 0m to walk. Collapsing near-duplicates before any bearing math
// runs removes the noise at the source.
const MIN_LEG_M = 3;

function dedupeClose(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const last = out[out.length - 1];
    const isFinal = i === pts.length - 1;
    const d = distance(last, pts[i]);

    if (isFinal) {
      // The true destination must survive even if it's very close to
      // what we've kept — but appending it as a *new* point would leave
      // a near-zero final segment whose bearing is pure noise. Replace
      // the last kept point instead, so the destination's exact
      // coordinates are preserved without inventing a noisy micro-leg.
      if (d < MIN_LEG_M && out.length > 1) out[out.length - 1] = pts[i];
      else out.push(pts[i]);
    } else if (d >= MIN_LEG_M) {
      out.push(pts[i]);
    }
  }
  return out;
}

export function buildSteps(coords) {
  if (!coords || coords.length < 2) return [];

  const pts = dedupeClose(coords.map(([lat, lng]) => ({ lat, lng })));
  if (pts.length < 2) return [];
  const legs = [];
  let legStart = 0;
  let legBearing = bearing(pts[0], pts[1]);

  for (let i = 1; i < pts.length - 1; i++) {
    const nextBearing = bearing(pts[i], pts[i + 1]);
    const angle = turnAngle(legBearing, nextBearing);

    if (Math.abs(angle) >= 20) {
      legs.push({ from: legStart, to: i, bearing: legBearing, turn: classify(angle) });
      legStart = i;
      legBearing = nextBearing;
    }
  }
  legs.push({ from: legStart, to: pts.length - 1, bearing: legBearing, turn: null });

  const legDist = leg => {
    let m = 0;
    for (let i = leg.from; i < leg.to; i++) m += distance(pts[i], pts[i + 1]);
    return m;
  };

  // leg[i].turn describes the maneuver at the END of leg i — i.e. the
  // turn you make stepping INTO leg i+1. So step i+1 (not step i) is
  // where that label belongs; getting this backwards puts "turn right"
  // on the departure step instead of the step where you actually turn.
  const steps = legs.map((leg, i) => ({
    kind: i === 0 ? 'depart' : 'turn',
    turn: i === 0 ? null : legs[i - 1].turn,
    direction: i === 0 ? compassWord(leg.bearing) : null,
    // The point where this leg ends is where the *next* instruction
    // triggers — live tracking watches distance to this point.
    at: pts[leg.to],
    metres: legDist(leg)
  }));

  steps.push({ kind: 'arrive', turn: null, direction: null, at: pts[pts.length - 1], metres: 0 });
  return steps;
}

const ADVANCE_RADIUS_M = 15;   // close enough to a maneuver point to move on
const OFF_ROUTE_M = 35;        // this far from the route line counts as off it
const ARRIVE_RADIUS_M = 12;

// Shortest distance from a point to a line segment, for judging how far
// off the traced path someone has wandered.
function pointToSegment(p, a, b) {
  const toXY = q => ({ x: q.lng * 111320 * Math.cos(toRad(q.lat)), y: q.lat * 110540 });
  const P = toXY(p), A = toXY(a), B = toXY(b);
  const dx = B.x - A.x, dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * dx, cy = A.y + t * dy;
  return Math.hypot(P.x - cx, P.y - cy);
}

function distanceToRoute(pos, coords) {
  let best = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = { lat: coords[i][0], lng: coords[i][1] };
    const b = { lat: coords[i + 1][0], lng: coords[i + 1][1] };
    best = Math.min(best, pointToSegment(pos, a, b));
  }
  return best;
}

/**
 * Given the walker's live position, the step list and which step is
 * currently active, decides whether to advance, whether they have
 * arrived, and whether they have wandered off the traced path far
 * enough that the instructions can no longer be trusted.
 */
export function trackProgress(position, steps, currentIndex, coords) {
  if (!steps.length) return { index: currentIndex, arrived: false, offRoute: false, toNext: 0 };

  const step = steps[currentIndex];
  const toNext = distance(position, step.at);

  const offRoute = coords ? distanceToRoute(position, coords) > OFF_ROUTE_M : false;

  if (step.kind === 'arrive') {
    return { index: currentIndex, arrived: toNext < ARRIVE_RADIUS_M, offRoute, toNext };
  }

  if (toNext < ADVANCE_RADIUS_M && currentIndex < steps.length - 1) {
    return { index: currentIndex + 1, arrived: false, offRoute, toNext: 0 };
  }

  return { index: currentIndex, arrived: false, offRoute, toNext };
}

export function remainingDistance(steps, currentIndex, toNext) {
  let m = toNext;
  for (let i = currentIndex + 1; i < steps.length; i++) m += steps[i].metres;
  return m;
}
