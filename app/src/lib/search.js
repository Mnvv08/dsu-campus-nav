import { categoryLabel, placeName, placeNotes } from './i18n';

// Unicode-aware: stripping to a-z would silently delete Kannada and
// Devanagari input entirely, so the classes have to be \p{L} and \p{N}.
//
// Three things matter here, and getting any of them wrong silently
// breaks Indic search while leaving English working:
//   \p{M}  — the virama and vowel signs are combining marks, not
//            letters. Dropping them shatters a word like ಎಲ್ಲಿ into
//            fragments that prefix-match almost everything.
//   ZWJ/ZWNJ — carry conjunct information in both scripts.
//   NFC, not NFKD — decomposing splits vowel signs off their base
//            consonant and reintroduces the same problem.
const norm = s =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\p{M}\u200c\u200d\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = s => norm(s).split(' ').filter(Boolean);

// Words carrying no signal in a campus search, per language. Normalised
// through the same pipeline as queries, or the comparison silently fails
// for any script where the two forms differ.
const STOP = new Set(([
  'where', 'is', 'the', 'a', 'an', 'i', 'can', 'do', 'to', 'go', 'my', 'me',
  'of', 'at', 'in', 'for', 'how', 'get', 'find', 'need', 'want', 'place', 'dsu',
  'ಎಲ್ಲಿ', 'ಇದೆ', 'ನಾನು', 'ನನಗೆ', 'ಹೇಗೆ', 'ಬೇಕು',
  'कहाँ', 'कहां', 'है', 'मैं', 'मुझे', 'कैसे', 'चाहिए', 'का', 'की', 'के'
]).map(w => w.normalize('NFC').toLowerCase()));

// Edit distance capped at 2; bailing early keeps this cheap enough to
// run on every keystroke.
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

// Indic scripts carry more meaning per character than Latin, and vowel
// signs are separate code points, so a loose edit distance produces
// false matches. Fuzziness is limited to Latin input.
const isLatin = s => /^[a-z0-9]+$/.test(s);

function fuzzy(q, target) {
  if (target.startsWith(q)) return true;
  if (!isLatin(q) || !isLatin(target)) return false;
  if (q.length < 4) return false;
  return within(q, target, q.length > 6 ? 2 : 1);
}

function fieldHit(qToken, text) {
  if (!text) return 0;
  // A two-character prefix means far less in an abugida than in Latin,
  // where it rules out most of the dictionary. Require more of the word.
  const minPrefix = isLatin(qToken) ? 2 : 4;
  for (const w of tokens(text)) {
    if (w === qToken) return 1;
    if (qToken.length >= minPrefix && w.startsWith(qToken)) return 0.8;
    if (fuzzy(qToken, w)) return 0.5;
  }
  return 0;
}

export function searchPlaces(query, places, tasks, lang = 'en') {
  const qTokens = tokens(query).filter(t => !STOP.has(t));
  if (qTokens.length === 0) return { results: [], task: null };

  // Intent keywords are checked across every language, so a mixed query
  // like "canteen ಎಲ್ಲಿ" still resolves.
  const task = tasks.find(t =>
    qTokens.some(qt =>
      Object.values(t.keywords).flat().some(k => fieldHit(qt, k) >= 0.8)
    )
  ) ?? null;

  const scored = places.map(p => {
    let score = 0;

    for (const qt of qTokens) {
      // Both the English name and any translation are searchable, so a
      // Kannada speaker and an English speaker find the same building.
      score += fieldHit(qt, p.name) * 10;
      for (const code of ['kn', 'hi']) {
        if (p[`name_${code}`]) score += fieldHit(qt, p[`name_${code}`]) * 10;
      }
      for (const a of p.aliases ?? []) score += fieldHit(qt, a) * 8;
      score += fieldHit(qt, categoryLabel(p.category, lang)) * 4;
      score += fieldHit(qt, categoryLabel(p.category, 'en')) * 3;
      score += fieldHit(qt, placeNotes(p, lang)) * 2;
    }

    if (task && p.category === task.category) score += 6;

    // Verified places win ties. A confident wrong answer is the failure
    // mode this app most needs to avoid.
    if (score > 0 && p.confidence === 'confirmed') score += 0.5;

    return { place: p, score };
  });

  return {
    results: scored
      .filter(s => s.score > 1)
      .sort((a, b) => b.score - a.score)
      .map(s => s.place),
    task
  };
}

export { placeName };
