// Words for each direction step, in every app language. English names
// the path ("the road along the lake"); the path descriptions exist only
// in English so far, so the other languages give the turn and the
// nearest landmark, which is what people navigate by anyway.
//
// Translations other than English should be checked by a native speaker.

import { placeName } from './i18n';

const TURN = {
  en: { left: 'Turn left', right: 'Turn right', 'slight-left': 'Bear left', 'slight-right': 'Bear right', 'sharp-left': 'Turn sharp left', 'sharp-right': 'Turn sharp right', 'u-turn': 'Turn back', straight: 'Continue straight' },
  kn: { left: 'ಎಡಕ್ಕೆ ತಿರುಗಿ', right: 'ಬಲಕ್ಕೆ ತಿರುಗಿ', 'slight-left': 'ಸ್ವಲ್ಪ ಎಡಕ್ಕೆ ತಿರುಗಿ', 'slight-right': 'ಸ್ವಲ್ಪ ಬಲಕ್ಕೆ ತಿರುಗಿ', 'sharp-left': 'ತೀವ್ರವಾಗಿ ಎಡಕ್ಕೆ ತಿರುಗಿ', 'sharp-right': 'ತೀವ್ರವಾಗಿ ಬಲಕ್ಕೆ ತಿರುಗಿ', 'u-turn': 'ಹಿಂತಿರುಗಿ', straight: 'ನೇರವಾಗಿ ಮುಂದುವರಿಯಿರಿ' },
  hi: { left: 'बाएँ मुड़ें', right: 'दाएँ मुड़ें', 'slight-left': 'थोड़ा बाएँ मुड़ें', 'slight-right': 'थोड़ा दाएँ मुड़ें', 'sharp-left': 'तेज़ बाएँ मुड़ें', 'sharp-right': 'तेज़ दाएँ मुड़ें', 'u-turn': 'वापस मुड़ें', straight: 'सीधे चलते रहें' },
  ta: { left: 'இடதுபுறம் திரும்புங்கள்', right: 'வலதுபுறம் திரும்புங்கள்', 'slight-left': 'சற்று இடதுபுறம் திரும்புங்கள்', 'slight-right': 'சற்று வலதுபுறம் திரும்புங்கள்', 'sharp-left': 'கூர்மையாக இடதுபுறம் திரும்புங்கள்', 'sharp-right': 'கூர்மையாக வலதுபுறம் திரும்புங்கள்', 'u-turn': 'திரும்பிச் செல்லுங்கள்', straight: 'நேராகத் தொடருங்கள்' },
  te: { left: 'ఎడమవైపు తిరగండి', right: 'కుడివైపు తిరగండి', 'slight-left': 'కొంచెం ఎడమవైపు తిరగండి', 'slight-right': 'కొంచెం కుడివైపు తిరగండి', 'sharp-left': 'పదునుగా ఎడమవైపు తిరగండి', 'sharp-right': 'పదునుగా కుడివైపు తిరగండి', 'u-turn': 'వెనక్కి తిరగండి', straight: 'నేరుగా కొనసాగండి' },
  ml: { left: 'ഇടത്തോട്ട് തിരിയുക', right: 'വലത്തോട്ട് തിരിയുക', 'slight-left': 'അൽപ്പം ഇടത്തോട്ട് തിരിയുക', 'slight-right': 'അൽപ്പം വലത്തോട്ട് തിരിയുക', 'sharp-left': 'മൂർച്ചയായി ഇടത്തോട്ട് തിരിയുക', 'sharp-right': 'മൂർച്ചയായി വലത്തോട്ട് തിരിയുക', 'u-turn': 'തിരിച്ചു പോകുക', straight: 'നേരെ തുടരുക' },
  gu: { left: 'ડાબે વળો', right: 'જમણે વળો', 'slight-left': 'થોડા ડાબે વળો', 'slight-right': 'થોડા જમણે વળો', 'sharp-left': 'તીવ્ર ડાબે વળો', 'sharp-right': 'તીવ્ર જમણે વળો', 'u-turn': 'પાછા વળો', straight: 'સીધા આગળ વધો' }
};

// "Near <landmark>, ..." as a prefix in each language.
const NEAR = {
  kn: p => `${p} ಬಳಿ `, hi: p => `${p} के पास `, ta: p => `${p} அருகில் `,
  te: p => `${p} దగ్గర `, ml: p => `${p} അടുത്ത് `, gu: p => `${p} પાસે `
};

const DEPART = {
  kn: { towards: p => `${p} ಕಡೆಗೆ ನಡೆಯಲು ಪ್ರಾರಂಭಿಸಿ`, path: 'ಹತ್ತಿರದ ದಾರಿಗೆ ನಡೆಯಿರಿ', plain: 'ನಡೆಯಲು ಪ್ರಾರಂಭಿಸಿ' },
  hi: { towards: p => `${p} की ओर चलना शुरू करें`, path: 'पास के रास्ते तक चलें', plain: 'चलना शुरू करें' },
  ta: { towards: p => `${p} நோக்கி நடக்கத் தொடங்குங்கள்`, path: 'அருகிலுள்ள பாதைக்கு நடந்து செல்லுங்கள்', plain: 'நடக்கத் தொடங்குங்கள்' },
  te: { towards: p => `${p} వైపు నడవడం ప్రారంభించండి`, path: 'దగ్గరలోని దారికి నడవండి', plain: 'నడవడం ప్రారంభించండి' },
  ml: { towards: p => `${p} ഭാഗത്തേക്ക് നടന്നു തുടങ്ങുക`, path: 'അടുത്തുള്ള വഴിയിലേക്ക് നടക്കുക', plain: 'നടന്നു തുടങ്ങുക' },
  gu: { towards: p => `${p} તરફ ચાલવાનું શરૂ કરો`, path: 'નજીકના રસ્તા સુધી ચાલો', plain: 'ચાલવાનું શરૂ કરો' }
};

