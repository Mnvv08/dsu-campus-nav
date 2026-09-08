import { distance } from './categories';

const key = (lat, lng) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

// Turn the traced polylines into an undirected weighted graph.
// Vertices shared between paths collapse into one node, which is what
// makes junctions work — the tracer snaps clicks so this holds.
// Paths are either a bare array of points (the original format) or an
// object carrying attributes. Accepting both means old exports keep
// working rather than silently producing an empty network.
const normalise = p => (Array.isArray(p) ? { points: p, steps: false } : p);

export function buildGraph(paths) {
  const nodes = new Map(); // key -> { lat, lng, edges: [{ to, cost, steps }] }

  const add = ([lat, lng]) => {
    const k = key(lat, lng);
    if (!nodes.has(k)) nodes.set(k, { lat, lng, edges: [] });
    return k;
  };

  for (const raw of paths) {
    const { points, steps = false } = normalise(raw);
    for (let i = 1; i < points.length; i++) {
      const a = add(points[i - 1]);
      const b = add(points[i]);
      if (a === b) continue;
      const cost = distance(nodes.get(a), nodes.get(b));
      nodes.get(a).edges.push({ to: b, cost, steps });
      nodes.get(b).edges.push({ to: a, cost, steps });
    }
  }

  return nodes;
}

function nearestNode(graph, point) {
  let best = null;
  let bestD = Infinity;
  for (const [k, n] of graph) {
    const d = distance(point, n);
    if (d < bestD) { bestD = d; best = k; }
  }
  return best === null ? null : { key: best, away: bestD };
}

// Dijkstra with a linear scan for the next node. The campus network is
// a few hundred nodes at most, so a binary heap would be more code for
// no measurable gain.
function shortestPath(graph, from, to, avoidSteps = false) {
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const done = new Set();

  while (true) {
    let cur = null;
    let curD = Infinity;
    for (const [k, d] of dist) {
      if (!done.has(k) && d < curD) { cur = k; curD = d; }
    }
    if (cur === null) return null;
    if (cur === to) break;
    done.add(cur);

    for (const e of graph.get(cur).edges) {
      if (done.has(e.to)) continue;
      // Excluded outright rather than penalised. A weighted detour would
      // still route someone up a staircase if the alternative were long
      // enough, which defeats the point.
      if (avoidSteps && e.steps) continue;
      const alt = curD + e.cost;
      if (alt < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, alt);
        prev.set(e.to, cur);
      }
    }
  }

  const chain = [to];
  while (prev.has(chain[0])) chain.unshift(prev.get(chain[0]));
  return { chain, metres: dist.get(to) };
}

/**
 * Route between two points via the traced network.
 * Returns { coords, metres, offNetwork } or null if no route exists.
 * `offNetwork` is how far the walker is from the nearest traced path at
 * either end — worth surfacing, because a long tail means the route is
 * only partly trustworthy.
 */
export function route(graph, from, to, { avoidSteps = false } = {}) {
  if (!graph || graph.size === 0) return null;

  const a = nearestNode(graph, from);
  const b = nearestNode(graph, to);
  if (!a || !b) return null;

  // Both ends landing on the same node means the network is too coarse
  // here to say anything useful.
  if (a.key === b.key) return null;

  let found = shortestPath(graph, a.key, b.key, avoidSteps);
  let noStepFreeRoute = false;

  // Falling back to a route with steps is more useful than a dead end,
  // but only if the app says clearly which one it gave.
  if (!found && avoidSteps) {
    found = shortestPath(graph, a.key, b.key, false);
    noStepFreeRoute = true;
  }
  if (!found) return null;

  const coords = found.chain.map(k => {
    const n = graph.get(k);
    return [n.lat, n.lng];
  });

  return {
    coords: [[from.lat, from.lng], ...coords, [to.lat, to.lng]],
    metres: found.metres + a.away + b.away,
    offNetwork: Math.round(a.away + b.away),
    noStepFreeRoute
  };
}
