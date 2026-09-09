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
  installTitle: {
    en: 'Add this to your home screen',
    kn: 'ಇದನ್ನು ನಿಮ್ಮ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ',
    hi: 'इसे अपनी होम स्क्रीन पर जोड़ें'
  },
  installBody: {
    en: 'Opens full-screen next time, like a real app — no address bar.',
    kn: 'ಮುಂದಿನ ಬಾರಿ ಪೂರ್ಣ ಪರದೆಯಲ್ಲಿ ತೆರೆಯುತ್ತದೆ, ನಿಜವಾದ ಆಪ್‌ನಂತೆ.',
    hi: 'अगली बार यह पूरी स्क्रीन पर खुलेगा, असली ऐप की तरह।'
  },
  installBtn: { en: 'Add to Home Screen', kn: 'ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ', hi: 'होम स्क्रीन पर जोड़ें' },
  installIOS: {
    en: 'Tap the Share button below, then "Add to Home Screen".',
    kn: 'ಕೆಳಗಿನ ಶೇರ್ ಬಟನ್ ಒತ್ತಿ, ನಂತರ "Add to Home Screen" ಆಯ್ಕೆಮಾಡಿ.',
    hi: 'नीचे शेयर बटन दबाएँ, फिर "Add to Home Screen" चुनें।'
  },
  installLater: { en: 'Not now', kn: 'ಈಗ ಬೇಡ', hi: 'अभी नहीं' },
  saved: { en: 'Saved', kn: 'ಉಳಿಸಿದವು', hi: 'सहेजे गए' },
  save: { en: 'Save', kn: 'ಉಳಿಸಿ', hi: 'सहेजें' },
  saved_action: { en: 'Saved', kn: 'ಉಳಿಸಲಾಗಿದೆ', hi: 'सहेजा गया' },
  unsave: { en: 'Remove', kn: 'ತೆಗೆದುಹಾಕಿ', hi: 'हटाएँ' },
  noSaved: {
    en: 'Nothing saved yet. Tap the star on a place to keep it here.',
    kn: 'ಇನ್ನೂ ಏನೂ ಉಳಿಸಿಲ್ಲ. ಸ್ಥಳವನ್ನು ಇಲ್ಲಿ ಇರಿಸಲು ನಕ್ಷತ್ರ ಒತ್ತಿ.',
    hi: 'अभी कुछ सहेजा नहीं गया। किसी जगह को यहाँ रखने के लिए तारे पर टैप करें।'
  },
  share: { en: 'Share', kn: 'ಹಂಚಿಕೊಳ್ಳಿ', hi: 'साझा करें' },
  linkCopied: { en: 'Link copied', kn: 'ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ', hi: 'लिंक कॉपी हो गया' },
  shareText: {
    en: (name) => `${name} — find it on the DSU Campus Navigator`,
    kn: (name) => `${name} — DSU ಕ್ಯಾಂಪಸ್ ನ್ಯಾವಿಗೇಟರ್‌ನಲ್ಲಿ ನೋಡಿ`,
    hi: (name) => `${name} — DSU कैंपस नेविगेटर पर देखें`
  },
  chatTitle: { en: 'Ask about the campus', kn: 'ಕ್ಯಾಂಪಸ್ ಬಗ್ಗೆ ಕೇಳಿ', hi: 'परिसर के बारे में पूछें' },
  chatOpen: { en: 'Ask a question', kn: 'ಪ್ರಶ್ನೆ ಕೇಳಿ', hi: 'सवाल पूछें' },
  chatSend: { en: 'Send', kn: 'ಕಳುಹಿಸಿ', hi: 'भेजें' },
  chatPlaceholder: {
    en: 'Ask in any language…',
    kn: 'ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ…',
    hi: 'किसी भी भाषा में पूछें…'
  },
  chatIntro: {
    en: 'Ask in whatever language you are comfortable with. Answers come only from what has been mapped, so anything not on the map will be said to be missing rather than guessed at.',
    kn: 'ನಿಮಗೆ ಸುಲಭವಾದ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ. ಉತ್ತರಗಳು ನಕ್ಷೆಯಲ್ಲಿ ದಾಖಲಾದ ಮಾಹಿತಿಯಿಂದ ಮಾತ್ರ ಬರುತ್ತವೆ; ಇಲ್ಲದಿದ್ದರೆ ಊಹಿಸದೆ ಇಲ್ಲ ಎಂದು ಹೇಳಲಾಗುತ್ತದೆ.',
    hi: 'जिस भाषा में सहज हों उसी में पूछें। उत्तर केवल नक्शे में दर्ज जानकारी से आते हैं; जो दर्ज नहीं है उसका अनुमान नहीं लगाया जाएगा।'
  },
  chatUnset: {
    en: 'The assistant is not configured yet. Set VITE_CHAT_URL and rebuild.',
    kn: 'ಸಹಾಯಕ ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ. VITE_CHAT_URL ಹೊಂದಿಸಿ ಮತ್ತೆ ಬಿಲ್ಡ್ ಮಾಡಿ.',
    hi: 'सहायक अभी सेट नहीं है। VITE_CHAT_URL सेट करके दोबारा बिल्ड करें।'
  },
  chatFailed: {
    en: 'That did not go through. Try again in a moment.',
    kn: 'ಅದು ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.',
    hi: 'यह नहीं भेजा जा सका। थोड़ी देर बाद कोशिश करें।'
  },
  micStart: { en: 'Speak your question', kn: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಹೇಳಿ', hi: 'अपना सवाल बोलें' },
  micListening: { en: 'Listening…', kn: 'ಕೇಳುತ್ತಿದೆ…', hi: 'सुन रहा है…' },
  micDenied: {
    en: 'Microphone access was denied. You can still type your question.',
    kn: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ನೀವು ಟೈಪ್ ಮಾಡಬಹುದು.',
    hi: 'माइक्रोफ़ोन की अनुमति नहीं मिली। आप टाइप कर सकते हैं।'
  },
  micUnsupported: {
    en: 'Voice input is not supported in this browser.',
    kn: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬೆಂಬಲವಿಲ್ಲ.',
    hi: 'इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है।'
  },
  chatOffline: {
    en: 'No connection. The map still works offline, but questions need signal.',
    kn: 'ಸಂಪರ್ಕವಿಲ್ಲ. ನಕ್ಷೆ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಆದರೆ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಿಗ್ನಲ್ ಬೇಕು.',
    hi: 'कनेक्शन नहीं है। नक्शा ऑफ़लाइन चलता है, पर सवालों के लिए सिग्नल चाहिए।'
  },
  startNav: { en: 'Start navigation', kn: 'ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭಿಸಿ', hi: 'नेविगेशन शुरू करें' },
  stopNav: { en: 'End', kn: 'ಮುಗಿಸಿ', hi: 'समाप्त करें' },
  navDepart: {
    en: (dir) => `Head ${dir}`,
    kn: (dir) => `${dir} ದಿಕ್ಕಿನಲ್ಲಿ ಹೋಗಿ`,
    hi: (dir) => `${dir} की ओर जाएँ`
  },
  navTurn: {
    en: { left: 'Turn left', right: 'Turn right', 'sharp-left': 'Turn sharp left', 'sharp-right': 'Turn sharp right', 'u-turn': 'Turn around' },
    kn: { left: 'ಎಡಕ್ಕೆ ತಿರುಗಿ', right: 'ಬಲಕ್ಕೆ ತಿರುಗಿ', 'sharp-left': 'ತೀವ್ರವಾಗಿ ಎಡಕ್ಕೆ ತಿರುಗಿ', 'sharp-right': 'ತೀವ್ರವಾಗಿ ಬಲಕ್ಕೆ ತಿರುಗಿ', 'u-turn': 'ಹಿಂತಿರುಗಿ' },
    hi: { left: 'बाएँ मुड़ें', right: 'दाएँ मुड़ें', 'sharp-left': 'तेज़ बाएँ मुड़ें', 'sharp-right': 'तेज़ दाएँ मुड़ें', 'u-turn': 'वापस मुड़ें' }
  },
  navArrived: { en: "You've arrived", kn: 'ನೀವು ತಲುಪಿದ್ದೀರಿ', hi: 'आप पहुँच गए' },
  navThenContinue: { en: 'then continue for', kn: 'ನಂತರ ಮುಂದುವರಿಸಿ', hi: 'फिर आगे बढ़ें' },
  navRemaining: { en: 'remaining', kn: 'ಬಾಕಿ', hi: 'शेष' },
  navOffRoute: {
    en: "You've wandered off the traced path. Directions may not be reliable here.",
    kn: 'ನೀವು ಗುರುತಿಸಿದ ದಾರಿಯಿಂದ ಹೊರಗೆ ಹೋಗಿದ್ದೀರಿ. ಇಲ್ಲಿ ಸೂಚನೆಗಳು ನಿಖರವಾಗಿಲ್ಲದಿರಬಹುದು.',
    hi: 'आप दर्ज किए गए रास्ते से भटक गए हैं। यहाँ दिशा-निर्देश सही न हो सकते हैं।'
  },
  navDir: {
    en: { north:'north', northeast:'northeast', east:'east', southeast:'southeast', south:'south', southwest:'southwest', west:'west', northwest:'northwest' },
    kn: { north:'ಉತ್ತರ', northeast:'ಈಶಾನ್ಯ', east:'ಪೂರ್ವ', southeast:'ಆಗ್ನೇಯ', south:'ದಕ್ಷಿಣ', southwest:'ನೈಋತ್ಯ', west:'ಪಶ್ಚಿಮ', northwest:'ವಾಯುವ್ಯ' },
    hi: { north:'उत्तर', northeast:'उत्तर-पूर्व', east:'पूर्व', southeast:'दक्षिण-पूर्व', south:'दक्षिण', southwest:'दक्षिण-पश्चिम', west:'पश्चिम', northwest:'उत्तर-पश्चिम' }
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

export const VOICE_LOCALE = { en: 'en-IN', kn: 'kn-IN', hi: 'hi-IN' };

export function detectLanguage() {
  const saved = localStorage.getItem('dsu-lang');
  if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANGUAGES.some(l => l.code === nav) ? nav : 'en';
}
