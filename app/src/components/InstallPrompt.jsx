import { useState, useEffect } from 'react';
import { t } from '../lib/i18n';

const DISMISS_KEY = 'dsu-install-dismissed';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own flag — it never fires the standard media query.
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * A QR code can only ever open the regular browser — phones have no way
 * to know a PWA exists until it's installed once. This prompt is the
 * bridge: it appears right when someone lands (often straight from a
 * gate poster), and one tap gets them to the same full-screen, no
 * address bar experience a real installed app has from then on.
 */
export default function InstallPrompt({ lang }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1'
  );
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed and running as an app

    // Chrome/Edge/Android fire this when the app is installable; capturing
    // it lets us trigger the native install dialog from our own button
    // instead of waiting for the browser's own mini-infobar.
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS Safari never fires beforeinstallprompt — there is no
    // programmatic install API there at all, only the manual Share sheet.
    if (isIOS()) setShowIOSHint(true);

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (dismissed || isStandalone() || (!deferredPrompt && !showIOSHint)) return null;

  return (
    <div className="installbar">
      <div className="installtext">
        <strong>{t('installTitle', lang)}</strong>
        <span>{showIOSHint && !deferredPrompt ? t('installIOS', lang) : t('installBody', lang)}</span>
      </div>
      <div className="installactions">
        {deferredPrompt && (
          <button className="installgo" onClick={install}>{t('installBtn', lang)}</button>
        )}
        <button className="installlater" onClick={dismiss}>{t('installLater', lang)}</button>
      </div>
    </div>
  );
}
