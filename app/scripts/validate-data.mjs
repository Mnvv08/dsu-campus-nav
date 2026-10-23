#!/usr/bin/env node
/**
 * Checks the campus data (places, footpaths, building outlines) and reports
 * what is wrong or missing, so field time goes to the things that matter.
 *
 *   npm run validate
 *   node scripts/validate-data.mjs path/to/data-folder   (optional)
 *
 * Exits 1 if there are errors (data the app cannot use correctly), 0
 * otherwise. Warnings never fail the run: they are "fix when you can".
 *
 * The routing rules are copied from src/lib/route.js on purpose: two path
 * vertices only join into a junction when their coordinates match to six
 * decimal places, and a place only counts as on the network when it is
 * within 60 m of a vertex. If those change there, change them here too.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.argv[2] ?? path.join(here, '../src/data'));

const OFF_NETWORK_M = 60;   // same threshold the router uses
const NEAR_MISS_M = 4;      // distinct vertices closer than this look like a missed junction
const LONG_SEGMENT_M = 120; // a straight run this long probably cuts corners
const FAR_FROM_CAMPUS_KM = 5;

const readJson = name => {
  const file = path.join(dataDir, name);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8'));
};

// ---------- load ----------
let placesFile, pathsFile, buildingsFile;
try {
  placesFile = readJson('places.json');
  pathsFile = readJson('paths.json');
  buildingsFile = readJson('buildings.json');
} catch (e) {
  console.error(`Could not read data files in ${dataDir}: ${e.message}`);
  process.exit(1);
}
if (!placesFile || !pathsFile) {
  console.error(`places.json and paths.json must both exist in ${dataDir}`);
  process.exit(1);
}

const places = placesFile.places ?? [];
const paths = (pathsFile.paths ?? []).map(p => (Array.isArray(p) ? { points: p, steps: false } : p));
const buildings = buildingsFile?.buildings ?? [];

// Category names come from the app's own list so the two cannot drift.
let CATEGORIES = null;
try {
  const src = readFileSync(path.join(here, '../src/lib/categories.js'), 'utf8');
  const block = src.match(/export const CATEGORIES = \{([\s\S]*?)\n\};/)?.[1];
  if (block) CATEGORIES = new Set([...block.matchAll(/^\s{2}(\w+):/gm)].map(m => m[1]));
} catch { /* category check is skipped if the file cannot be read */ }

// ---------- helpers ----------
const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);

const validLat = v => typeof v === 'number' && v >= -90 && v <= 90;
const validLng = v => typeof v === 'number' && v >= -180 && v <= 180;

