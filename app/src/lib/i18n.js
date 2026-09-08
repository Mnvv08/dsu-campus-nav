export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिंदी' }
];

const UI = {
  title: {
    en: 'Find your way around DSU',
    kn: 'DSU ಕ್ಯಾಂಪಸ್‌ನಲ್ಲಿ ದಾರಿ ಹುಡುಕಿ',
    hi: 'DSU परिसर में अपना रास्ता खोजें'
  },
  locate: {
    en: 'Show where I am',
    kn: 'ನಾನು ಎಲ್ಲಿದ್ದೇನೆ ತೋರಿಸಿ',
    hi: 'मैं कहाँ हूँ दिखाएँ'
  },
  stopLocate: {
    en: 'Stop tracking',
    kn: 'ಟ್ರ್ಯಾಕಿಂಗ್ ನಿಲ್ಲಿಸಿ',
    hi: 'ट्रैकिंग रोकें'
  },
  searchHint: {
    en: "Try 'where do I pay fees' or 'canteen'",
    kn: 'ಉದಾ: ಶುಲ್ಕ ಎಲ್ಲಿ ಕಟ್ಟಬೇಕು, ಅಥವಾ ಕ್ಯಾಂಟೀನ್',
    hi: 'जैसे: फीस कहाँ जमा करें, या कैंटीन'
  },
  all: { en: 'All', kn: 'ಎಲ್ಲಾ', hi: 'सभी' },
  walkThere: {
    en: 'Walk me there',
    kn: 'ಅಲ್ಲಿಗೆ ದಾರಿ ತೋರಿಸಿ',
    hi: 'वहाँ का रास्ता दिखाएँ'
  },
  hideRoute: {
    en: 'Hide directions',
    kn: 'ದಾರಿ ಮರೆಮಾಡಿ',
    hi: 'रास्ता छिपाएँ'
  },
  needLocation: {
    en: 'Turn on location to get walking directions.',
    kn: 'ನಡೆಯುವ ದಾರಿ ಪಡೆಯಲು ಸ್ಥಳ ಸೇವೆ ಆನ್ ಮಾಡಿ.',
    hi: 'पैदल रास्ता पाने के लिए लोकेशन चालू करें।'
  },
  unverified: { en: 'unverified', kn: 'ಪರಿಶೀಲಿಸಿಲ್ಲ', hi: 'असत्यापित' },
  unverifiedWarn: {
    en: 'This location has not been verified yet. Ask someone nearby if it does not look right.',
    kn: 'ಈ ಸ್ಥಳವನ್ನು ಇನ್ನೂ ಪರಿಶೀಲಿಸಿಲ್ಲ. ಸರಿ ಅನಿಸದಿದ್ದರೆ ಹತ್ತಿರದವರನ್ನು ಕೇಳಿ.',
    hi: 'यह स्थान अभी सत्यापित नहीं है। ठीक न लगे तो पास में किसी से पूछें।'
  },
  alsoCalled: { en: 'Also called', kn: 'ಇದನ್ನು ಹೀಗೂ ಕರೆಯುತ್ತಾರೆ', hi: 'इसे यह भी कहते हैं' },
  report: {
    en: 'Something wrong here? Tell us',
    kn: 'ಇಲ್ಲಿ ಏನಾದರೂ ತಪ್ಪಿದೆಯೇ? ತಿಳಿಸಿ',
    hi: 'यहाँ कुछ गलत है? हमें बताएँ'
  },
  noMatch: {
    en: 'Nothing on the map matches that yet.',
    kn: 'ಅದಕ್ಕೆ ಹೊಂದುವ ಸ್ಥಳ ಇನ್ನೂ ನಕ್ಷೆಯಲ್ಲಿ ಇಲ್ಲ.',
    hi: 'नक्शे पर अभी उससे मेल खाता कुछ नहीं है।'
  },
  noMatchHelp: {
    en: 'Try a shorter word, or describe what you need to do instead of the building name.',
    kn: 'ಚಿಕ್ಕ ಪದ ಬಳಸಿ, ಅಥವಾ ಕಟ್ಟಡದ ಹೆಸರಿನ ಬದಲು ನಿಮಗೆ ಏನು ಬೇಕು ಎಂದು ಬರೆಯಿರಿ.',
    hi: 'छोटा शब्द आज़माएँ, या इमारत के नाम की जगह लिखें कि आपको क्या करना है।'
  },
  taskNotMapped: {
    en: 'This kind of place has not been recorded on the map yet. Ask at the main gate.',
    kn: 'ಈ ರೀತಿಯ ಸ್ಥಳವನ್ನು ಇನ್ನೂ ನಕ್ಷೆಗೆ ಸೇರಿಸಿಲ್ಲ. ಮುಖ್ಯ ಗೇಟ್‌ನಲ್ಲಿ ಕೇಳಿ.',
    hi: 'इस तरह की जगह अभी नक्शे में दर्ज नहीं है। मुख्य द्वार पर पूछें।'
  },
  offCampus: {
    en: 'You are outside the campus right now. Distances below are measured from where you are.',
    kn: 'ನೀವು ಈಗ ಕ್ಯಾಂಪಸ್‌ನ ಹೊರಗಿದ್ದೀರಿ. ಕೆಳಗಿನ ದೂರಗಳು ನೀವಿರುವ ಜಾಗದಿಂದ.',
    hi: 'आप अभी परिसर के बाहर हैं। नीचे दी दूरियाँ आपकी वर्तमान जगह से हैं।'
  },
  straightLine: {
    en: 'straight line only, no path mapped here yet',
    kn: 'ನೇರ ಗೆರೆ ಮಾತ್ರ, ಇಲ್ಲಿ ದಾರಿ ಇನ್ನೂ ಗುರುತಿಸಿಲ್ಲ',
    hi: 'केवल सीधी रेखा, यहाँ रास्ता अभी दर्ज नहीं'
  },
  denied: {
    en: 'Location permission was denied. Enable it in your browser settings to see where you are.',
    kn: 'ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಆನ್ ಮಾಡಿ.',
    hi: 'लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग्स में इसे चालू करें।'
  },
  weakSignal: {
    en: 'Your location could not be found. Signal is weak in parts of the campus.',
    kn: 'ನಿಮ್ಮ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಕ್ಯಾಂಪಸ್‌ನ ಕೆಲ ಭಾಗಗಳಲ್ಲಿ ಸಿಗ್ನಲ್ ದುರ್ಬಲ.',
    hi: 'आपकी लोकेशन नहीं मिली। परिसर के कुछ हिस्सों में सिग्नल कमज़ोर है।'
  },
  noGeo: {
    en: 'This browser cannot share your location.',
    kn: 'ಈ ಬ್ರೌಸರ್ ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹಂಚಲು ಸಾಧ್ಯವಿಲ್ಲ.',
    hi: 'यह ब्राउज़र आपकी लोकेशन साझा नहीं कर सकता।'
  },
  avoidSteps: { en: 'Avoid stairs', kn: 'ಮೆಟ್ಟಿಲು ತಪ್ಪಿಸಿ', hi: 'सीढ़ियाँ न लें' },
  noStepFree: {
    en: 'No step-free route is mapped here yet, so this one uses stairs.',
    kn: 'ಇಲ್ಲಿ ಮೆಟ್ಟಿಲಿಲ್ಲದ ದಾರಿ ಇನ್ನೂ ಗುರುತಿಸಿಲ್ಲ, ಹಾಗಾಗಿ ಈ ದಾರಿಯಲ್ಲಿ ಮೆಟ್ಟಿಲುಗಳಿವೆ.',
    hi: 'यहाँ बिना सीढ़ी का रास्ता अभी दर्ज नहीं है, इसलिए इस रास्ते में सीढ़ियाँ हैं।'
  },
  floor: { en: 'Floor', kn: 'ಮಹಡಿ', hi: 'मंज़िल' },
  ground: { en: 'Ground floor', kn: 'ನೆಲ ಮಹಡಿ', hi: 'भूतल' },
  inside: { en: 'Inside this building', kn: 'ಈ ಕಟ್ಟಡದ ಒಳಗೆ', hi: 'इस इमारत के अंदर' },
  youAreAt: {
    en: 'You scanned the sign at',
    kn: 'ನೀವು ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ಫಲಕ:',
    hi: 'आपने यहाँ का बोर्ड स्कैन किया:'
  },
  notHere: { en: 'Not here', kn: 'ಇಲ್ಲಿ ಅಲ್ಲ', hi: 'यहाँ नहीं' },
  minWalk: { en: 'min walk', kn: 'ನಿಮಿಷ ನಡಿಗೆ', hi: 'मिनट पैदल' },
  underMinute: { en: 'under a minute', kn: 'ಒಂದು ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ', hi: 'एक मिनट से कम' }
};

