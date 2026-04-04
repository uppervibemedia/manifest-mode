import { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserAndProfile = async () => {
    try {
      const u = await base44.auth.me();
      if (!u) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_email: u.email });
      setProfile(profiles[0] || null);
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  // Refetch when user logs in/out
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(async () => {
      const u = await base44.auth.me();
      if (u?.email !== user.email) {
        loadUserAndProfile();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.email]);

  const updateProfile = async (updates) => {
    if (!profile) return;
    const updated = await base44.entities.UserProfile.update(profile.id, updates);
    setProfile(updated);
    return updated;
  };

  return (
    <UserProfileContext.Provider value={{ user, profile, loading, updateProfile, refetch: loadUserAndProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}