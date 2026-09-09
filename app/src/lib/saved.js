const KEY = 'dsu-saved-places';

// Saved places are personal to this device — plain localStorage, same
// pattern already used for the language preference. This is a real
// deployed app, not a sandboxed artifact, so browser storage is fine.
export function getSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isSaved(id, saved) {
  return saved.includes(id);
}

export function toggleSaved(id, saved) {
  const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can fail in private browsing on some devices — the toggle
    // still works for the current session, it just won't persist.
  }
  return next;
}
