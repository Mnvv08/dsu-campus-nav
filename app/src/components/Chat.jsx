import { useState, useRef, useEffect, useCallback } from 'react';
import { t, VOICE_LOCALE } from '../lib/i18n';

const ENDPOINT = import.meta.env.VITE_CHAT_URL ?? '';

// The Worker builds the assistant's place list from its own bundled copy of
// places.json, so only the conversation is sent. Sending places from the
// browser was how the old Worker could be fed fake instructions.

export default function Chat({ places, lang, onClose, onMention }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const recogRef = useRef(null);

  // Feature-detected once — Safari and Firefox don't implement this, so
  // the mic button simply doesn't render there rather than appearing and
  // failing when tapped.
  const SpeechRecognitionAPI =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError(t('micUnsupported', lang));
      return;
    }
    const recog = new SpeechRecognitionAPI();
    recog.lang = VOICE_LOCALE[lang] ?? 'en-IN';
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => { setListening(true); setError(null); };
    recog.onerror = (e) => {
      setListening(false);
      setError(e.error === 'not-allowed' ? t('micDenied', lang) : t('micUnsupported', lang));
    };
    recog.onend = () => setListening(false);
    recog.onresult = (e) => {
      // Fill the box rather than auto-sending — speech recognition
      // mishears often enough that a person should see what it heard
      // before it goes anywhere, especially for a place name it's never
      // seen written down.
      const heard = e.results[0][0].transcript;
      setDraft(heard);
      inputRef.current?.focus();
    };

    recogRef.current = recog;
    recog.start();
  }, [lang, SpeechRecognitionAPI]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Stop any live recognition session if the chat panel closes mid-listen.
  useEffect(() => () => recogRef.current?.stop(), []);

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
        body: JSON.stringify({ messages: next })
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
        {SpeechRecognitionAPI && (
          <button
            type="button"
            className={listening ? 'mic on' : 'mic'}
            onClick={listening ? stopListening : startListening}
            aria-label={t('micStart', lang)}
            aria-pressed={listening}
            title={t('micStart', lang)}
          >
            🎤
          </button>
        )}
        <input
          ref={inputRef}
          value={draft}
          maxLength={500}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={listening ? t('micListening', lang) : t('chatPlaceholder', lang)}
          aria-label={t('chatTitle', lang)}
        />
        <button className="primary" onClick={send} disabled={busy || !draft.trim()}>
          {t('chatSend', lang)}
        </button>
      </div>
    </div>
  );
}
