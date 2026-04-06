import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getLocalToday } from "@/lib/dateUtils";

const FIRST_APP_KEY = "app_first_visit_date";

/**
 * Hook that redirects to Daily Shift on the user's first app open of each day.
 * After the redirect, normal navigation resumes.
 */
export function useFirstAppOfDay(user, isLoading) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !user) return;

    const today = getLocalToday();
    const lastVisit = sessionStorage.getItem(FIRST_APP_KEY);

    // First open of the day: redirect to Daily Shift
    if (lastVisit !== today) {
      sessionStorage.setItem(FIRST_APP_KEY, today);
      // Only redirect if not already on Daily Shift or onboarding paths
      if (
        !location.pathname.startsWith("/daily-shift") &&
        !location.pathname.startsWith("/onboarding") &&
        !location.pathname.startsWith("/assessment")
      ) {
        navigate("/daily-shift", { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);
}