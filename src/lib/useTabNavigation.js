import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Store stack and scroll position per tab
const tabStates = {
  shift: { path: '/daily-shift', scrollY: 0 },
  vision: { path: '/vision', scrollY: 0 },
  progress: { path: '/progress', scrollY: 0 },
  future: { path: '/future-self', scrollY: 0 },
  profile: { path: '/profile', scrollY: 0 },
};

const TAB_ROUTES = {
  shift: '/daily-shift',
  vision: '/vision',
  progress: '/progress',
  future: '/future-self',
  profile: '/profile',
};

function getTabIdFromPath(pathname) {
  for (const [id, path] of Object.entries(TAB_ROUTES)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return id;
    }
  }
  return null;
}

export function useTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const currentTabRef = useRef(null);

  // Track current tab
  useEffect(() => {
    const tabId = getTabIdFromPath(location.pathname);
    if (tabId) {
      currentTabRef.current = tabId;
    }
  }, [location.pathname]);

  // Save scroll position before switching tabs
  useEffect(() => {
    return () => {
      if (containerRef.current && currentTabRef.current) {
        tabStates[currentTabRef.current].scrollY = containerRef.current.scrollTop;
      }
    };
  }, [location.pathname]);

  // Handle tab switch
  const switchTab = (tabId) => {
    const container = containerRef.current;
    if (container) {
      tabStates[currentTabRef.current].scrollY = container.scrollTop;
    }
    navigate(tabStates[tabId].path);
    // Restore scroll on next render
    setTimeout(() => {
      if (container) {
        container.scrollTop = tabStates[tabId].scrollY;
      }
    }, 0);
  };

  // Reset tab stack (when double-tapping tab)
  const resetTab = (tabId) => {
    tabStates[tabId] = { path: TAB_ROUTES[tabId], scrollY: 0 };
    navigate(TAB_ROUTES[tabId]);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  return { containerRef, switchTab, resetTab, currentTab: currentTabRef.current };
}