function distance(a, b) {
  const R = 6371000, r = d => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const key = (lat, lng) => `${lat.toFixed(6)},${lng.toFixed(6)}`;
const fmt = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

// ---------- places ----------
const seen = new Map();
const centre = placesFile.center
  ? { lat: placesFile.center.lat ?? placesFile.center[0], lng: placesFile.center.lng ?? placesFile.center[1] }
  : null;

for (const p of places) {
  const tag = `place "${p?.id ?? p?.name ?? '?'}"`;
  if (!p?.id) { err(`A place has no id (name: ${p?.name ?? 'none'}).`); continue; }
  if (seen.has(p.id)) err(`Duplicate place id "${p.id}".`);
  seen.set(p.id, p);

  if (!p.name) err(`${tag} has no name.`);
  if (!validLat(p.lat) || !validLng(p.lng)) { err(`${tag} has invalid coordinates.`); continue; }
  if (CATEGORIES && !CATEGORIES.has(p.category)) {
    err(`${tag} has unknown category "${p.category}" (known: ${[...CATEGORIES].join(', ')}).`);
  }
  if (!['confirmed', 'likely', 'guess'].includes(p.confidence)) {
    err(`${tag} has confidence "${p.confidence}"; use confirmed, likely or guess.`);
  }
  for (const lang of ['name_kn', 'name_hi']) {
    if (!p[lang]) warn(`${tag} has no ${lang} (Kannada/Hindi name).`);
  }
  if (centre && distance(centre, p) > FAR_FROM_CAMPUS_KM * 1000) {
    warn(`${tag} is ${(distance(centre, p) / 1000).toFixed(1)} km from the campus centre. Correct if it is off-campus on purpose (e.g. a bus stand); otherwise check the coordinates.`);
  }
}

const valid = places.filter(p => validLat(p?.lat) && validLng(p?.lng));
for (let i = 0; i < valid.length; i++) {
  for (let j = i + 1; j < valid.length; j++) {
    const d = distance(valid[i], valid[j]);
    if (d < 8) warn(`Places "${valid[i].id}" and "${valid[j].id}" are only ${d.toFixed(1)} m apart. Are they really separate places, or a duplicate?`);
  }
}

// ---------- paths ----------
const nodes = new Map(); // key -> { lat, lng, edges: Set<key>, paths: Set<index> }
const segments = [];     // for the crossing check

paths.forEach((p, idx) => {
  const label = `path #${idx + 1}`;
  if (!Array.isArray(p.points) || p.points.length < 2) {
    err(`${label} has fewer than 2 points, so it can never be part of a route.`);
    return;
  }
  let usable = true;
  p.points.forEach(pt => {
    if (!Array.isArray(pt) || !validLat(pt[0]) || !validLng(pt[1])) usable = false;
  });
  if (!usable) { err(`${label} has an invalid point.`); return; }

  for (let i = 0; i < p.points.length; i++) {
    const [lat, lng] = p.points[i];
    const k = key(lat, lng);
    if (!nodes.has(k)) nodes.set(k, { lat, lng, edges: new Set(), paths: new Set() });
    nodes.get(k).paths.add(idx);

    if (i === 0) continue;
    const [pl, pg] = p.points[i - 1];
    const pk = key(pl, pg);
    if (pk === k) { warn(`${label} repeats the same point twice in a row (${fmt(lat, lng)}).`); continue; }
    nodes.get(k).edges.add(pk);
    nodes.get(pk).edges.add(k);

    const len = distance({ lat: pl, lng: pg }, { lat, lng });
    if (len > LONG_SEGMENT_M) {
      warn(`${label} has a ${Math.round(len)} m straight stretch. Add points along it or the line will cut corners.`);
    }
    segments.push({ idx, a: { lat: pl, lng: pg }, b: { lat, lng }, ka: pk, kb: k });
  }
});

// Connected components, using the router's exact-match joining.
const component = new Map();
let compCount = 0;
for (const startKey of nodes.keys()) {
  if (component.has(startKey)) continue;
  const stack = [startKey];
  component.set(startKey, compCount);
  while (stack.length) {
    const cur = stack.pop();
    for (const nxt of nodes.get(cur).edges) {
      if (!component.has(nxt)) { component.set(nxt, compCount); stack.push(nxt); }
    }
  }
  compCount++;
}
const compSize = new Array(compCount).fill(0);
for (const c of component.values()) compSize[c]++;
const mainComp = compSize.length ? compSize.indexOf(Math.max(...compSize)) : -1;

if (compCount > 1) {
  warn(`The footpath network is in ${compCount} separate pieces. Routes cannot cross between pieces. Connect them at a shared junction point.`);
}

// Near-miss junctions: two different vertices a few metres apart.
const nodeList = [...nodes.entries()];
const nearMisses = [];
for (let i = 0; i < nodeList.length; i++) {
  for (let j = i + 1; j < nodeList.length; j++) {
    const [ka, a] = nodeList[i];
    const [kb, b] = nodeList[j];
    if (nodes.get(ka).edges.has(kb)) continue; // consecutive points on one path, fine
    const d = distance(a, b);
    if (d > 0 && d <= NEAR_MISS_M) nearMisses.push({ a, b, d });
  }
}
nearMisses.slice(0, 10).forEach(({ a, b, d }) =>
  warn(`Two path points ${d.toFixed(1)} m apart look like a missed junction: (${fmt(a.lat, a.lng)}) and (${fmt(b.lat, b.lng)}). If these paths meet, re-trace so they share one point.`)
);
if (nearMisses.length > 10) warn(`...and ${nearMisses.length - 10} more near-miss junctions.`);

// Paths that cross mid-segment without a shared point.
function cross(p, q, r, s) {
  const lat0 = p.lat;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110540;
  const P = [p.lng * kx, p.lat * ky], Q = [q.lng * kx, q.lat * ky];
  const R = [r.lng * kx, r.lat * ky], S = [s.lng * kx, s.lat * ky];
  const d1 = [Q[0] - P[0], Q[1] - P[1]], d2 = [S[0] - R[0], S[1] - R[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-9) return false;
  const t = ((R[0] - P[0]) * d2[1] - (R[1] - P[1]) * d2[0]) / den;
  const u = ((R[0] - P[0]) * d1[1] - (R[1] - P[1]) * d1[0]) / den;
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}
let crossings = 0;
for (let i = 0; i < segments.length; i++) {
  for (let j = i + 1; j < segments.length; j++) {
    const s1 = segments[i], s2 = segments[j];
    if (s1.idx === s2.idx) continue;
    if (cross(s1.a, s1.b, s2.a, s2.b)) {
      if (++crossings <= 10) {
        warn(`Path #${s1.idx + 1} and path #${s2.idx + 1} cross near (${fmt(s1.a.lat, s1.a.lng)}) with no shared junction, so a walker cannot switch between them there.`);
      }
    }
  }
}
if (crossings > 10) warn(`...and ${crossings - 10} more crossings without a junction.`);

// ---------- places vs network ----------
const snapped = valid.map(p => {
  let best = null, bestD = Infinity;
  for (const [k, n] of nodes) {
    const d = distance(p, n);
    if (d < bestD) { bestD = d; best = k; }
  }
  return { p, node: best, away: bestD, comp: best ? component.get(best) : -1 };
});

if (!nodes.size) {
  warn('There are no footpaths yet, so every route falls back to OpenStreetMap or a straight line.');
}

const onNetwork = snapped.filter(s => s.node && s.away <= OFF_NETWORK_M);
for (const s of snapped) {
  if (!s.node) continue;
  if (s.away > OFF_NETWORK_M) {
    warn(`"${s.p.id}" is ${Math.round(s.away)} m from the nearest footpath, so routes to it start or end off the network. Trace a path to its entrance.`);
  } else if (s.comp !== mainComp && compCount > 1) {
    warn(`"${s.p.id}" is on a footpath piece that is cut off from the largest connected network.`);
  }
}

// Routable pairs: both ends within the threshold and in the same piece.
let pairs = 0, routable = 0;
for (let i = 0; i < snapped.length; i++) {
  for (let j = i + 1; j < snapped.length; j++) {
    pairs++;
    const a = snapped[i], b = snapped[j];
    if (a.node && b.node && a.away <= OFF_NETWORK_M && b.away <= OFF_NETWORK_M && a.comp === b.comp) routable++;
  }
}

// ---------- buildings ----------
const polyArea = pts => {
  const lat0 = pts.reduce((s, q) => s + q[0], 0) / pts.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110540;
  let a = 0;
  pts.forEach((q, i) => {
    const n = pts[(i + 1) % pts.length];
    a += q[1] * kx * (n[0] * ky) - n[1] * kx * (q[0] * ky);
  });
  return Math.abs(a / 2);
};
const bIds = new Set();
const linked = new Set();
for (const b of buildings) {
  const tag = `building "${b?.id ?? '?'}"`;
  if (!b?.id) { err('A building outline has no id.'); continue; }
  if (bIds.has(b.id)) err(`Duplicate building id "${b.id}".`);
  bIds.add(b.id);
  if (!Array.isArray(b.points) || b.points.length < 3) { err(`${tag} has fewer than 3 corners.`); continue; }
  if (b.points.some(q => !Array.isArray(q) || !validLat(q[0]) || !validLng(q[1]))) { err(`${tag} has an invalid corner.`); continue; }
  const area = polyArea(b.points);
  if (area < 20) warn(`${tag} is only ${Math.round(area)} m². Is it traced correctly?`);
  if (area > 40000) warn(`${tag} is ${Math.round(area)} m². Very large. Check for a stray corner.`);
  if (b.placeId) {
    if (!seen.has(b.placeId)) err(`${tag} points to place "${b.placeId}", which does not exist in places.json.`);
    else linked.add(b.placeId);
  } else if (!b.name) {
    warn(`${tag} is not linked to a place and has no name.`);
  }
}

// ---------- report ----------
const confirmed = valid.filter(p => p.confidence === 'confirmed').length;
const guesses = valid.filter(p => p.confidence === 'guess');
const likely = valid.filter(p => p.confidence === 'likely');

const line = (ok, text) => console.log(`${ok ? '  ✓' : '  ·'} ${text}`);
console.log(`\nDSU campus data check  (${dataDir})\n`);
console.log('Coverage');
line(valid.length >= 15, `${valid.length} places (target: 15 to 20)`);
line(guesses.length === 0 && likely.length === 0,
  `${confirmed} confirmed, ${likely.length} likely, ${guesses.length} guess` +
  (guesses.length ? `   guesses: ${guesses.map(p => p.id).join(', ')}` : ''));
line(nodes.size > 0 && onNetwork.length === valid.length,
  `${onNetwork.length} of ${valid.length} places are within ${OFF_NETWORK_M} m of a footpath`);
line(pairs > 0 && routable === pairs,
  `${routable} of ${pairs} place-to-place trips can be routed on your own paths (${pairs ? Math.round((routable / pairs) * 100) : 0}%)`);
line(buildings.length >= valid.length,
  `${buildings.length} building outlines, ${linked.size} linked to a place`);
console.log(`  · ${paths.length} footpaths, ${nodes.size} points, ${compCount} connected piece${compCount === 1 ? '' : 's'}`);

if (errors.length) {
  console.log(`\nErrors (${errors.length}) fix these first:`);
  errors.forEach(e => console.log(`  ✖ ${e}`));
}
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  ⚠ ${w}`));
}
if (!errors.length && !warnings.length) console.log('\nNo problems found.');

console.log(`\n${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.\n`);
process.exit(errors.length ? 1 : 0);
