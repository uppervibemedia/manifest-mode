import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabStacks = {};

export function useTabStack(tabId, rootPath) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize or restore stack for this tab
    if (!tabStacks[tabId]) {
      tabStacks[tabId] = [rootPath];
    }

    // If navigating to a new route on this tab
    if (location.pathname !== tabStacks[tabId][tabStacks[tabId].length - 1]) {
      if (!tabStacks[tabId].includes(location.pathname)) {
        tabStacks[tabId].push(location.pathname);
      }
    }
  }, [location.pathname, tabId, rootPath]);

  const resetTab = () => {
    tabStacks[tabId] = [rootPath];
    navigate(rootPath);
  };

  return { resetTab, currentStack: tabStacks[tabId] || [rootPath] };
}

export function getTabStack(tabId) {
  return tabStacks[tabId] || [];
}