const CATEGORY_LABELS = {
  gate:      { en: 'Gates',     kn: 'ಗೇಟ್‌ಗಳು',      hi: 'द्वार' },
  admin:     { en: 'Offices',   kn: 'ಕಚೇರಿಗಳು',      hi: 'कार्यालय' },
  academic:  { en: 'Academic',  kn: 'ಶೈಕ್ಷಣಿಕ',       hi: 'शैक्षणिक' },
  library:   { en: 'Library',   kn: 'ಗ್ರಂಥಾಲಯ',      hi: 'पुस्तकालय' },
  hostel:    { en: 'Hostels',   kn: 'ಹಾಸ್ಟೆಲ್‌ಗಳು',   hi: 'छात्रावास' },
  food:      { en: 'Food',      kn: 'ಊಟ',            hi: 'भोजन' },
  medical:   { en: 'Medical',   kn: 'ವೈದ್ಯಕೀಯ',      hi: 'चिकित्सा' },
  sports:    { en: 'Sports',    kn: 'ಕ್ರೀಡೆ',         hi: 'खेल' },
  transport: { en: 'Transport', kn: 'ಸಾರಿಗೆ',        hi: 'परिवहन' },
  parking:   { en: 'Parking',   kn: 'ಪಾರ್ಕಿಂಗ್',      hi: 'पार्किंग' },
  utility:   { en: 'Amenities', kn: 'ಸೌಲಭ್ಯಗಳು',     hi: 'सुविधाएँ' },
  landmark:  { en: 'Landmarks', kn: 'ಗುರುತುಗಳು',     hi: 'स्थल चिह्न' }
};

export const t = (key, lang) => UI[key]?.[lang] ?? UI[key]?.en ?? key;

export const categoryLabel = (cat, lang) =>
  CATEGORY_LABELS[cat]?.[lang] ?? CATEGORY_LABELS[cat]?.en ?? 'Other';

// Place names come from the dataset, not from here. A translated name is
// used when one has been recorded; otherwise the English name shows
// through. A missing translation should never blank out a building.
export const placeName = (place, lang) =>
  (lang !== 'en' && place[`name_${lang}`]) || place.name;

export const placeNotes = (place, lang) =>
  (lang !== 'en' && place[`notes_${lang}`]) || place.notes;

// Task text is authored per language in tasks.json.
export const taskText = (task, field, lang) =>
  task[field]?.[lang] ?? task[field]?.en ?? '';

// Floors are ordered ground, 1, 2 … and labelled per language.
export function floorLabel(n, lang) {
  if (n === 0 || n === undefined || n === null) return t('ground', lang);
  return `${t('floor', lang)} ${n}`;
}

export function detectLanguage() {
  const saved = localStorage.getItem('dsu-lang');
  if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGUAGES.some(l => l.code === nav) ? nav : 'en';
}
