import { useState } from 'react';
import { t, placeName } from '../lib/i18n';

// Real, verifiable numbers only. India's unified emergency number (112)
// covers police, fire and ambulance; 108 is the dedicated ambulance
// line used across most states including Karnataka. The university
// line is the number Google has listed for the campus itself — not
// claimed to be a security desk or a 24-hour line, because there is no
// evidence it is one, and overstating that in an emergency tool would
// be actively dangerous rather than just wrong.
const NATIONAL = [
  { key: 'emergencyUnified', number: '112' },
  { key: 'emergencyAmbulance', number: '108' },
  { key: 'emergencyPolice', number: '100' }
];
const CAMPUS_LINE = '+918049092924';
const CAMPUS_LINE_DISPLAY = '+91 80 4909 2924';

export default function EmergencyButton({ places, lang, onShowHospital }) {
  const [open, setOpen] = useState(false);
  const hospital = places.find(p => p.id === 'cdsimer');

  return (
    <>
      <button
        className="sosbtn"
        onClick={() => setOpen(true)}
        aria-label={t('emergencyBtn', lang)}
      >
        <span className="sosicon">✚</span> {t('emergencyBtn', lang)}
      </button>

      {open && (
        <div className="sospanel" role="dialog" aria-label={t('emergencyTitle', lang)}>
          <div className="sosheader">
            <h2>{t('emergencyTitle', lang)}</h2>
            <button className="close" onClick={() => setOpen(false)} aria-label={t('emergencyClose', lang)}>
              &times;
            </button>
          </div>

          <p className="sosintro">{t('emergencyIntro', lang)}</p>

          <div className="sosgroup">
            <span className="soslabel">{t('emergencyNationalLabel', lang)}</span>
            <div className="soscalls">
              {NATIONAL.map(n => (
                <a key={n.key} className="soscall" href={`tel:${n.number}`}>
                  <strong>{n.number}</strong>
                  <span>{t(n.key, lang)}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="sosgroup">
            <span className="soslabel">{t('emergencyCampusLabel', lang)}</span>
            <a className="soscall wide" href={`tel:${CAMPUS_LINE}`}>
              <strong>{CAMPUS_LINE_DISPLAY}</strong>
            </a>
            <p className="soshours">{t('emergencyCampusHours', lang)}</p>
          </div>

          {hospital && (
            <div className="sosgroup">
              <span className="soslabel">{t('emergencyHospitalLabel', lang)}</span>
              <div className="soshospital">
                <span>{placeName(hospital, lang)}</span>
                <button
                  className="sosgo"
                  onClick={() => { onShowHospital(hospital); setOpen(false); }}
                >
                  {t('emergencyGoThere', lang)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