const PASS = {
  en: (p, s) => `${p} will be on your ${s}`,
  kn: (p, s) => `${p} ನಿಮ್ಮ ${s === 'left' ? 'ಎಡಭಾಗದಲ್ಲಿ' : 'ಬಲಭಾಗದಲ್ಲಿ'} ಇರುತ್ತದೆ`,
  hi: (p, s) => `${p} आपकी ${s === 'left' ? 'बाईं' : 'दाईं'} ओर होगा`,
  ta: (p, s) => `${p} உங்கள் ${s === 'left' ? 'இடதுபுறம்' : 'வலதுபுறம்'} இருக்கும்`,
  te: (p, s) => `${p} మీ ${s === 'left' ? 'ఎడమవైపు' : 'కుడివైపు'} ఉంటుంది`,
  ml: (p, s) => `${p} നിങ്ങളുടെ ${s === 'left' ? 'ഇടതുവശത്ത്' : 'വലതുവശത്ത്'} ആയിരിക്കും`,
  gu: (p, s) => `${p} તમારી ${s === 'left' ? 'ડાબી' : 'જમણી'} બાજુ હશે`
};

const ARRIVE = {
  en: { left: p => `${p} is on your left`, right: p => `${p} is on your right`, ahead: p => `${p} is straight ahead` },
  kn: { left: p => `${p} ನಿಮ್ಮ ಎಡಭಾಗದಲ್ಲಿದೆ`, right: p => `${p} ನಿಮ್ಮ ಬಲಭಾಗದಲ್ಲಿದೆ`, ahead: p => `${p} ನೇರವಾಗಿ ಮುಂದೆ ಇದೆ` },
  hi: { left: p => `${p} आपकी बाईं ओर है`, right: p => `${p} आपकी दाईं ओर है`, ahead: p => `${p} आपके ठीक सामने है` },
  ta: { left: p => `${p} உங்கள் இடதுபுறம் உள்ளது`, right: p => `${p} உங்கள் வலதுபுறம் உள்ளது`, ahead: p => `${p} நேராக முன்னால் உள்ளது` },
  te: { left: p => `${p} మీ ఎడమవైపు ఉంది`, right: p => `${p} మీ కుడివైపు ఉంది`, ahead: p => `${p} మీ ఎదురుగా ఉంది` },
  ml: { left: p => `${p} നിങ്ങളുടെ ഇടതുവശത്താണ്`, right: p => `${p} നിങ്ങളുടെ വലതുവശത്താണ്`, ahead: p => `${p} നേരെ മുന്നിലാണ്` },
  gu: { left: p => `${p} તમારી ડાબી બાજુ છે`, right: p => `${p} તમારી જમણી બાજુ છે`, ahead: p => `${p} તમારી સામે છે` }
};

const name = (p, lang) => (p ? placeName(p, lang) : null);

// The main instruction for a step.
export function stepText(step, lang) {
  const L = TURN[lang] ? lang : 'en';
  const lm = name(step.landmark, L);

  if (step.kind === 'arrive') {
    const p = name(step.place, L);
    if (!p) return { en: "You've arrived", kn: 'ನೀವು ತಲುಪಿದ್ದೀರಿ', hi: 'आप पहुँच गए', ta: 'நீங்கள் வந்துவிட்டீர்கள்', te: 'మీరు చేరుకున్నారు', ml: 'നിങ്ങൾ എത്തി', gu: 'તમે પહોંચી ગયા' }[L];
    return ARRIVE[L][step.side ?? 'ahead'](p);
  }

  if (L === 'en') {
    if (step.kind === 'depart') {
      const towards = name(step.towards, L);
      if (!step.road && step.nextRoad) return `Walk to ${step.nextRoad}`;
      if (step.road) return `Walk along ${step.road}${towards ? `, towards ${towards}` : ''}`;
      return towards ? `Walk towards ${towards}` : `Head ${step.direction}`;
    }
    const verb = step.kind === 'continue'
      ? (step.road ? 'Continue' : 'Continue straight')
      : TURN.en[step.turn];
    const onto = step.road ? (step.stay ? `, staying on ${step.road}` : ` onto ${step.road}`) : '';
    return lm ? `At ${lm}, ${verb.charAt(0).toLowerCase()}${verb.slice(1)}${onto}` : `${verb}${onto}`;
  }

  if (step.kind === 'depart') {
    const towards = name(step.towards, L);
    if (!step.road && step.nextRoad) return DEPART[L].path;
    return towards ? DEPART[L].towards(towards) : DEPART[L].plain;
  }
  const verb = TURN[L][step.kind === 'continue' ? 'straight' : step.turn];
  return lm ? `${NEAR[L](lm)}${verb}` : verb;
}

// A second line, when there is something worth noticing on the way.
export function stepHint(step, lang) {
  const L = PASS[lang] ? lang : 'en';
  if (!step.pass) return null;
  return PASS[L](name(step.pass.place, L), step.pass.side);
}

// An arrow for the step's icon, rotated by the turn.
export const TURN_DEG = {
  straight: 0, 'slight-left': -40, 'slight-right': 40, left: -90, right: 90,
  'sharp-left': -135, 'sharp-right': 135, 'u-turn': 180
};
