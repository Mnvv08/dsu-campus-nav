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
// Points closer together than this are treated as one: the bearing
// between them is numerical noise, not a direction.
const MIN_LEG_M = 3;

// Point-to-polyline helpers in a flat local projection (fine at campus
// scale), used to find places beside a stretch of path and which side
// of the walker they are on.
const toXY = q => ({ x: q.lng * 111320 * Math.cos(toRad(q.lat)), y: q.lat * 110540 });

function nearestOnLeg(place, legPts) {
  const P = toXY(place);
  let best = { d: Infinity, along: 0, side: 0 };
  let walked = 0;
  for (let i = 0; i < legPts.length - 1; i++) {
    const A = toXY(legPts[i]), B = toXY(legPts[i + 1]);
    const dx = B.x - A.x, dy = B.y - A.y;
    const len = Math.hypot(dx, dy);
    const t = len ? Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / (len * len))) : 0;
    const cx = A.x + t * dx, cy = A.y + t * dy;
    const d = Math.hypot(P.x - cx, P.y - cy);
    if (d < best.d) {
      // Cross product: positive means the place is to the left of travel.
      const cross = dx * (P.y - A.y) - dy * (P.x - A.x);
      best = { d, along: walked + t * len, side: cross > 0 ? 'left' : 'right' };
    }
    walked += len;
  }
  return { ...best, total: walked };
}

// Direction of travel over the first (or last) ~20 m of a stretch, which
// is steadier than the bearing of one short segment.
function headingFrom(pts, fromEnd = false) {
  const seq = fromEnd ? [...pts].reverse() : pts;
  let i = 1, d = 0;
  while (i < seq.length - 1 && d + distance(seq[i - 1], seq[i]) < 20) { d += distance(seq[i - 1], seq[i]); i++; }
  const h = bearing(seq[0], seq[i]);
  return fromEnd ? (h + 180) % 360 : h;
}

function classifyTurn(angle) {
  const a = Math.abs(angle);
  if (a < 25) return 'straight';
  if (a < 60) return angle < 0 ? 'slight-left' : 'slight-right';
  if (a < 140) return angle < 0 ? 'left' : 'right';
  if (a < 165) return angle < 0 ? 'sharp-left' : 'sharp-right';
  return 'u-turn';
}

const TURN_SPLIT_DEG = 30;  // a bend this sharp starts a new instruction
const SAME_PATH_TURN_DEG = 65; // ...but along one path, only a real turn does
const MIN_STEP_M = 10;      // shorter stretches are folded into the next
const LANDMARK_M = 60;      // a place this close to a turn names the turn
const PASS_M = 45;          // a place this close to a stretch is "passed"

/**
 * Turns a route into instructions a newcomer can follow: which way to
 * turn, onto which path, at which landmark, what they will pass, and
 * which side the destination is on when they get there.
 *
 *   coords  [[lat, lng], ...] from route.js
 *   options.names        path name for each segment of coords (route.js)
 *   options.places       every mapped place, for landmarks
 *   options.originId     place the walk starts from, if any
 *   options.destination  the place being walked to
 */
