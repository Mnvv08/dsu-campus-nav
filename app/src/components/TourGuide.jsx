import { useState, useEffect } from 'react';
import { t } from '../lib/i18n';

const SEEN_KEY = 'dsu-tour-seen';

const SLIDES = [
  { icon: '🔎', title: 'tour1Title', body: 'tour1Body' },
  { icon: '🧭', title: 'tour2Title', body: 'tour2Body' },
  { icon: '★',  title: 'tour3Title', body: 'tour3Body' },
  { icon: '💬', title: 'tour4Title', body: 'tour4Body' },
  { icon: '✚',  title: 'tour5Title', body: 'tour5Body' }
];

export function hasSeenTour() {
  return localStorage.getItem(SEEN_KEY) === '1';
}

/**
 * A short slide carousel shown once, on first visit, introducing the
 * app's less-discoverable features. Built as plain modal slides rather
 * than pointing arrows at live map elements — the map already carries a
 * crowded stack of floating UI (legend, help button, trip button,
 * install banner), and precisely targeting real DOM elements across
 * that stack and across mobile/desktop layouts is a lot of fragile
 * positioning code for a feature that only needs to run once per person.
 */
export default function TourGuide({ lang, onClose }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;

  useEffect(() => {
    localStorage.setItem(SEEN_KEY, '1');
  }, []);

  const next = () => (last ? onClose() : setI(i + 1));

  return (
    <div className="tourbackdrop" role="dialog" aria-label={t('tourReplay', lang)}>
      <div className="tourcard">
        <button className="tourskip" onClick={onClose}>{t('tourSkip', lang)}</button>

        <div className="touricon">{SLIDES[i].icon}</div>
        <h2>{t(SLIDES[i].title, lang)}</h2>
        <p>{t(SLIDES[i].body, lang)}</p>

        <div className="tourdots">
          {SLIDES.map((_, idx) => (
            <span key={idx} className={idx === i ? 'tourdot on' : 'tourdot'} />
          ))}
        </div>

        <button className="tournext" onClick={next}>
          {last ? t('tourDone', lang) : t('tourNext', lang)}
        </button>
      </div>
    </div>
  );
}
