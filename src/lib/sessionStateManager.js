/**
 * Clear all user-session specific state when logging out
 * Prevents data leakage between accounts
 */
export function clearUserSessionState() {
  // Clear all user-scoped routing + cache keys from localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key?.startsWith('last_visit_date_') ||
      key?.startsWith('last_visited_page_') ||
      key?.startsWith('emotion-completed-')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear sessionStorage (used for same-day AI caching)
  sessionStorage.clear();
}

/**
 * Get a user-specific cache key
 * Ensures data is isolated by user + context
 */
export function getUserCacheKey(userEmail, context, date) {
  return `user_${userEmail}_${context}_${date}`;
}