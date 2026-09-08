import { useState, useEffect, useRef, useMemo } from 'react';
import { buildSteps, trackProgress, remainingDistance } from '../lib/navigate';
import { distance, formatDistance, walkTime } from '../lib/categories';
import { t, placeName } from '../lib/i18n';

const ARROWS = {
  left: '↰', right: '↱', 'sharp-left': '↺', 'sharp-right': '↻', 'u-turn': '⟲', straight: '↑'
};

// Speech synthesis voices vary a lot by device; en-IN/kn-IN/hi-IN are
// requested but the browser silently falls back to whatever it has if a
// locale isn't installed, so this stays best-effort rather than a
// feature the app depends on.
const VOICE_LOCALE = { en: 'en-IN', kn: 'kn-IN', hi: 'hi-IN' };

function say(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE_LOCALE[lang] ?? 'en-IN';
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function instructionText(step, lang) {
  if (step.kind === 'depart') {
    const dir = t('navDir', lang)[step.direction] ?? step.direction;
    return typeof t('navDepart', lang) === 'function' ? t('navDepart', lang)(dir) : `Head ${dir}`;
  }
  if (step.kind === 'arrive') return t('navArrived', lang);
  return t('navTurn', lang)[step.turn] ?? t('navTurn', lang).left;
}

export default function Navigate({ place, coords, position, lang, onClose }) {
  const steps = useMemo(() => buildSteps(coords), [coords]);
  const [index, setIndex] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const lastSpoken = useRef(-1);

  // Voice is opt-in per session and stops cleanly if navigation ends.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    if (!position || !steps.length) return;
    const p = trackProgress(position, steps, index, coords);
    setOffRoute(p.offRoute);
    if (p.index !== index) setIndex(p.index);
  }, [position, steps, coords, index]);

  useEffect(() => {
    if (!voiceOn || index === lastSpoken.current) return;
    lastSpoken.current = index;
    say(instructionText(steps[index], lang), lang);
  }, [index, voiceOn, lang, steps]);

  if (!steps.length) return null;

  const step = steps[index];
  const toNext = position ? distance(position, step.at) : step.metres;
  const remaining = remainingDistance(steps, index, toNext);
  const next = steps[index + 1];
  const arrived = step.kind === 'arrive' && toNext < 12;

  return (
    <div className="navbar">
      <div className="navmain">
        <span className="navarrow">
          {step.kind === 'arrive' ? '🏁' : ARROWS[step.turn ?? 'straight']}
        </span>
        <div className="navtext">
          <strong>{instructionText(step, lang)}</strong>
          {step.kind !== 'arrive' && <span>{formatDistance(toNext)}</span>}
          {step.kind !== 'arrive' && next && next.kind !== 'arrive' && (
            <em>
              {t('navThenContinue', lang)} {formatDistance(next.metres)},{' '}
              {instructionText(next, lang).toLowerCase()}
            </em>
          )}
        </div>
        <button
          className={voiceOn ? 'navvoice on' : 'navvoice'}
          onClick={() => setVoiceOn(v => !v)}
          aria-label="Toggle spoken directions"
          aria-pressed={voiceOn}
        >
          {voiceOn ? '🔊' : '🔇'}
        </button>
        <button className="navclose" onClick={onClose} aria-label="Stop navigation">&times;</button>
      </div>

      {offRoute && !arrived && <p className="navwarn">{t('navOffRoute', lang)}</p>}

      {!arrived && (
        <p className="navremain">
          {formatDistance(remaining)} {t('navRemaining', lang)} · {walkTime(remaining, lang)}
          {place && <> · {placeName(place, lang)}</>}
        </p>
      )}

      {arrived && (
        <button className="navdone" onClick={onClose}>{t('stopNav', lang)}</button>
      )}
    </div>
  );
}
