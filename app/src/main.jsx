import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Shell from './Shell.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Shell />
  </StrictMode>
);

// Registered after load so the first paint is never delayed by it.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // Offline support is a bonus; the app works without it.
      });
  });
}
