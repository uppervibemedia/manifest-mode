import { getLocalToday } from './dateUtils';

const LAST_VISIT_KEY = 'last_visit_date';
const LAST_PAGE_KEY = 'last_visited_page';

/**
 * Check if today is a new day compared to last app open
 */
export function isNewDay() {
  const today = getLocalToday();
  const lastVisitDate = localStorage.getItem(LAST_VISIT_KEY);
  return lastVisitDate !== today;
}

/**
 * Get the page to route to on app open
 * - New day: Daily Shift
 * - Same day: last visited page (or fallback to Daily Shift)
 */
export function getInitialRoute() {
  const today = getLocalToday();
  
  if (isNewDay()) {
    // New day: always go to Daily Shift
    localStorage.setItem(LAST_VISIT_KEY, today);
    localStorage.removeItem(LAST_PAGE_KEY); // Clear previous day's page
    return '/daily-shift';
  }
  
  // Same day: try to restore last visited page
  const lastPage = localStorage.getItem(LAST_PAGE_KEY);
  if (lastPage && isValidPage(lastPage)) {
    return lastPage;
  }
  
  // Fallback to Daily Shift
  return '/daily-shift';
}

/**
 * Track page visit (call from AppLayout or when user navigates)
 */
export function trackPageVisit(pathname) {
  if (isValidPage(pathname)) {
    localStorage.setItem(LAST_PAGE_KEY, pathname);
  }
}

/**
 * Check if a page is a valid app page (not onboarding, auth, etc)
 */
function isValidPage(pathname) {
  const validPages = [
    '/daily-shift',
    '/vision',
    '/progress',
    '/future-self',
    '/profile',
  ];
  return validPages.some(p => pathname.startsWith(p));
}