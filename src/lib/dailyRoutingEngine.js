import { getLocalToday } from './dateUtils';

// Keys are user-scoped to prevent data leakage between accounts
function lastVisitKey(email) { return `last_visit_date_${email}`; }
function lastPageKey(email) { return `last_visited_page_${email}`; }

/**
 * Check if today is a new day compared to last app open for this user
 */
export function isNewDay(userEmail) {
  const today = getLocalToday();
  const lastVisitDate = localStorage.getItem(lastVisitKey(userEmail));
  return lastVisitDate !== today;
}

/**
 * Get the page to route to on app open
 * - New day: Daily Shift
 * - Same day: last visited page (or fallback to Daily Shift)
 */
export function getInitialRoute(userEmail) {
  const today = getLocalToday();

  if (isNewDay(userEmail)) {
    // New day: always go to Daily Shift
    localStorage.setItem(lastVisitKey(userEmail), today);
    localStorage.removeItem(lastPageKey(userEmail)); // Clear previous day's page
    return '/daily-shift';
  }

  // Same day: try to restore last visited page
  const lastPage = localStorage.getItem(lastPageKey(userEmail));
  if (lastPage && isValidPage(lastPage)) {
    return lastPage;
  }

  // Fallback to Daily Shift
  return '/daily-shift';
}

/**
 * Track page visit (called from AppLayout on navigation)
 */
export function trackPageVisit(pathname, userEmail) {
  if (isValidPage(pathname) && userEmail) {
    localStorage.setItem(lastPageKey(userEmail), pathname);
  }
}

/**
 * Check if a page is a valid trackable page (not onboarding, auth, etc)
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