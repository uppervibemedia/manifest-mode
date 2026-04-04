/**
 * Returns today's date as YYYY-MM-DD in the user's LOCAL timezone.
 * This ensures the check-in resets at midnight local time, not UTC midnight.
 */
export function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}