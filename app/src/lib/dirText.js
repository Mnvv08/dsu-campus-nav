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
      if (step.road && step.joinTurn) return `Walk to ${step.road}, then ${TURN.en[step.joinTurn].toLowerCase()}`;
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
    if (step.joinTurn) return `${DEPART[L].path}, ${TURN[L][step.joinTurn]}`;
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

// ---- Full-screen navigation: spoken phrases and labels ----------------

const lower = (s, lang) => (lang === 'en' ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// "In 50 metres, turn left onto ..."
const IN = {
  en: (m, s) => `In ${m} metres, ${s}`,
  kn: (m, s) => `${m} ಮೀಟರ್ ನಂತರ, ${s}`,
  hi: (m, s) => `${m} मीटर बाद, ${s}`,
  ta: (m, s) => `${m} மீட்டரில், ${s}`,
  te: (m, s) => `${m} మీటర్ల తర్వాత, ${s}`,
  ml: (m, s) => `${m} മീറ്റർ കഴിഞ്ഞ്, ${s}`,
  gu: (m, s) => `${m} મીટર પછી, ${s}`
};
export function sayIn(metres, step, lang) {
  const L = IN[lang] ? lang : 'en';
  const m = metres >= 100 ? Math.round(metres / 50) * 50 : Math.max(10, Math.round(metres / 10) * 10);
  // Arrival lines start with the place name, which keeps its capital.
  return IN[L](m, step.kind === 'arrive' ? stepText(step, L) : lower(stepText(step, L), L));
}

const NAV_UI = {
  then: { en: 'Then', kn: 'ನಂತರ', hi: 'फिर', ta: 'பிறகு', te: 'తర్వాత', ml: 'പിന്നെ', gu: 'પછી' },
  rerouting: {
    en: 'Off route. Finding a new route.', kn: 'ದಾರಿ ತಪ್ಪಿದೆ. ಹೊಸ ದಾರಿ ಹುಡುಕುತ್ತಿದೆ.', hi: 'रास्ते से हट गए। नया रास्ता खोजा जा रहा है।',
    ta: 'பாதையை விட்டு விலகிவிட்டீர்கள். புதிய வழி தேடப்படுகிறது.', te: 'దారి తప్పారు. కొత్త దారి వెతుకుతోంది.',
    ml: 'വഴി തെറ്റി. പുതിയ വഴി തിരയുന്നു.', gu: 'રસ્તો ચૂકી ગયા. નવો રસ્તો શોધી રહ્યા છીએ.'
  },
  arrived: {
    en: p => `You have arrived at ${p}`, kn: p => `ನೀವು ${p} ತಲುಪಿದ್ದೀರಿ`, hi: p => `आप ${p} पहुँच गए हैं`,
    ta: p => `நீங்கள் ${p} வந்தடைந்தீர்கள்`, te: p => `మీరు ${p} చేరుకున్నారు`, ml: p => `നിങ്ങൾ ${p} എത്തി`, gu: p => `તમે ${p} પહોંચી ગયા છો`
  },
  start: { en: 'Start', kn: 'ಪ್ರಾರಂಭಿಸಿ', hi: 'शुरू करें', ta: 'தொடங்கு', te: 'ప్రారంభించు', ml: 'ആരംഭിക്കുക', gu: 'શરૂ કરો' },
  preview: { en: 'Preview route', kn: 'ದಾರಿ ನೋಡಿ', hi: 'रास्ता देखें', ta: 'வழியைப் பார்', te: 'దారి చూడండి', ml: 'വഴി കാണുക', gu: 'રસ્તો જુઓ' },
  exit: { en: 'Exit', kn: 'ನಿರ್ಗಮಿಸಿ', hi: 'बाहर निकलें', ta: 'வெளியேறு', te: 'నిష్క్రమించు', ml: 'പുറത്തുകടക്കുക', gu: 'બહાર નીકળો' },
  done: { en: 'Done', kn: 'ಆಯಿತು', hi: 'हो गया', ta: 'முடிந்தது', te: 'పూర్తయింది', ml: 'കഴിഞ്ഞു', gu: 'થઈ ગયું' },
  recentre: { en: 'Re-centre', kn: 'ಮಧ್ಯಕ್ಕೆ', hi: 'वापस केंद्र में', ta: 'மையப்படுத்து', te: 'మధ్యకు', ml: 'മധ്യത്തിലേക്ക്', gu: 'મધ્યમાં' },
  overview: { en: 'Whole route', kn: 'ಪೂರ್ತಿ ದಾರಿ', hi: 'पूरा रास्ता', ta: 'முழு வழி', te: 'మొత్తం దారి', ml: 'മുഴുവൻ വഴി', gu: 'આખો રસ્તો' },
  arrival: { en: 'arrival', kn: 'ತಲುಪುವ ಸಮಯ', hi: 'पहुँचने का समय', ta: 'வருகை', te: 'చేరే సమయం', ml: 'എത്തുന്ന സമയം', gu: 'પહોંચવાનો સમય' },
  min: { en: 'min', kn: 'ನಿಮಿಷ', hi: 'मिनट', ta: 'நிமி', te: 'నిమి', ml: 'മിനിറ്റ്', gu: 'મિનિટ' },
  waiting: {
    en: 'Waiting for your location…', kn: 'ನಿಮ್ಮ ಸ್ಥಳಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ…', hi: 'आपकी जगह का इंतज़ार…',
    ta: 'உங்கள் இருப்பிடத்திற்காகக் காத்திருக்கிறது…', te: 'మీ స్థానం కోసం వేచి ఉంది…', ml: 'നിങ്ങളുടെ സ്ഥലത്തിനായി കാത്തിരിക്കുന്നു…', gu: 'તમારા સ્થાનની રાહ જોવાય છે…'
  }
};
export const navUi = (key, lang) => NAV_UI[key]?.[lang] ?? NAV_UI[key]?.en;
