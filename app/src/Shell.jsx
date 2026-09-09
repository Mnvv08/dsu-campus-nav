import { useState, useEffect } from 'react';
import Home from './components/Home';
import App from './App';
import campus from './data/places.json';
import pathData from './data/paths.json';
import './site.css';

// Hash routing rather than a router library. The app is deployed to a
// static host under a subpath, and the hash needs no server rewrites and
// no extra dependency for two screens.
const routeFromHash = () => (window.location.hash.startsWith('#/map') ? 'map' : 'home');

export default function Shell() {
  const [route, setRoute] = useState(routeFromHash);
  const [openChat, setOpenChat] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Landing scroll position should not carry into the map.
  useEffect(() => {
    if (route === 'map') window.scrollTo(0, 0);
  }, [route]);

  const go = (hash, withChat = false) => {
    setOpenChat(withChat);
    window.location.hash = hash;
  };

  if (route === 'map') {
    return (
      <App
        startChat={openChat}
        onHome={() => { setOpenChat(false); window.location.hash = '#/'; }}
      />
    );
  }

  return (
    <Home
      onEnter={() => go('#/map')}
      placeCount={(campus.places ?? []).length}
      pathCount={(pathData.paths ?? []).length}
    />
  );
}
