// Live progress along a route, for the full-screen navigation view.
//
// Rather than waiting for the walker to come within a few metres of each
// turn (which GPS drift often never quite does), every position is
// projected onto the route line, and progress is measured as distance
// along it. The next turn, the distance to it, the map heading and
// whether the walker has left the route all follow from that.

const toRad = d => (d * Math.PI) / 180;

function bearingDeg(a, b) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat), Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Flattens the steps into one line with running distances.
 * stepEnd[i] is how far along the route step i finishes.
 */
export function buildTrack(steps) {
  const pts = [];
  const stepEnd = [];
  let run = 0;
  const lat0 = steps[0]?.start?.lat ?? 0;
  const kx = 111320 * Math.cos(toRad(lat0)), ky = 110540;

  steps.forEach((st, i) => {
    const coords = (st.coords ?? []).map(([lat, lng]) => ({ lat, lng }));
    coords.forEach((c, j) => {
      const prev = pts[pts.length - 1];
      if (prev && j === 0 && Math.abs(prev.lat - c.lat) < 1e-9 && Math.abs(prev.lng - c.lng) < 1e-9) return;
      if (prev) run += Math.hypot((c.lng - prev.lng) * kx, (c.lat - prev.lat) * ky);
      pts.push({ ...c, cum: run });
    });
    stepEnd[i] = run;
  });
  return { pts, stepEnd, total: run, kx, ky };
}

/**
 * Where `pos` sits on the route. Only looks near the previous position
 * along the route, so a route that doubles back past itself is not
 * confused about which side of the loop the walker is on.
 */
export function locate(track, pos, prevAlong = 0) {
  const { pts, kx, ky } = track;
  let best = null;
  const lo = prevAlong - 40, hi = prevAlong + 220;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (b.cum < lo || a.cum > hi) continue;
    const ax = (a.lng - pos.lng) * kx, ay = (a.lat - pos.lat) * ky;
    const bx = (b.lng - pos.lng) * kx, by = (b.lat - pos.lat) * ky;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (!best || d < best.off) {
      best = {
        off: d,
        along: a.cum + t * (b.cum - a.cum),
        point: { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) },
        heading: bearingDeg(a, b),
        seg: i
      };
    }
  }
  return best;
}

// The step being walked: the first one that ends further on than here.
export function stepAt(track, along, count) {
  for (let i = 0; i < count - 1; i++) {
    if (track.stepEnd[i] > along + 4) return i;
  }
  return count - 1;
}

// Route split at the walker's position: what has been walked, what is left.
export function splitRoute(track, at) {
  if (!at) return { done: [], left: track.pts.map(p => [p.lat, p.lng]) };
  const done = track.pts.slice(0, at.seg).map(p => [p.lat, p.lng]);
  const left = track.pts.slice(at.seg).map(p => [p.lat, p.lng]);
  const here = [at.point.lat, at.point.lng];
  return { done: [...done, here], left: [here, ...left] };
}

// Heading of the route at a given distance along it.
export function headingAt(track, along) {
  const { pts } = track;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].cum >= along && pts[i].cum - pts[i - 1].cum > 0.5) return bearingDeg(pts[i - 1], pts[i]);
  }
  return pts.length > 1 ? bearingDeg(pts[pts.length - 2], pts[pts.length - 1]) : 0;
}
