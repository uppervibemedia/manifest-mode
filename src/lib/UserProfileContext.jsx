import { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { hasRevenueCatBridge } from "@/lib/platform";
import { syncRevenueCatStatus } from "@/lib/revenueCatBridge";

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevUserEmail, setPrevUserEmail] = useState(null);

  const clearProfile = () => {
    setUser(null);
    setProfile(null);
    setPrevUserEmail(null);
  };

  const loadUserAndProfile = async () => {
    try {
      let u;
      try {
        u = await base44.auth.me();
      } catch (authError) {
        // Not authenticated (public user or expired token)
        clearProfile();
        setLoading(false);
        return;
      }
      
      if (!u) {
        clearProfile();
        setLoading(false);
        return;
      }
      // User changed (logout/login different account) — clear old profile
      if (prevUserEmail && prevUserEmail !== u.email) {
        setProfile(null);
      }
      setUser(u);
      setPrevUserEmail(u.email);
      
      // Load or create profile for new user
      const profiles = await base44.entities.UserProfile.filter({ user_email: u.email });
      let userProfile = profiles[0];
      
      // Auto-create profile for new users
      if (!userProfile) {
        try {
          userProfile = await base44.entities.UserProfile.create({
            user_email: u.email,
            onboarding_completed: false,
            subscription_tier: "free",
            billing_cycle: "monthly",
            ai_credits: 0,
            notifications_enabled: true,
            streak_count: 0,
            alignment_points: 0,
            identity_level: 0,
            total_habits_completed: 0,
            total_checkins: 0,
            total_journal_entries: 0,
          });
          console.log("Auto-created user profile for new user:", u.email);
        } catch (createError) {
          console.error("Failed to create user profile:", createError);
          // Continue anyway — user can still use the app
        }
      }
      
      setProfile(userProfile || null);

      // On iOS native: sync RevenueCat entitlement state on every app launch / refetch
      // This ensures the profile reflects the real Apple subscription state
      // even if the user renewed, cancelled, or was downgraded server-side.
      if (hasRevenueCatBridge()) {
        try {
          await syncRevenueCatStatus();
          // Re-fetch profile after sync to pick up any tier changes
          const refreshed = await base44.entities.UserProfile.filter({ user_email: u.email });
          if (refreshed[0]) setProfile(refreshed[0]);
        } catch (rcError) {
          console.warn("RevenueCat sync skipped:", rcError.message);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndProfile();
  }, []);



  const updateProfile = async (updates) => {
    if (!profile) return;
    const updated = await base44.entities.UserProfile.update(profile.id, updates);
    setProfile(updated);
    return updated;
  };

  return (
    <UserProfileContext.Provider value={{ user, profile, loading, updateProfile, refetch: loadUserAndProfile, clearProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}