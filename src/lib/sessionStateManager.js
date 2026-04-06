/**
 * Clear all user-session specific state when logging out
 * Prevents data leakage between accounts
 */
export function clearUserSessionState() {
  // Clear any user-specific localStorage keys
  const keysToRemove = [
    'last_visited_page',
    'last_visit_date',
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear sessionStorage (used for same-day caching)
  sessionStorage.clear();
}

/**
 * Get a user-specific cache key
 * Ensures data is isolated by user + context
 */
export function getUserCacheKey(userEmail, context, date) {
  return `user_${userEmail}_${context}_${date}`;
}