export function buildSteps(coords, { names = [], places = [], originId = null, destination = null } = {}) {
  if (!coords || coords.length < 2) return [];

  // Points with the name of the segment leaving each one; near-duplicate
  // points are dropped (their bearing is noise) without losing names.
  const raw = coords.map(([lat, lng], i) => ({ lat, lng, nameOut: names[i] ?? null }));
  const pts = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const last = pts[pts.length - 1];
    const isFinal = i === raw.length - 1;
    if (distance(last, raw[i]) < MIN_LEG_M && !isFinal) {
      last.nameOut = raw[i].nameOut ?? last.nameOut;
      continue;
    }
    if (isFinal && distance(last, raw[i]) < MIN_LEG_M && pts.length > 1) pts[pts.length - 1] = raw[i];
    else pts.push(raw[i]);
  }
  if (pts.length < 2) return [];

  // Split into stretches at real bends and where the path changes.
  const cuts = [0];
  for (let i = 1; i < pts.length - 1; i++) {
    const angle = turnAngle(bearing(pts[i - 1], pts[i]), bearing(pts[i], pts[i + 1]));
    const a = pts[i - 1].nameOut, b = pts[i].nameOut;
    const pathChange = a !== b && b !== null;
    // Along one named path, gentle bends are just the path curving; only
    // a real turn deserves its own instruction.
    const limit = a !== null && a === b ? SAME_PATH_TURN_DEG : TURN_SPLIT_DEG;
    if (Math.abs(angle) >= limit || pathChange) cuts.push(i);
  }
  cuts.push(pts.length - 1);

  let legs = [];
  for (let k = 0; k < cuts.length - 1; k++) {
    const seg = pts.slice(cuts[k], cuts[k + 1] + 1);
    let m = 0;
    for (let i = 1; i < seg.length; i++) m += distance(seg[i - 1], seg[i]);
    legs.push({ pts: seg, metres: m, road: seg[0].nameOut });
  }
  // Fold very short stretches into the following one, so a kink in the
  // path never becomes "turn left, 4 m, turn right".
  for (let k = legs.length - 2; k >= 0; k--) {
    if (legs[k].metres < MIN_STEP_M && k > 0) {
      const prev = legs[k - 1];
      prev.pts = [...prev.pts, ...legs[k].pts.slice(1)];
      prev.metres += legs[k].metres;
      legs.splice(k, 1);
    }
  }

  // The last few metres usually leave the path for the building itself.
  // That short walk-off becomes "it's on your left/right" rather than a
  // separate turn.
  let side = 'ahead';
  const lastLeg = legs[legs.length - 1];
  const endOf = l => l.pts[l.pts.length - 1];
  if (legs.length > 1 && lastLeg.road === null && lastLeg.metres < 70) {
    const prev = legs[legs.length - 2];
    const ang = turnAngle(headingFrom(prev.pts, true), bearing(lastLeg.pts[0], endOf(lastLeg)));
    side = Math.abs(ang) < 30 ? 'ahead' : ang < 0 ? 'left' : 'right';
    prev.pts = [...prev.pts, ...lastLeg.pts.slice(1)];
    prev.metres += lastLeg.metres;
    legs.pop();
  } else if (lastLeg.pts.length >= 3) {
    const n = lastLeg.pts.length;
    const a = lastLeg.pts[n - 2], b = lastLeg.pts[n - 1];
    if (distance(a, b) > 8) {
      const ang = turnAngle(headingFrom(lastLeg.pts.slice(0, -1), true), bearing(a, b));
      side = Math.abs(ang) < 30 ? 'ahead' : ang < 0 ? 'left' : 'right';
    }
  }

  // A short walk from the start onto the first path is part of the first
  // step ("Walk along the lake road"), not a step of its own.
  if (legs.length > 1 && legs[0].road === null && legs[0].metres < 65) {
    const [stub, first] = legs;
    // If joining the path means turning onto it, say so ("Walk to the
    // lakeside path, then turn left").
    const join = turnAngle(headingFrom(stub.pts, true), headingFrom(first.pts));
    if (Math.abs(join) >= 45) first.joinTurn = classifyTurn(join);
    first.pts = [...stub.pts, ...first.pts.slice(1)];
    first.metres += stub.metres;
    legs.shift();
  }

  const dest = destination;
  const usable = places.filter(p => p.id !== originId && p.id !== dest?.id);
  const nearestPlace = (pt, within) => {
    let best = null, bd = within;
    for (const p of usable) {
      const d = distance(pt, p);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  const used = new Set();

  const steps = legs.map((leg, k) => {
    const start = leg.pts[0];
    const end = leg.pts[leg.pts.length - 1];
    const step = {
      kind: k === 0 ? 'depart' : 'turn',
      turn: null,
      road: leg.road,
      start,
      at: end,            // live tracking moves on when the walker reaches this
      metres: leg.metres,
      coords: leg.pts.map(p => [p.lat, p.lng]),
      landmark: null,
      towards: null,
      stay: k > 0 && leg.road !== null && legs[k - 1].road === leg.road,
      pass: null,
      nextRoad: legs[k + 1]?.road ?? null
    };

    if (k === 0) {
      // Point the walker at something they can see ahead, not a compass
      // direction: the nearest place roughly in line with the first stretch.
      const h = headingFrom(leg.pts);
      let best = null, bd = Infinity;
      for (const p of [...usable, ...(dest ? [dest] : [])]) {
        const d = distance(start, p);
        if (d < 60 || d > 350) continue; // too close to matter, or too far to see
        const off = Math.abs(turnAngle(h, bearing(start, p)));
        if (off < 35 && d < bd) { bd = d; best = p; }
      }
      step.towards = best;
      step.direction = compassWord(h);
      step.joinTurn = leg.joinTurn ?? null;
    } else {
      const angle = turnAngle(headingFrom(legs[k - 1].pts, true), headingFrom(leg.pts));
      step.turn = classifyTurn(angle);
      step.kind = step.turn === 'straight' ? 'continue' : 'turn';
      const lm = nearestPlace(start, LANDMARK_M);
      if (lm) { step.landmark = lm; used.add(lm.id); }
    }

    // Something worth noticing along the way, on one side or the other.
    let pass = null;
    for (const p of usable) {
      if (used.has(p.id)) continue;
      const n = nearestOnLeg(p, leg.pts);
      if (n.d < PASS_M && n.along > n.total * 0.15 && n.along < n.total * 0.9 && (!pass || n.d < pass.d)) {
        pass = { place: p, side: n.side, d: n.d };
      }
    }
    if (pass) { step.pass = pass; used.add(pass.place.id); }
    return step;
  });

  const endPt = pts[pts.length - 1];
  steps.push({
    kind: 'arrive', turn: null, road: null, start: endPt, at: endPt, metres: 0,
    coords: [[endPt.lat, endPt.lng]], side, place: dest
  });
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
