// Minimal hash router: routes live after the # (e.g. #/spell/a), which works on
// GitHub Pages without server rewrites and survives page reloads. Browser
// Back/Forward move between screens.
import { useEffect, useState } from 'react';

function currentPath() {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

/** The current path, e.g. "/browse/a". Re-renders on navigation and Back/Forward. */
export function useRoute() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

/** Go to a path. `replace` swaps the current history entry instead of adding one. */
export function navigate(to, { replace = false } = {}) {
  if (currentPath() === to) return;
  if (replace) {
    window.history.replaceState(null, '', `#${to}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = to;
  }
}

/** Link target for a path: "#/browse/a". */
export const href = to => `#${to}`;
