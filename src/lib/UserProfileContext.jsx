import { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

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
      const u = await base44.auth.me();
      if (!u) {
        clearProfile();
        setLoading(false);
        return;
      }
      // User changed (logout/login different account)
      if (prevUserEmail && prevUserEmail !== u.email) {
        setProfile(null);
      }
      setUser(u);
      setPrevUserEmail(u.email);
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