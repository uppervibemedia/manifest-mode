import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Bell, Crown, RotateCcw, LogOut, ChevronRight, Shield, Flame } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const TIER_COLORS = {
  free: "text-muted-foreground",
  supporter: "text-blue-400",
  premium: "text-primary",
};
const TIER_LABELS = {
  free: "Free",
  supporter: "Supporter",
  premium: "Premium ✦",
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      const p = await base44.entities.UserProfile.filter({ user_email: u.email });
      setProfile(p[0] || null);
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => base44.auth.logout("/");

  const handleResetAssessment = async () => {
    if (!confirm("This will reset your assessment data. Are you sure?")) return;
    const user = await base44.auth.me();
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { onboarding_completed: false });
    }
    navigate("/assessment");
  };

  const toggleNotifications = async () => {
    if (!profile) return;
    const updated = await base44.entities.UserProfile.update(profile.id, {
      notifications_enabled: !profile.notifications_enabled,
    });
    setProfile(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }));
  };

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const tier = profile?.subscription_tier || "free";

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Account</p>
          <h1 className="font-playfair text-2xl font-semibold">Profile</h1>
        </div>

        {/* User Info */}
        <div className="glass-card glow-gold rounded-2xl p-5 mb-5 flex items-center gap-4 border border-primary/10">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-background text-xl font-bold shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Crown className={`w-3.5 h-3.5 ${TIER_COLORS[tier]}`} />
              <span className={`text-xs font-semibold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span className="text-lg font-bold text-foreground font-playfair">{profile?.streak_count || 0}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-foreground font-playfair block mb-1">
              {profile?.goal_categories?.length || 0}
            </span>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-foreground font-playfair block mb-1">
              {profile?.onboarding_completed ? "✓" : "—"}
            </span>
            <p className="text-[10px] text-muted-foreground">Assessed</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-5">
          <button onClick={() => navigate("/pricing")}
            className="w-full glass-card border border-primary/20 rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 transition-colors">
            <Crown className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Subscription & Plans</p>
              <p className="text-xs text-muted-foreground">Currently on {TIER_LABELS[tier]}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="glass-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">Daily reminders</p>
            </div>
            <button onClick={toggleNotifications}
              className={`w-11 h-6 rounded-full transition-all ${profile?.notifications_enabled ? "bg-primary" : "bg-border"} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                profile?.notifications_enabled ? "left-5" : "left-0.5"
              }`} />
            </button>
          </div>

          <button onClick={() => navigate("/tracker")}
            className="w-full glass-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Progress & Analytics</p>
              <p className="text-xs text-muted-foreground">View your evolution</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={handleResetAssessment}
            className="w-full glass-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-orange-500/30 transition-colors">
            <RotateCcw className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Retake Assessment</p>
              <p className="text-xs text-muted-foreground">Update your current reality data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Goal Categories */}
        {profile?.goal_categories?.length > 0 && (
          <div className="glass-card border border-border rounded-xl p-4 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Your Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {profile.goal_categories.map(cat => (
                <span key={cat} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium capitalize">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full glass-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-destructive/30 transition-colors">
          <LogOut className="w-5 h-5 text-destructive/70 shrink-0" />
          <p className="text-sm font-medium text-destructive/80">Log Out</p>
        </button>
      </div>
    </AppLayout>
  );
}