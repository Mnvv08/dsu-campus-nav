import { labelFor } from './categories';

const norm = s =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const tokens = s => norm(s).split(' ').filter(Boolean);

// Words that carry no signal in a campus search. Dropping them stops
// "where is the block" from scoring every building equally.
const STOP = new Set([
  'where', 'is', 'the', 'a', 'an', 'i', 'can', 'do', 'to', 'go', 'my', 'me',
  'of', 'at', 'in', 'for', 'how', 'get', 'find', 'need', 'want', 'place', 'dsu'
]);

// Edit distance capped at 2 — anything further apart is a different word,
// and bailing early keeps this cheap enough to run on every keystroke.
function within(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
}

// Typo tolerance scales with word length: short words are too easy to
// turn into other real words, so they demand an exact match.
function fuzzy(q, target) {
  if (target.startsWith(q)) return true;
  if (q.length < 4) return false;
  return within(q, target, q.length > 6 ? 2 : 1);
}

function fieldHit(qToken, text) {
  const words = tokens(text);
  for (const w of words) {
    if (w === qToken) return 1;
    if (w.startsWith(qToken)) return 0.8;
    if (fuzzy(qToken, w)) return 0.5;
  }
  return 0;
}

export function searchPlaces(query, places, tasks) {
  const qTokens = tokens(query).filter(t => !STOP.has(t));
  if (qTokens.length === 0) return { results: [], task: null };

  // An intent match reframes the whole search: if someone asks about
  // fees, every admin building becomes relevant, named or not.
  const task = tasks.find(t =>
    qTokens.some(qt => t.keywords.some(k => fieldHit(qt, k) >= 0.8))
  ) ?? null;

  const scored = places.map(p => {
    let score = 0;

    for (const qt of qTokens) {
      score += fieldHit(qt, p.name) * 10;
      for (const a of p.aliases ?? []) score += fieldHit(qt, a) * 8;
      score += fieldHit(qt, labelFor(p.category)) * 4;
      if (p.notes) score += fieldHit(qt, p.notes) * 2;
    }

    // Category boost from the matched intent, so a task query surfaces
    // the right kind of place even with no textual overlap at all.
    if (task && p.category === task.category) score += 6;

    // Verified places win ties. A confident wrong answer is the
    // failure mode this app most needs to avoid.
    if (score > 0 && p.confidence === 'confirmed') score += 0.5;

    return { place: p, score };
  });

  const results = scored
    .filter(s => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .map(s => s.place);

  return { results, task };
}
