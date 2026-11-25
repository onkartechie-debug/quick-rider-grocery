import { useEffect, useRef } from 'react';

/** Calls `callback` every `delay` ms while the tab is visible. Pass null to pause. */
export default function useInterval(callback, delay) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (delay === null || delay === undefined) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') saved.current();
    }, delay);
    return () => clearInterval(id);
  }, [delay]);
}
