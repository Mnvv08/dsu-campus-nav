import { distance } from './categories';
import { route as routeBetween } from './route';

// Real distance between two points, routed through the traced path
// network when possible. Falls back to straight-line if no path
// connects them, same honesty rule the rest of the app follows —
// a trip plan built on fabricated distances would be worse than one
// that admits a leg is estimated.
function legDistance(graph, a, b) {
  const r = routeBetween(graph, a, b);
  if (r) return { metres: r.metres, coords: r.coords, direct: false };
  return {
    metres: distance(a, b),
    coords: [[a.lat, a.lng], [b.lat, b.lng]],
    direct: true
  };
}

// Every pairwise distance between origin and stops, computed once so
// the ordering search doesn't repeatedly re-run Dijkstra on the same
// pair of points.
function buildMatrix(graph, points) {
  const n = points.length;
  const m = Array.from({ length: n }, () => new Array(n).fill(null));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const leg = legDistance(graph, points[i], points[j]);
      m[i][j] = leg;
      m[j][i] = leg; // walking distance is symmetric even if the leg's
                      // drawn coordinates would be reversed
    }
  }
  return m;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

// Above this many stops, brute force (factorial growth) becomes too
// slow for a browser tab. A real campus trip is realistically 2-5
// places, so this ceiling is generous rather than a real constraint.
const BRUTE_FORCE_LIMIT = 7;

/**
 * Finds the visiting order for `stops` (starting from `origin`) that
 * minimises total walking distance through the traced path network.
 *
 * For up to BRUTE_FORCE_LIMIT stops this checks every possible order
 * and returns the true optimum — genuinely the best answer, not an
 * approximation. Beyond that it falls back to nearest-neighbour, which
 * is fast but not guaranteed optimal; that trade-off is flagged in the
 * result so the UI can be honest about which one was used.
 */
export function planTrip(graph, origin, stops) {
  if (stops.length === 0) return null;

  const points = [origin, ...stops];
  const matrix = buildMatrix(graph, points);
  const stopIdx = stops.map((_, i) => i + 1); // indices into `points`, origin is 0

  let bestOrder, optimal;

  if (stops.length <= BRUTE_FORCE_LIMIT) {
    let bestTotal = Infinity;
    bestOrder = stopIdx;
    for (const perm of permutations(stopIdx)) {
      let total = 0;
      let cur = 0;
      for (const next of perm) {
        total += matrix[cur][next].metres;
        cur = next;
      }
      if (total < bestTotal) {
        bestTotal = total;
        bestOrder = perm;
      }
    }
    optimal = true;
  } else {
    // Nearest-neighbour: repeatedly jump to whichever remaining stop is
    // closest to the current position. Simple, fast, not guaranteed
    // shortest overall — a reasonable trade once brute force stops
    // being practical.
    const remaining = new Set(stopIdx);
    bestOrder = [];
    let cur = 0;
    while (remaining.size) {
      let nearest = null, nearestD = Infinity;
      for (const idx of remaining) {
        const d = matrix[cur][idx].metres;
        if (d < nearestD) { nearestD = d; nearest = idx; }
      }
      bestOrder.push(nearest);
      remaining.delete(nearest);
      cur = nearest;
    }
    optimal = false;
  }

  // Build the actual leg-by-leg plan in the chosen order.
  const legs = [];
  let cur = 0;
  let totalMetres = 0;
  let anyDirect = false;
  for (const next of bestOrder) {
    const leg = matrix[cur][next];
    legs.push({ from: points[cur], to: points[next], ...leg });
    totalMetres += leg.metres;
    if (leg.direct) anyDirect = true;
    cur = next;
  }

  return {
    order: bestOrder.map(i => stops[i - 1]), // back to place objects, in visiting order
    legs,
    totalMetres,
    optimal,
    anyDirect
  };
}
