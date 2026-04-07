import { useEffect, useRef, useState } from 'react';

/**
 * Attaches pull-to-refresh to a scroll container element.
 * @param {React.RefObject} containerRef - ref to the scrollable container
 * @param {() => Promise<void>} onRefresh - async callback to run on pull
 * @returns {{ isRefreshing: boolean }}
 */
export function usePullToRefresh(containerRef, onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (container.scrollTop !== 0) return;
      const deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY > 80 && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        });
      }
    };

    const handleTouchEnd = () => {
      startYRef.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, onRefresh]);

  return { isRefreshing };
}