import { useState, useEffect, useRef } from 'react';
import { trackProgress, remainingDistance } from '../lib/navigate';
import { stepText, stepHint } from '../lib/dirText';
import { distance, formatDistance, walkTime } from '../lib/categories';
import { t, placeName, VOICE_LOCALE } from '../lib/i18n';
import StepIcon from './StepIcon';

// Speech synthesis voices vary a lot by device; the locale is requested
// but the browser falls back to whatever it has, so voice stays a
// best-effort extra rather than something the app depends on.
function say(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE_LOCALE[lang] ?? 'en-IN';
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/**
 * Step-by-step directions, one instruction at a time. Back and Next work
 * with no GPS at all, so someone can read the route before setting off or
 * follow it with patchy signal. When `live` is on (the walk starts from
 * the walker's own location), the step also moves on by itself as they
 * reach each turn.
 */
export default function Navigate({ steps, index, onIndex, position, live, coords, lang, place, onClose }) {
  const [offRoute, setOffRoute] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const lastSpoken = useRef(-1);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    if (!live || !position || !steps.length) return;
    const p = trackProgress(position, steps, index, coords);
    setOffRoute(p.offRoute);
    if (p.index !== index) onIndex(p.index);
  }, [live, position, steps, coords, index, onIndex]);

  useEffect(() => {
    if (!voiceOn || index === lastSpoken.current || !steps[index]) return;
    lastSpoken.current = index;
    const hint = stepHint(steps[index], lang);
    say(hint ? `${stepText(steps[index], lang)}. ${hint}` : stepText(steps[index], lang), lang);
  }, [index, voiceOn, lang, steps]);

  if (!steps.length) return null;

  const step = steps[index];
  const last = index === steps.length - 1;
  const toNext = live && position ? distance(position, step.at) : step.metres;
  const remaining = remainingDistance(steps, index, toNext);
  const hint = stepHint(step, lang);

  return (
    <section className="guide" aria-label={t('stepByStep', lang)} aria-live="polite">
      <div className="guidetop">
        <span className="guidecount">{t('stepOf', lang)(index + 1, steps.length)}</span>
        <button
          className={voiceOn ? 'navvoice on' : 'navvoice'}
          onClick={() => setVoiceOn(v => !v)}
          aria-label="Read directions aloud"
          aria-pressed={voiceOn}
        >
          {voiceOn ? '🔊' : '🔇'}
        </button>
        <button className="navclose" onClick={onClose} aria-label="Close step by step">&times;</button>
      </div>

      <div className="guidemain">
        <StepIcon step={step} size="lg" />
        <div className="guidetext">
          <strong>{stepText(step, lang)}</strong>
          {hint && <em>{hint}</em>}
          {!last && <span className="guidedist">{formatDistance(toNext)}</span>}
        </div>
      </div>

      {offRoute && <p className="navwarn">{t('navOffRoute', lang)}</p>}

      <div className="guidenav">
        <button className="ghost" onClick={() => onIndex(index - 1)} disabled={index === 0}>
          ‹ {t('stepBack', lang)}
        </button>
        {last ? (
          <button className="primary" onClick={onClose}>{t('stopNav', lang)}</button>
        ) : (
          <button className="primary" onClick={() => onIndex(index + 1)}>{t('stepNext', lang)} ›</button>
        )}
      </div>

      {!last && (
        <p className="navremain">
          {formatDistance(remaining)} {t('navRemaining', lang)} · {walkTime(remaining, lang)}
          {place && <> · {placeName(place, lang)}</>}
        </p>
      )}
    </section>
  );
}
