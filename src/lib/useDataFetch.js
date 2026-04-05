import { useEffect, useRef } from 'react';

export function useDataFetch(fetchFn, deps = [], options = {}) {
  const { initialDelay = 0, debounce = 0 } = options;
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const executesFetch = () => {
      if (isMountedRef.current) {
        fetchFn();
      }
    };

    if (debounce > 0) {
      debounceTimerRef.current = setTimeout(executesFetch, debounce);
    } else if (initialDelay > 0) {
      const delayTimer = setTimeout(executesFetch, initialDelay);
      return () => clearTimeout(delayTimer);
    } else {
      executesFetch();
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, deps);
}