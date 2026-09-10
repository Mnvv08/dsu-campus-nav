import { useMemo, useState } from 'react';
import { planTrip } from '../lib/trip';
import { getSavedTrips, saveTrip, deleteTrip, resolveTrip } from '../lib/savedTrips';
import { t, placeName } from '../lib/i18n';
import { formatDistance, walkTime } from '../lib/categories';

export default function TripPlanner({ graph, origin, stops, places, lang, onRemove, onClear, onShowRoute, onClose, onLoadTrip }) {
  const [saving, setSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savedTrips, setSavedTrips] = useState(getSavedTrips);
  const [loadWarning, setLoadWarning] = useState(null);

  const plan = useMemo(() => {
    if (!origin || stops.length === 0) return null;
    return planTrip(graph, origin, stops);
  }, [graph, origin, stops]);

  const confirmSave = () => {
    if (stops.length === 0) return;
    setSavedTrips(saveTrip(nameDraft, stops.map(s => s.id)));
    setSaving(false);
    setNameDraft('');
  };

  const load = trip => {
    const { stops: resolved, missing } = resolveTrip(trip, places);
    onLoadTrip(resolved);
    setLoadWarning(missing > 0 ? trip.id : null);
  };

  const remove = id => setSavedTrips(deleteTrip(id));

  return (
    <div className="trippanel" role="dialog" aria-label={t('tripTitle', lang)}>
      <div className="tripheader">
        <h2>{t('tripTitle', lang)} {stops.length > 0 && `(${stops.length})`}</h2>
        <button className="close" onClick={onClose} aria-label="Close">&times;</button>
      </div>

      {!origin && <p className="tripempty">{t('tripNeedLocation', lang)}</p>}
      {origin && stops.length === 0 && <p className="tripempty">{t('tripEmpty', lang)}</p>}

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
                <button className="tripremove" onClick={() => onRemove(stop)} aria-label={t('tripRemove', lang)}>
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

          {!saving ? (
            <button className="tripsavebtn" onClick={() => setSaving(true)}>
              ★ {t('tripSaveBtn', lang)}
            </button>
          ) : (
            <div className="tripsaveform">
              <label>{t('tripSaveName', lang)}</label>
              <div className="tripsaverow">
                <input
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmSave()}
                  placeholder={t('tripSaveNamePlaceholder', lang)}
                  autoFocus
                />
                <button className="primary" onClick={confirmSave}>{t('tripSaveBtn', lang)}</button>
              </div>
            </div>
          )}
        </>
      )}

      {savedTrips.length > 0 && (
        <div className="mytripslist">
          <span className="soslabel">{t('mySavedTrips', lang)}</span>
          {savedTrips.map(trip => (
            <div key={trip.id} className="mytrip">
              <span className="mytripname">{trip.name}</span>
              <span className="mytripcount">{trip.placeIds.length}</span>
              <button className="tripminibtn" onClick={() => load(trip)}>{t('tripLoad', lang)}</button>
              <button className="tripminibtn ghost" onClick={() => remove(trip.id)}>{t('tripDelete', lang)}</button>
            </div>
          ))}
          {loadWarning && <p className="tripwarn">{t('tripSomeMissing', lang)}</p>}
        </div>
      )}
    </div>
  );
}
