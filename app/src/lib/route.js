import { distance } from './categories';

const key = (lat, lng) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

// Turn the traced polylines into an undirected weighted graph.
// Vertices shared between paths collapse into one node, which is what
// makes junctions work — the tracer snaps clicks so this holds.
export function buildGraph(paths) {
  const nodes = new Map(); // key -> { lat, lng, edges: [{ to, cost }] }

  const add = ([lat, lng]) => {
    const k = key(lat, lng);
    if (!nodes.has(k)) nodes.set(k, { lat, lng, edges: [] });
    return k;
  };

  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const a = add(path[i - 1]);
      const b = add(path[i]);
      if (a === b) continue;
      const cost = distance(nodes.get(a), nodes.get(b));
      nodes.get(a).edges.push({ to: b, cost });
      nodes.get(b).edges.push({ to: a, cost });
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
function shortestPath(graph, from, to) {
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
export function route(graph, from, to) {
  if (!graph || graph.size === 0) return null;

  const a = nearestNode(graph, from);
  const b = nearestNode(graph, to);
  if (!a || !b) return null;

  // Both ends landing on the same node means the network is too coarse
  // here to say anything useful.
  if (a.key === b.key) return null;

  const found = shortestPath(graph, a.key, b.key);
  if (!found) return null;

  const coords = found.chain.map(k => {
    const n = graph.get(k);
    return [n.lat, n.lng];
  });

  return {
    coords: [[from.lat, from.lng], ...coords, [to.lat, to.lng]],
    metres: found.metres + a.away + b.away,
    offNetwork: Math.round(a.away + b.away)
  };
}
