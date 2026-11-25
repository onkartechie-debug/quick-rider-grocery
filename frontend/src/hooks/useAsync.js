import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/axiosClient.js';

/**
 * Runs an async loader whenever deps change. Previous data is kept while reloading,
 * so polling and refreshes don't flash a spinner. Stale responses are ignored.
 */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((res) => {
        if (active) setState({ data: res?.data !== undefined ? res.data : res, loading: false, error: null });
      })
      .catch((err) => {
        if (active) setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    [],
  );

  return { ...state, reload, setData };
}
