import { distance } from './categories';

const key = (lat, lng) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

// Turn the traced polylines into an undirected weighted graph.
// Vertices shared between paths collapse into one node, which is what
// makes junctions work — the tracer snaps clicks so this holds.
// Paths are either a bare array of points (the original format) or an
// object carrying attributes. Accepting both means old exports keep
// working rather than silently producing an empty network.
const normalise = p => (Array.isArray(p) ? { points: p, steps: false, name: null } : p);

export function buildGraph(paths) {
  const nodes = new Map(); // key -> { lat, lng, edges: [{ to, cost, steps }] }

  const add = ([lat, lng]) => {
    const k = key(lat, lng);
    if (!nodes.has(k)) nodes.set(k, { lat, lng, edges: [] });
    return k;
  };

  for (const raw of paths) {
    // `name` is how directions refer to this path ("the road along the
    // lake"); paths without one still route, they just aren't named.
    const { points, steps = false, name = null } = normalise(raw);
    for (let i = 1; i < points.length; i++) {
      const a = add(points[i - 1]);
      const b = add(points[i]);
      if (a === b) continue;
      const cost = distance(nodes.get(a), nodes.get(b));
      nodes.get(a).edges.push({ to: b, cost, steps, name });
      nodes.get(b).edges.push({ to: a, cost, steps, name });
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

// Dijkstra from several start nodes at once, each seeded with the
// distance from the walker to it, run until every node is settled. The
// graph is a few hundred nodes, so a full run costs nothing noticeable.
function settleAll(graph, seeds, avoidSteps) {
  const dist = new Map(seeds.map(s => [s.key, s.cost]));
  const prev = new Map();
  const done = new Set();
  while (true) {
    let cur = null, curD = Infinity;
    for (const [k, d] of dist) if (!done.has(k) && d < curD) { cur = k; curD = d; }
    if (cur === null) break;
    done.add(cur);
    for (const e of graph.get(cur).edges) {
      if (done.has(e.to) || (avoidSteps && e.steps)) continue;
      const alt = curD + e.cost;
      if (alt < (dist.get(e.to) ?? Infinity)) { dist.set(e.to, alt); prev.set(e.to, cur); }
    }
  }
  return { dist, prev };
}

// Nodes worth joining the network at: the nearest, plus any not much
// further away. Picking the best of these avoids routes that first walk
// to the nearest point and then double back past where they started.
function joinCandidates(graph, point) {
  const all = [...graph].map(([key, n]) => ({ key, away: distance(point, n) }));
  const nearest = Math.min(...all.map(c => c.away));
  return all.filter(c => c.away <= nearest + 35);
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

  const starts = joinCandidates(graph, from);
  const ends = joinCandidates(graph, to);
  const solve = steps => {
    const { dist, prev } = settleAll(graph, starts.map(c => ({ key: c.key, cost: c.away })), steps);
    let best = null;
    for (const c of ends) {
      const d = dist.get(c.key);
      if (d !== undefined && (!best || d + c.away < best.total)) best = { ...c, total: d + c.away };
    }
    if (!best) return null;
    const chain = [best.key];
    while (prev.has(chain[0])) chain.unshift(prev.get(chain[0]));
    const head = starts.find(c => c.key === chain[0]);
    if (chain.length < 2) return null;
    return { chain, metres: best.total - best.away - head.away, headAway: head.away, tailAway: best.away };
  };

  let found = solve(avoidSteps);
  let noStepFreeRoute = false;

  // Falling back to a route with steps is more useful than a dead end,
  // but only if the app says clearly which one it gave.
  if (!found && avoidSteps) {
    found = solve(false);
    noStepFreeRoute = true;
  }
  if (!found) return null;

  const coords = found.chain.map(k => {
    const n = graph.get(k);
    return [n.lat, n.lng];
  });

  // The path name for every segment of `coords`, in order. The first and
  // last segments are the walk on and off the network, so they have none.
  const segNames = [null];
  for (let i = 1; i < found.chain.length; i++) {
    const edge = graph.get(found.chain[i - 1]).edges.find(e => e.to === found.chain[i]);
    segNames.push(edge?.name ?? null);
  }
  segNames.push(null);

  return {
    coords: [[from.lat, from.lng], ...coords, [to.lat, to.lng]],
    names: segNames,
    metres: found.metres + found.headAway + found.tailAway,
    offNetwork: Math.round(found.headAway + found.tailAway),
    noStepFreeRoute
  };
}
