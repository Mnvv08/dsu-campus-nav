import { useMemo } from 'react';
import { planTrip } from '../lib/trip';
import { t, placeName } from '../lib/i18n';
import { formatDistance, walkTime } from '../lib/categories';

export default function TripPlanner({ graph, origin, stops, lang, onRemove, onClear, onShowRoute, onClose }) {
  const plan = useMemo(() => {
    if (!origin || stops.length === 0) return null;
    return planTrip(graph, origin, stops);
  }, [graph, origin, stops]);

  return (
    <div className="trippanel" role="dialog" aria-label={t('tripTitle', lang)}>
      <div className="tripheader">
        <h2>{t('tripTitle', lang)} {stops.length > 0 && `(${stops.length})`}</h2>
        <button className="close" onClick={onClose} aria-label="Close">&times;</button>
      </div>

      {!origin && (
        <p className="tripempty">{t('tripNeedLocation', lang)}</p>
      )}

      {origin && stops.length === 0 && (
        <p className="tripempty">{t('tripEmpty', lang)}</p>
      )}

      {plan && (
        <>
          <p className="tripnote">
            {plan.optimal ? t('tripOptimalOrder', lang) : t('tripHeuristicOrder', lang)}
          </p>

          <ol className="tripstops">
            {plan.order.map((stop, i) => (
              <li key={stop.id}>
                <span className="tripnum">{i + 1}</span>
                <span className="tripstopname">{placeName(stop, lang)}</span>
                <span className="tripleg">
                  {formatDistance(plan.legs[i].metres)}
                  {plan.legs[i].direct && ' ⚠'}
                </span>
                <button
                  className="tripremove"
                  onClick={() => onRemove(stop)}
                  aria-label={t('tripRemove', lang)}
                >
                  &times;
                </button>
              </li>
            ))}
          </ol>

          {plan.anyDirect && <p className="tripwarn">{t('tripSomeDirect', lang)}</p>}

          <p className="triptotal">
            {formatDistance(plan.totalMetres)} · {walkTime(plan.totalMetres, lang)}
          </p>

          <div className="tripactions">
            <button className="primary" onClick={() => onShowRoute(plan)}>
              {t('tripShowRoute', lang)}
            </button>
            <button className="ghost" onClick={onClear}>{t('tripClear', lang)}</button>
          </div>
        </>
      )}
    </div>
  );
}
