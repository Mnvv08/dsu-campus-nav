import { useState, useRef, useEffect } from 'react';
import { t, placeName } from '../lib/i18n';

const ENDPOINT = import.meta.env.VITE_CHAT_URL ?? '';

// Only the fields the model needs. Sending the whole file would waste
// tokens on coordinates precision and internal ids nobody reads.
const forModel = places =>
  places.map(p => ({
    name: p.name,
    aliases: p.aliases,
    category: p.category,
    confidence: p.confidence,
    notes: p.notes,
    units: p.units,
    lat: p.lat,
    lng: p.lng
  }));

export default function Chat({ places, lang, onClose, onMention }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;

    if (!ENDPOINT) {
      setError(t('chatUnset', lang));
      return;
    }

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, places: forModel(places) })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? t('chatFailed', lang));
        setBusy(false);
        return;
      }

      setMessages([...next, { role: 'assistant', content: data.reply }]);

      // If the answer names a mapped place, drop a pin on it. Reading a
      // direction is less useful than seeing where it is.
      const named = places.find(p =>
        (data.reply ?? '').toLowerCase().includes(p.name.toLowerCase())
      );
      if (named) onMention?.(named);
    } catch {
      setError(t('chatOffline', lang));
    }

    setBusy(false);
  }

  return (
    <div className="chat">
      <header>
        <h2>{t('chatTitle', lang)}</h2>
        <button className="close" onClick={onClose} aria-label="Close">&times;</button>
      </header>

      <div className="log">
        {messages.length === 0 && (
          <div className="chatempty">
            <p>{t('chatIntro', lang)}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'bubble me' : 'bubble them'}>
            {m.content}
          </div>
        ))}

        {busy && <div className="bubble them typing">…</div>}
        {error && <p className="chaterror">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="compose">
        <input
          ref={inputRef}
          value={draft}
          maxLength={500}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={t('chatPlaceholder', lang)}
          aria-label={t('chatTitle', lang)}
        />
        <button className="primary" onClick={send} disabled={busy || !draft.trim()}>
          {t('chatSend', lang)}
        </button>
      </div>
    </div>
  );
}
